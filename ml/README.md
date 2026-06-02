# RankMint ML training

## Campaign labels (`campaign_labels.csv`)

Each row is a **documented campaign archetype** (micro-UGC hit/miss, mega mis-fit, etc.) with:

- 13 feature values (same as `extractFeatures()` in the app)
- `campaign_success`: `1` = brand would repeat / hit KPIs, `0` = miss
- `archetype`: human-readable note

**Replace with your real data:** export rows from production analyses where you know outcomes (CTR, ROAS, repeat booking). Keep the same columns.

## Train

```bash
pip install numpy scikit-learn
python ml/train_model.py
npm run ml:sync
```

If `campaign_labels.csv` is missing, training falls back to synthetic data (not recommended for production).
