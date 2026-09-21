"""Export the pinned SqueezeViT checkpoint with logits and global attention rollout."""
from pathlib import Path
import argparse, sys, torch
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / ".." / "LPU 2025 - 2026 2nd Sem" / "IT 14" / "ViT_Models"))
from squeezevit import SqueezeViT

class ExportModel(SqueezeViT):
    def forward(self, x):
        x = self.stem(x); x = self.stage1(x); res = x
        local = self.stage2.fire1(x); local = self.stage2.fire2(local)
        tokens = self.stage2.token_conv(local); tokens = tokens.flatten(2).transpose(1, 2) + self.stage2.pos_embedding[:, :tokens.shape[2] * tokens.shape[3]]
        roll = torch.eye(tokens.shape[1], device=tokens.device).expand(tokens.shape[0], -1, -1)
        for block in self.stage2.transformers:
            tokens = block(tokens)
            attn = block.last_attention
            roll = torch.bmm(attn + torch.eye(tokens.shape[1], device=tokens.device), roll)
            roll = roll / roll.sum(-1, keepdim=True)
        tokens = tokens.transpose(1, 2).view(local.shape[0], local.shape[1], 7, 7)
        tokens = torch.nn.functional.interpolate(tokens, size=(x.shape[2], x.shape[3]), mode="bilinear", align_corners=False)
        tokens = self.stage2.proj_conv(tokens); x = self.stage2.fuse_fire(torch.cat([res, tokens], dim=1)); x = self.stage3(x); x = self.head_conv(x)
        logits = self.fc(self.pool(x).flatten(1)); attention = roll.mean(1).view(-1, 1, 7, 7)
        lo = attention.flatten(1).amin(1, keepdim=True); hi = attention.flatten(1).amax(1, keepdim=True); attention = torch.where(hi > lo, (attention.flatten(1)-lo)/(hi-lo), torch.zeros_like(attention.flatten(1))).view(-1,1,7,7)
        return logits, attention

def main():
    ap=argparse.ArgumentParser(); ap.add_argument("--checkpoint", type=Path, required=True); ap.add_argument("--output", type=Path, required=True); args=ap.parse_args()
    model=ExportModel(num_classes=14); state=torch.load(args.checkpoint, map_location="cpu"); model.load_state_dict(state.get("model_state_dict", state)); model.eval(); args.output.parent.mkdir(parents=True, exist_ok=True)
    torch.onnx.export(model, torch.randn(1,1,224,224), args.output, input_names=["input"], output_names=["logits","attention_map"], dynamic_axes={"input":{0:"batch"},"logits":{0:"batch"},"attention_map":{0:"batch"}}, opset_version=17, dynamo=False)
if __name__ == "__main__": main()
