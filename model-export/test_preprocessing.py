import unittest

import numpy as np

from preprocessing_shortside320 import MODEL_INPUT_SIZE, preprocess_rgb, resize_bilinear, training_size


class ShortSide320Tests(unittest.TestCase):
    def test_training_size_matches_chexpert_small(self):
        self.assertEqual(training_size(2828, 2320), (390, 320))
        self.assertEqual(training_size(1751, 2022), (320, 369))  # long side floored, not rounded
        self.assertEqual(training_size(2021, 2022), (320, 320))
        self.assertEqual(training_size(390, 320), (390, 320))  # already CheXpert-small: no stage 1

    def test_small_images_take_the_single_stage_path(self):
        rgb = np.random.default_rng(3).integers(0, 256, (300, 371, 3), dtype=np.uint8)
        plane = ((0.299 * rgb[:, :, 0] + 0.587 * rgb[:, :, 1] + 0.114 * rgb[:, :, 2]) / 255.0).astype(np.float32)
        single = ((resize_bilinear(plane, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE) - 0.5) / 0.25).astype("<f4")
        np.testing.assert_array_equal(preprocess_rgb(rgb), single)

    def test_large_images_resize_through_short_side_320(self):
        rgb = np.random.default_rng(4).integers(0, 256, (800, 640, 3), dtype=np.uint8)
        plane = ((0.299 * rgb[:, :, 0] + 0.587 * rgb[:, :, 1] + 0.114 * rgb[:, :, 2]) / 255.0).astype(np.float32)
        stage = resize_bilinear(plane, 320, 400)
        expected = ((resize_bilinear(stage, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE) - 0.5) / 0.25).astype("<f4")
        np.testing.assert_array_equal(preprocess_rgb(rgb), expected)
        direct = ((resize_bilinear(plane, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE) - 0.5) / 0.25).astype("<f4")
        self.assertGreater(np.abs(preprocess_rgb(rgb) - direct).max(), 0.01)


if __name__ == "__main__":
    unittest.main()
