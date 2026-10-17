import unittest
import torch
from export_fastvit import ExportModel
from fastvit_thoraxscan import FastViTThoraxScan


class FastViTExportTests(unittest.TestCase):
    def test_reparameterized_logits_and_attention_shape(self):
        torch.manual_seed(3)
        trained = FastViTThoraxScan(pretrained=False).eval()
        model = ExportModel(trained).eval()
        image = torch.randn(2, 1, 224, 224)
        with torch.no_grad():
            logits, attention = model(image)
            torch.testing.assert_close(logits, trained(image), atol=1e-3, rtol=1e-3)
        self.assertEqual(len(model.layers), 2)
        self.assertEqual(tuple(attention.shape), (2, 1, 7, 7))
        self.assertGreaterEqual(attention.min().item(), 0)
        self.assertLessEqual(attention.max().item(), 1)
