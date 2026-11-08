"""Train the chest X-ray gate used by Learning Mode and Professor case upload.

Features come from scripts/dump-chest-features.mts, which calls the same
chestFeatures() the browser and server use, so every input path matches.
Each split is a "<label>\t<path>" list (1 = chest X-ray): CheXpert images for
1, and photos, other medical images, non-chest X-rays (FracAtlas) and rendered
documents for 0.

    python model-export/train_chest_gate.py <featureDir> src/lib/chest-gate/weights.json
"""
import json
import sys

import numpy as np
from sklearn.neural_network import MLPClassifier

FEATURES = 32 * 32
HIDDEN = 64
# Highest share of held-out chest X-rays the gate may reject.
MAX_CHEST_REJECT = 0.001
# CheXpert images are pure greyscale; leave room for tinted scans and phone photos of films.
MIN_COLOUR_LIMIT = 0.08


def load(prefix):
    x = np.fromfile(f"{prefix}.f32", dtype=np.float32).reshape(-1, FEATURES)
    y = np.fromfile(f"{prefix}.u8", dtype=np.uint8)
    colour = np.fromfile(f"{prefix}.colour.f32", dtype=np.float32)
    return x, y, colour


def report(name, scores, colour, y, threshold, colour_limit):
    passed = (scores >= threshold) & (colour <= colour_limit)
    result = {
        "images": int(len(y)),
        "chest": int((y == 1).sum()),
        "chest_rejected": int((~passed[y == 1]).sum()),
        "other_caught": int((~passed[y == 0]).sum()),
    }
    print(name, result)
    return result


def main(feature_dir, out_path):
    x_train, y_train, _ = load(f"{feature_dir}/train")
    x_heldout, y_heldout, c_heldout = load(f"{feature_dir}/heldout")
    x_official, y_official, c_official = load(f"{feature_dir}/official")

    model = MLPClassifier(hidden_layer_sizes=(HIDDEN,), early_stopping=True, max_iter=60, random_state=0)
    model.fit(x_train, y_train)
    heldout = model.predict_proba(x_heldout)[:, 1]
    official = model.predict_proba(x_official)[:, 1]

    # Tune on held-out chest X-rays only; the official 234 stay a test set.
    chest = y_heldout == 1
    threshold = min(0.5, float(np.quantile(heldout[chest], MAX_CHEST_REJECT)))
    colour_limit = max(MIN_COLOUR_LIMIT, float(np.quantile(c_heldout[chest], 1 - MAX_CHEST_REJECT)))
    print(f"threshold {threshold:.4f} colour limit {colour_limit:.4f}")
    metrics = {
        "heldout": report("heldout", heldout, c_heldout, y_heldout, threshold, colour_limit),
        "official": report("official", official, c_official, y_official, threshold, colour_limit),
    }

    with open(out_path, "w") as file:
        json.dump({
            "version": f"chest-mlp{HIDDEN}-32px-v2",
            "threshold": round(threshold, 6),
            "maxColourfulness": round(colour_limit, 6),
            # hidden[j] = relu(hiddenBias[j] + sum_i features[i] * hiddenWeights[i][j])
            "hiddenWeights": np.round(model.coefs_[0], 5).tolist(),
            "hiddenBias": np.round(model.intercepts_[0], 5).tolist(),
            "outputWeights": np.round(model.coefs_[1][:, 0], 5).tolist(),
            "outputBias": round(float(model.intercepts_[1][0]), 5),
            "metrics": metrics,
        }, file)
    print(f"wrote {out_path}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
