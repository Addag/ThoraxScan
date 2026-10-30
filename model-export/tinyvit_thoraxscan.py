from pathlib import Path

import timm
import torch
import torch.nn as nn

NUM_LABELS = 14
# Local copy of https://huggingface.co/timm/tiny_vit_11m_224.dist_in22k_ft_in1k model.safetensors
# (SHA-256 b08354fd...38b1b6, downloaded by the owner), so training never contacts the Hugging Face Hub.
PRETRAINED_FILE = Path(__file__).parent / "pretrained" / "tiny_vit_11m_224.dist_in22k_ft_in1k.safetensors"
# The browser contract normalizes grayscale with (x - 0.5) / 0.25; the backbone was pretrained on ImageNet statistics.
CONTRACT_MEAN, CONTRACT_STD = 0.5, 0.25
IMAGENET_MEAN = (0.485, 0.456, 0.406)
IMAGENET_STD = (0.229, 0.224, 0.225)


class TinyViTThoraxScan(nn.Module):
    """TinyViT-11M (hybrid: MBConv stage + 3 attention stages) for the ThoraxScan contract: 1x224x224 in, 14 logits out."""

    def __init__(self, pretrained=True, drop_path_rate=0.0):
        super().__init__()
        self.backbone = timm.create_model(
            "tiny_vit_11m_224.dist_in22k_ft_in1k", pretrained=pretrained, num_classes=NUM_LABELS,
            drop_path_rate=drop_path_rate, pretrained_cfg_overlay={"file": str(PRETRAINED_FILE)},
        )
        self.register_buffer("mean", torch.tensor(IMAGENET_MEAN).view(1, 3, 1, 1), persistent=False)
        self.register_buffer("std", torch.tensor(IMAGENET_STD).view(1, 3, 1, 1), persistent=False)

    def to_imagenet(self, x):
        # Undo the contract normalization, repeat grayscale to RGB, then apply ImageNet normalization.
        return ((x * CONTRACT_STD + CONTRACT_MEAN).repeat(1, 3, 1, 1) - self.mean) / self.std

    def forward(self, x):
        return self.backbone(self.to_imagenet(x))


if __name__ == "__main__":
    m = TinyViTThoraxScan(pretrained=PRETRAINED_FILE.exists()).eval()
    with torch.no_grad():
        out = m(torch.randn(2, 1, 224, 224))
        features = m.backbone.forward_features(m.to_imagenet(torch.randn(1, 1, 224, 224)))
    assert out.shape == (2, NUM_LABELS)
    assert features.shape[-2:] == (7, 7), features.shape
    print("ok", tuple(out.shape), tuple(features.shape), sum(p.numel() for p in m.parameters()) / 1e6, "M params")
