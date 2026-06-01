"""
Offline training script for RankMint campaign-success model.
Run: pip install numpy scikit-learn xgboost && python ml/train_model.py

Exports logistic-regression-style coefficients for use in src/lib/ml/coefficients.ts
"""

from __future__ import annotations

import json
import random
from pathlib import Path

import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split

FEATURE_NAMES = [
    "engagementRate",
    "shareRate",
    "saveRate",
    "commentRate",
    "viewToFollowerRatio",
    "postingConsistency",
    "growthRate30d",
    "audienceQuality",
    "commentQuality",
    "contentCategoryFit",
    "demographicMatch",
    "authenticityRaw",
    "microCreatorBonus",
]


def synth_sample(rng: random.Random) -> tuple[list[float], int]:
    f = [rng.uniform(0, 0.2) for _ in range(13)]
    f[1] = rng.uniform(0.02, 0.2)  # share
    f[2] = rng.uniform(0.05, 0.35)  # save
    f[11] = rng.uniform(0.4, 0.98)  # authenticity
    f[12] = rng.choice([0.72, 1.0])
    z = (
        f[0] * 8
        + f[2] * 6
        + f[11] * 5
        + f[12] * 2
        + rng.gauss(0, 1.2)
    )
    label = 1 if z > 3.8 else 0
    return f, label


def main() -> None:
    rng = random.Random(42)
    rows = [synth_sample(rng) for _ in range(4000)]
    X = np.array([r[0] for r in rows])
    y = np.array([r[1] for r in rows])

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    model = LogisticRegression(max_iter=500, C=1.0)
    model.fit(X_train, y_train)
    acc = model.score(X_test, y_test)
    print(f"Test accuracy: {acc:.3f}")

    coefs = dict(
        zip(
            ["intercept", *FEATURE_NAMES],
            model.intercept_.tolist() + model.coef_[0].tolist(),
        )
    )
    out = Path(__file__).parent / "exported_coefficients.json"
    out.write_text(json.dumps(coefs, indent=2))
    print(f"Wrote {out}")


if __name__ == "__main__":
    main()
