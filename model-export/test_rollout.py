import unittest
import torch
from export_squeezevit import rollout


class RolloutTests(unittest.TestCase):
    def test_uniform_is_finite_zero_for_each_image(self):
        result = rollout([torch.ones(2, 49, 49) / 49 for _ in range(4)])
        self.assertEqual(tuple(result.shape), (2, 1, 7, 7))
        self.assertTrue(torch.isfinite(result).all())
        self.assertGreaterEqual(result.min().item(), 0)
        self.assertLessEqual(result.max().item(), 1)
        torch.testing.assert_close(result[0], result[1], atol=1e-6, rtol=0)

    def test_layer_order_and_per_image_normalization(self):
        torch.manual_seed(12)
        layers = [torch.rand(2, 49, 49).softmax(-1) for _ in range(4)]
        identity = torch.eye(49)
        residuals = [(weights + identity) / (weights + identity).sum(-1, keepdim=True) for weights in layers]
        joint = residuals[3] @ residuals[2] @ residuals[1] @ residuals[0]
        received = joint.mean(1)
        expected = (received - received.amin(1, keepdim=True)) / (received.amax(1, keepdim=True) - received.amin(1, keepdim=True))
        torch.testing.assert_close(rollout(layers).flatten(1), expected, atol=1e-4, rtol=1e-4)
        for index in range(2):
            torch.testing.assert_close(rollout(layers)[index:index+1], rollout([layer[index:index+1] for layer in layers]), atol=1e-4, rtol=1e-4)
