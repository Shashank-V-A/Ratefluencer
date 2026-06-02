"""
Offline training for RankMint campaign-success model.

Preferred: ml/campaign_labels.csv (documented campaign archetypes — replace with your real outcomes).
Fallback: synthetic generator (dev only).

Run: pip install numpy scikit-learn pandas && python ml/train_model.py
Then: npm run ml:sync
"""

from __future__ import annotations

import json
import random
from pathlib import Path

import numpy as np
import pandas as pd
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

ROOT = Path(__file__).parent
CSV_PATH = ROOT / "campaign_labels.csv"
OUT = ROOT / "exported_coefficients.json"
META = ROOT / "training_meta.json"


def load_campaign_csv() -> tuple[np.ndarray, np.ndarray] | None:
    if not CSV_PATH.exists():
        return None
    df = pd.read_csv(CSV_PATH)
    for col in FEATURE_NAMES + ["campaign_success"]:
        if col not in df.columns:
            raise ValueError(f"Missing column {col} in campaign_labels.csv")
    X = df[FEATURE_NAMES].astype(float).values
    y = df["campaign_success"].astype(int).values
    if len(np.unique(y)) < 2:
        raise ValueError("campaign_labels.csv needs both 0 and 1 labels")
  # light augmentation for small curated sets
    rng = np.random.default_rng(42)
    aug_X, aug_y = [X], [y]
    for _ in range(max(0, 400 // max(len(X), 1))):
        noise = rng.normal(0, 0.015, X.shape)
        aug_X.append(np.clip(X + noise, 0, None))
        aug_y.append(y)
    return np.vstack(aug_X), np.concatenate(aug_y)


def synth_sample(rng: random.Random) -> tuple[list[float], int]:
    f = [rng.uniform(0, 0.2) for _ in range(13)]
    f[1] = rng.uniform(0.02, 0.2)
    f[2] = rng.uniform(0.05, 0.35)
    f[11] = rng.uniform(0.4, 0.98)
    f[12] = rng.choice([0.72, 1.0])
    z = f[0] * 8 + f[2] * 6 + f[11] * 5 + f[12] * 2 + rng.gauss(0, 1.2)
    return f, 1 if z > 3.8 else 0


def main() -> None:
    loaded = load_campaign_csv()
    if loaded:
        X, y = loaded
        dataset = "campaign_labels.csv"
        print(f"Training on {len(y)} rows from {CSV_PATH.name} (with light augmentation)")
    else:
        rng = random.Random(42)
        rows = [synth_sample(rng) for _ in range(4000)]
        X = np.array([r[0] for r in rows])
        y = np.array([r[1] for r in rows])
        dataset = "synthetic_fallback"
        print("WARNING: campaign_labels.csv not found — using synthetic data")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    model = LogisticRegression(max_iter=800, C=1.0)
    model.fit(X_train, y_train)
    acc = model.score(X_test, y_test)
    print(f"Test accuracy: {acc:.3f}")

    coefs = dict(
        zip(
            ["intercept", *FEATURE_NAMES],
            model.intercept_.tolist() + model.coef_[0].tolist(),
        )
    )
    OUT.write_text(json.dumps(coefs, indent=2))
    version = (
        "rm-trained-v1.1-campaign-labels"
        if dataset == "campaign_labels.csv"
        else "rm-trained-v1.0-synthetic"
    )
    META.write_text(
        json.dumps(
            {
                "modelVersion": version,
                "dataset": dataset,
                "testAccuracy": round(acc, 4),
                "rows": int(len(y)),
            },
            indent=2,
        )
    )
    print(f"Wrote {OUT}")
    print(f"Model version: {version}")


if __name__ == "__main__":
    main()
