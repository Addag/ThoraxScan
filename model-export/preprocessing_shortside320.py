"""Reference implementation of ThoraxScan preprocessing with resize "shortside320-bilinear-center".

Mirrors src/lib/inference/preprocess.ts: decode as opaque RGB, convert with Rec. 601 luma, and when the
short side exceeds 320 first resize to short side 320 (long side floored), the way CheXpert-small was
made, then resize to 224x224. Both resizes are center-aligned bilinear without an antialias filter;
intermediates stay float64. Normalize and emit one little-endian float32 NCHW plane.

    python preprocessing_shortside320.py <image> <output.f32>
    python preprocessing_shortside320.py --write-fixture <bundle>/fixtures
"""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
from PIL import Image


MODEL_INPUT_SIZE = 224
TRAINING_SHORT_SIDE = 320


def resize_bilinear(plane: np.ndarray, width: int, height: int) -> np.ndarray:
    source_height, source_width = plane.shape

    def coordinates(size, source_size):
        target = np.arange(size, dtype=np.float64)
        source = np.clip(((target + 0.5) * source_size) / size - 0.5, 0, source_size - 1)
        low = np.floor(source).astype(np.int64)
        return low, np.minimum(source_size - 1, low + 1), source - low

    x0, x1, x_weight = coordinates(width, source_width)
    y0, y1, y_weight = coordinates(height, source_height)
    top = plane[y0[:, None], x0[None, :]] * (1.0 - x_weight)[None, :] + plane[y0[:, None], x1[None, :]] * x_weight[None, :]
    bottom = plane[y1[:, None], x0[None, :]] * (1.0 - x_weight)[None, :] + plane[y1[:, None], x1[None, :]] * x_weight[None, :]
    return top * (1.0 - y_weight)[:, None] + bottom * y_weight[:, None]


def training_size(width: int, height: int) -> tuple[int, int]:
    if min(width, height) <= TRAINING_SHORT_SIDE:
        return width, height
    if width < height:
        return TRAINING_SHORT_SIDE, height * TRAINING_SHORT_SIDE // width
    return width * TRAINING_SHORT_SIDE // height, TRAINING_SHORT_SIDE


def preprocess_rgb(rgb: np.ndarray) -> np.ndarray:
    if rgb.ndim != 3 or rgb.shape[2] != 3 or rgb.dtype != np.uint8:
        raise ValueError("Expected an HxWx3 uint8 RGB image.")
    channels = rgb.astype(np.float64)
    plane = ((0.299 * channels[:, :, 0] + 0.587 * channels[:, :, 1] + 0.114 * channels[:, :, 2]) / 255.0).astype(np.float32)
    height, width = plane.shape
    stage_width, stage_height = training_size(width, height)
    if (stage_width, stage_height) != (width, height):
        plane = resize_bilinear(plane, stage_width, stage_height)
    resized = resize_bilinear(plane, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE)
    return ((resized - 0.5) / 0.25).astype("<f4")


def preprocess_image(path: Path) -> np.ndarray:
    with Image.open(path) as image:
        if image.mode in {"RGBA", "LA"} or "transparency" in image.info:
            raise ValueError("Images with alpha are outside ModelManifestV1.")
        return preprocess_rgb(np.asarray(image.convert("RGB"), dtype=np.uint8))


def write_fixture(directory: Path) -> None:
    """A deterministic 480x400 RGB PNG with fine stripes, so stage 1 runs and aliasing shows."""
    y, x = np.mgrid[0:400, 0:480].astype(np.float64)
    base = 128 + 60 * np.sin(x / 37.0) * np.cos(y / 53.0) + 40 * np.sin((x + 2 * y) / 1.7)
    rgb = np.stack([base, base * 0.9 + 12, base * 1.05 - 6], axis=2)
    directory.mkdir(parents=True, exist_ok=True)
    Image.fromarray(np.clip(np.rint(rgb), 0, 255).astype(np.uint8), "RGB").save(directory / "preprocessing-input.png")
    (directory / "expected-tensor.f32").write_bytes(preprocess_image(directory / "preprocessing-input.png").tobytes(order="C"))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path, nargs="?")
    parser.add_argument("output", type=Path, nargs="?")
    parser.add_argument("--write-fixture", type=Path, help="write preprocessing-input.png and expected-tensor.f32 here")
    args = parser.parse_args()
    if args.write_fixture:
        write_fixture(args.write_fixture)
    elif args.input and args.output:
        args.output.write_bytes(preprocess_image(args.input).tobytes(order="C"))
    else:
        parser.error("give <input> <output> or --write-fixture <directory>")


if __name__ == "__main__":
    main()
