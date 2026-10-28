"""Train the frontal/lateral view detector used by Professor case upload.

Features come from scripts/dump-view-features.mts, which calls the same
viewFeatures() the server uses, so training and serving see identical inputs.

    python model-export/train_view_detector.py <featureDir> src/lib/view-detector/weights.json
"""
import json
import sys

import numpy as np
from sklearn.neural_network import MLPClassifier

FEATURES = 32 * 32
# Logistic regression caught 94.3% of held-out laterals at the same frontal limit;
# one hidden layer of 32 catches 99.5%, and 64 adds nothing.
HIDDEN = 32
# Highest share of held-out frontal images the upload check may reject.
MAX_FRONTAL_REJECT = 0.001


def load(prefix):
    x = np.fromfile(f"{prefix}.f32", dtype=np.float32).reshape(-1, FEATURES)
    y = np.fromfile(f"{prefix}.u8", dtype=np.uint8)
    return x, y


def report(name, scores, y, threshold):
    frontal, lateral = scores[y == 0], scores[y == 1]
    result = {
        "images": int(len(y)),
        "lateral": int(len(lateral)),
        "frontal_rejected": int((frontal >= threshold).sum()),
        "lateral_caught": int((lateral >= threshold).sum()),
    }
    print(name, result)
    return result


def main(feature_dir, out_path):
    x_train, y_train = load(f"{feature_dir}/train")
    x_heldout, y_heldout = load(f"{feature_dir}/heldout")
    x_official, y_official = load(f"{feature_dir}/official")

    model = MLPClassifier(hidden_layer_sizes=(HIDDEN,), early_stopping=True, max_iter=60, random_state=0)
    model.fit(x_train, y_train)
    heldout = model.predict_proba(x_heldout)[:, 1]
    official = model.predict_proba(x_official)[:, 1]

    # Pick the threshold on held-out frontals only; the official 234 stay a test set.
    threshold = max(0.5, float(np.quantile(heldout[y_heldout == 0], 1 - MAX_FRONTAL_REJECT)))
    print(f"threshold {threshold:.4f}")
    metrics = {
        "heldout": report("heldout", heldout, y_heldout, threshold),
        "official": report("official", official, y_official, threshold),
    }

    with open(out_path, "w") as file:
        json.dump({
            "version": f"view-mlp{HIDDEN}-32px-v1",
            "threshold": round(threshold, 6),
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
