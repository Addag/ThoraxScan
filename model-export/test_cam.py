import unittest
import torch
from export_squeezevit_cam import ExportModel, class_activation


class ClassActivationTests(unittest.TestCase):
    def test_cam_is_exact_for_the_logits(self):
        torch.manual_seed(7)
        model = ExportModel().eval()
        image = torch.randn(2, 1, 224, 224)
        with torch.no_grad():
            features = model.head_conv(model.stage3(model.stage2(model.stage1(model.stem(image)))))
            raw = torch.einsum("ck,bkhw->bchw", model.fc.weight, features)
            logits, cam = model(image)
        torch.testing.assert_close(raw.mean((2, 3)) + model.fc.bias, logits, atol=1e-5, rtol=1e-5)
        self.assertEqual(tuple(cam.shape), (2, 14, 14, 14))

    def test_relu_and_per_label_max_normalization(self):
        features = torch.rand(1, 3, 14, 14)
        weight = torch.tensor([[1.0, 0, 0], [-1.0, 0, 0], [0, 0, 0]])
        cam = class_activation(features, weight)
        self.assertAlmostEqual(cam[0, 0].max().item(), 1.0, places=6)
        self.assertGreaterEqual(cam.min().item(), 0)
        self.assertEqual(cam[0, 1].abs().sum().item(), 0)  # all-negative evidence clamps to zeros
        self.assertEqual(cam[0, 2].abs().sum().item(), 0)  # constant zero stays finite

    def test_pointing_game_peak_maps_cell_to_image_pixels(self):
        from eval_localization import hit, peak
        grid = torch.zeros(14, 14)
        grid[3, 10] = 1  # row 3, column 10 covers x 731-804, y 219-292 in a 1024 image
        x, y = peak(grid, (1024, 1024))
        self.assertTrue(hit((x, y), (731, 219, 73, 73)))
        self.assertFalse(hit((x, y), (0, 0, 512, 512)))


if __name__ == "__main__":
    unittest.main()
