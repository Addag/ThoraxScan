import torch
import torch.nn as nn
import torch.nn.functional as F

class FireModule(nn.Module):
    """
    Standard Fire Module as defined in Section 3.2 using a squeeze ratio of 0.5
    and parallel 1x1 and 3x3 excitation layers.
    """
    def __init__(self, in_channels, out_channels):
        super().__init__()
        # Paper states: squeeze layer outputs half the number of input channels (or matches architecture bottlenecks)
        # To get out_channels, expand1x1 and expand3x3 each produce out_channels // 2
        squeeze_channels = out_channels // 4 if out_channels > 32 else 8
        
        self.squeeze = nn.Sequential(
            nn.Conv2d(in_channels, squeeze_channels, kernel_size=1),
            nn.BatchNorm2d(squeeze_channels),
            nn.SiLU() # Paper mentions ReLU/SiLU interchangeably; your script utilizes SiLU
        )

        self.expand1 = nn.Sequential(
            nn.Conv2d(squeeze_channels, out_channels // 2, kernel_size=1),
            nn.BatchNorm2d(out_channels // 2),
            nn.SiLU()
        )

        self.expand3 = nn.Sequential(
            nn.Conv2d(squeeze_channels, out_channels // 2, kernel_size=3, padding=1),
            nn.BatchNorm2d(out_channels // 2),
            nn.SiLU()
        )

    def forward(self, x):
        x = self.squeeze(x)
        return torch.cat([self.expand1(x), self.expand3(x)], dim=1)


class TransformerEncoder(nn.Module):
    def __init__(self, dim=64, heads=4):
        super().__init__()
        self.attn = nn.MultiheadAttention(dim, heads, batch_first=True)
        self.norm1 = nn.LayerNorm(dim)
        self.norm2 = nn.LayerNorm(dim)

        self.mlp = nn.Sequential(
            nn.Linear(dim, dim * 2),
            nn.GELU(),
            nn.Linear(dim * 2, dim)
        )

    def forward(self, x):
        attn_out, self.last_attention = self.attn(x, x, x, need_weights=True, average_attn_weights=True)
        x = self.norm1(x + attn_out)
        x = self.norm2(x + self.mlp(x))
        return x


class TranslutionBlock(nn.Module):
    def __init__(self, in_channels=128, transformer_dim=64, height=28, width=28):
        super().__init__()
        self.patch_size = 4
        self.num_patches = (height // self.patch_size) * (width // self.patch_size)

        # "The first Fire module increases channels from 128 to 256"
        self.fire1 = FireModule(in_channels, 256)
        # "the second Fire module reduces it from 256 to 64"
        self.fire2 = FireModule(256, transformer_dim)

        # Token processing configuration
        self.token_conv = nn.Conv2d(transformer_dim, transformer_dim, kernel_size=self.patch_size, stride=self.patch_size)
        self.pos_embedding = nn.Parameter(torch.zeros(1, self.num_patches, transformer_dim))

        self.transformers = nn.Sequential(
            TransformerEncoder(transformer_dim, 4),
            TransformerEncoder(transformer_dim, 4),
            TransformerEncoder(transformer_dim, 4),
            TransformerEncoder(transformer_dim, 4),
        )

        # "merged back with original features through a 1x1 conv, followed by channel-wise concatenation (2C)"
        self.proj_conv = nn.Conv2d(transformer_dim, in_channels, kernel_size=1)
        
        # Concatenation doubles the input channels: in_channels (original) + in_channels (transformer proj) = 2 * in_channels
        self.fuse_fire = FireModule(in_channels * 2, in_channels)

    def forward(self, x):
        res = x # Keep original context for 2C concatenation fusion
        
        # Local processing pipeline
        x_local = self.fire1(x)
        x_local = self.fire2(x_local)

        # Global Attention tokens tracking
        x_tokens = self.token_conv(x_local)
        Hp, Wp = x_tokens.shape[2], x_tokens.shape[3]
        
        tokens = x_tokens.flatten(2).transpose(1, 2)
        tokens = tokens + self.pos_embedding[:, :tokens.size(1)]
        tokens = self.transformers(tokens)
        
        # Reconstruct map
        tokens = tokens.transpose(1, 2).view(x_tokens.shape[0], x_tokens.shape[1], Hp, Wp)
        tokens = F.interpolate(tokens, size=(x.shape[2], x.shape[3]), mode='bilinear', align_corners=False)
        
        # Project back to input channel depth before spatial channel-wise combination
        tokens = self.proj_conv(tokens)

        # "channel-wise concatenation, effectively doubling the channel dimension as C_output = 2C"
        x_fused = torch.cat([res, tokens], dim=1)
        
        # "Finally, another Fire module efficiently reduces the channel count back from 2C -> C"
        return self.fuse_fire(x_fused)


class SqueezeViT(nn.Module):
    def __init__(self, num_classes=14):
        super().__init__()

        # Stem block (Figure 3): 3x3 Conv Stride=2 -> MaxPool Stride=2
        self.stem = nn.Sequential(
            nn.Conv2d(1, 3, kernel_size=3, stride=2, padding=1),
            nn.BatchNorm2d(3),
            nn.SiLU(),
            nn.MaxPool2d(kernel_size=3, stride=2, padding=1)
        )

        # Stage 1: Standardized progression matching page 14: 3 -> 32 -> 64 -> 64 -> 128
        self.stage1 = nn.Sequential(
            nn.Conv2d(3, 32, kernel_size=1), 
            FireModule(32, 64),
            FireModule(64, 64),
            FireModule(64, 128),
            FireModule(128, 128),
            nn.MaxPool2d(kernel_size=3, stride=2, padding=1)
        )

        # Stage 2: Translution Block (processes resolution at 28x28 following stem/stage1 downsampling)
        self.stage2 = TranslutionBlock(in_channels=128, transformer_dim=64, height=28, width=28)

        # Stage 3: Fire module transitions channels from 128 -> 256 followed by MaxPool
        self.stage3 = nn.Sequential(
            FireModule(128, 256),
            nn.MaxPool2d(kernel_size=3, stride=2, padding=1)
        )

        # Head / Output Processing (Figure 3 & Page 13)
        self.head_conv = nn.Sequential(
            nn.Conv2d(256, 256, kernel_size=1),
            nn.BatchNorm2d(256),
            nn.SiLU()
        )
        self.pool = nn.AdaptiveAvgPool2d(1)
        self.fc = nn.Linear(256, num_classes)

    def forward(self, x):
        x = self.stem(x)
        x = self.stage1(x)
        x = self.stage2(x)
        x = self.stage3(x)
        x = self.head_conv(x)
        x = self.pool(x)
        x = x.view(x.size(0), -1)
        return self.fc(x)


if __name__ == "__main__":
    model = SqueezeViT()
    print("Target Parameters from Paper: ~540,000")
    print("Your Active Model Parameters :", sum(p.numel() for p in model.parameters()))
    
    # Smoke-test shape validation
    x = torch.randn(2, 1, 224, 224)
    print("Output Vector Dimension     :", model(x).shape)
