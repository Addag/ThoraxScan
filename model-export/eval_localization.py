"""Pointing game on NIH ChestX-ray14 radiologist boxes: does the heatmap's peak fall inside the box?

Compares the V3 per-label class activation map against the V2 global attention rollout for one SqueezeViT
checkpoint, plus an image-centre baseline. Boxes are in the original 1024x1024 pixel space, so both maps are
bilinearly upsampled there (cell-centre aligned, like the app's overlay) before taking the peak.

    python eval_localization.py --checkpoint <path>/squeezevit_v5_best.pth --nih-dir C:/Users/MSI/Downloads/nih-chest-xray
"""
import argparse
from pathlib import Path

import numpy as np
import pandas as pd
import torch
import torch.nn.functional as F
from PIL import Image

from export_squeezevit import ExportModel as RolloutModel
from export_squeezevit_cam import ExportModel as CamModel

LABELS = ["No Finding", "Enlarged Cardiomediastinum", "Cardiomegaly", "Lung Opacity", "Lung Lesion", "Edema",
          "Consolidation", "Pneumonia", "Atelectasis", "Pneumothorax", "Pleural Effusion", "Pleural Other", "Fracture",
          "Support Devices"]
BOX_TO_LABEL = {"Atelectasis": "Atelectasis", "Cardiomegaly": "Cardiomegaly", "Effusion": "Pleural Effusion",
                "Infiltrate": "Lung Opacity", "Mass": "Lung Lesion", "Nodule": "Lung Lesion", "Pneumonia": "Pneumonia",
                "Pneumothorax": "Pneumothorax"}


def preprocess(path):
    # Browser contract V1: Rec. 601 luma, centre-aligned bilinear resize without antialias, (x - 0.5) / 0.25.
    with Image.open(path) as image:
        rgb = np.asarray(image.convert("RGB"), dtype=np.float64)
    gray = torch.from_numpy((rgb @ [0.299, 0.587, 0.114] / 255.0).astype(np.float32))[None, None]
    resized = F.interpolate(gray, size=(224, 224), mode="bilinear", align_corners=False, antialias=False)
    return (resized[0] - 0.5) / 0.25, gray.shape[-2:]


def peak(grid_map, size):
    """(x, y) of the maximum after upsampling a (h, w) map to the image's (height, width)."""
    up = F.interpolate(grid_map[None, None], size=tuple(size), mode="bilinear", align_corners=False)[0, 0]
    y, x = divmod(int(up.argmax()), up.shape[1])
    return x, y


def hit(point, box):
    x, y = point
    bx, by, bw, bh = box
    return bx <= x <= bx + bw and by <= y <= by + bh


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--checkpoint", type=Path, required=True)
    parser.add_argument("--nih-dir", type=Path, required=True)
    parser.add_argument("--output", type=Path, help="CSV of per-label hit rates (default: next to the checkpoint)")
    args = parser.parse_args()
    torch.backends.mha.set_fastpath_enabled(False)
    state = torch.load(args.checkpoint, map_location="cpu", weights_only=True)
    state = state.get("model_state_dict", state)
    cam_model, rollout_model = CamModel().eval(), RolloutModel().eval()
    cam_model.load_state_dict(state)
    rollout_model.load_state_dict(state)

    boxes = pd.read_csv(args.nih_dir / "BBox_List_2017.csv").iloc[:, :6]
    boxes.columns = ["image", "finding", "x", "y", "w", "h"]
    paths = {p.name: p for p in args.nih_dir.glob("images_*/images/*.png")}
    rows = []
    with torch.no_grad():
        for image, group in boxes.groupby("image"):
            tensor, size = preprocess(paths[image])
            _, cam = cam_model(tensor[None])
            _, rollout = rollout_model(tensor[None])
            rollout_peak = peak(rollout[0, 0], size)
            for box in group.itertuples():
                label = BOX_TO_LABEL[box.finding]
                rect = (box.x, box.y, box.w, box.h)
                rows.append({"finding": box.finding, "label": label,
                             "cam": hit(peak(cam[0, LABELS.index(label)], size), rect),
                             "rollout": hit(rollout_peak, rect),
                             "centre": hit((size[1] / 2, size[0] / 2), rect)})

    results = pd.DataFrame(rows)
    table = results.groupby("finding")[["cam", "rollout", "centre"]].mean().assign(boxes=results.groupby("finding").size())
    table.loc["All boxes"] = [*results[["cam", "rollout", "centre"]].mean(), len(results)]
    table["boxes"] = table["boxes"].astype(int)
    output = args.output or args.checkpoint.with_name(f"{args.checkpoint.stem}_pointing_game.csv")
    table.to_csv(output)
    print(table.round(3).to_string())
    print(f"\nPointing-game hit rate on {len(results)} NIH boxes ({args.checkpoint.name}); wrote {output}")


if __name__ == "__main__":
    main()
