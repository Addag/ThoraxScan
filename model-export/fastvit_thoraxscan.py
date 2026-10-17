from pathlib import Path

import timm
import torch
import torch.nn as nn
from timm.utils.model import reparameterize_model

NUM_LABELS = 14
# Local copy of https://huggingface.co/timm/fastvit_sa12.apple_in1k (SHA-256 4c41bc35...b5afa),
# so training never contacts the Hugging Face Hub.
PRETRAINED_FILE = Path(__file__).parent / "pretrained" / "fastvit_sa12.apple_in1k.safetensors"


class FastViTThoraxScan(nn.Module):
    """FastViT-SA12 for the ThoraxScan contract: 1x224x224 normalized grayscale in, 14 logits out."""

    def __init__(self, pretrained=True):
        super().__init__()
        self.backbone = timm.create_model(
            "fastvit_sa12.apple_in1k", pretrained=pretrained, num_classes=NUM_LABELS,
            pretrained_cfg_overlay={"file": str(PRETRAINED_FILE)},
        )

    def forward(self, x):
        # Grayscale -> 3 channels so ImageNet weights load unchanged; preprocessing stays (x-0.5)/0.25.
        return self.backbone(x.repeat(1, 3, 1, 1))


def attention_modules(model):
    """Global attention blocks (stage 4, 7x7 tokens at 224) for rollout."""
    return [m for n, m in model.named_modules() if type(m).__name__ == "Attention"]


if __name__ == "__main__":
    m = FastViTThoraxScan(pretrained=False).eval()
    x = torch.randn(2, 1, 224, 224)
    attn_maps = []
    for a in attention_modules(m):
        a.fused_attn = False
        a.attn_drop.register_forward_hook(lambda _m, _i, out: attn_maps.append(out))
    with torch.no_grad():
        before = m(x)
        fused = reparameterize_model(m)
        after = fused(x)
    assert before.shape == (2, NUM_LABELS)
    assert len(attn_maps) >= 1 and attn_maps[0].shape[-1] == 49, [t.shape for t in attn_maps]
    assert torch.allclose(before, after, atol=1e-3), (before - after).abs().max()
    print("ok", [tuple(t.shape) for t in attn_maps], sum(p.numel() for p in fused.parameters()) / 1e6, "M params")
