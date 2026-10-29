# Live model refinements

The `matchups.js` loader includes `refinements.js?v=1`. Preserve this loader when refreshing the site. No prediction coefficients are changed.

## Evidence

The live panel reads the engine's exact scenario sample and effective sample size. It reproduces market weights to report the fraction contributed by the selected trailing team's observations. This is a data-weight share, not an estimate of the team's causal contribution. Zero fitted team and coach market weights are stated explicitly. Pull timing uses its own weights and sample. Uncertainty intervals already displayed by the calculator omit model error.

## Next minute

The clock comparison re-evaluates the same query at now, +30 and +60 seconds, holding all other inputs fixed. It shows regulation next-goal outcomes and the distinct at-least-one leading-team empty-net-goal event. It does not extrapolate below 30 seconds, reuse the current probability or interpret the scenarios as the effect of waiting. Unsupported situations and no-data snapshots are not priced.

## Strategy and execution

The selected trailing team's first screened pull median matches the chosen deficit and season. Scoring and conceding rates use all eligible own-net exposure for the selected season view, with explicit goals, episodes and minutes. Exposure divided by conceded goals is not an expected waiting time. Existing ranking detail remains available for all teams.

## Opponent adjustment

Run `python build_refinements.py RANKING_DIR` after validated defender and own-net ranking builds. Inputs: `empty-net-exposures.csv` and `empty-net-rankings.json`; output: `opponent-adjusted.json`. Run `python test_refinements.py` in the output directory containing both original ranking JSON files and these scripts.

For each focal team, exclude every row involving that team as the rated side from opponent-factor estimation. Within each season, estimate each opponent's goals-for and goals-against multipliers relative to its situation mix. Both its situation rates and league prior come from the remaining rows. Add 1200 seconds at the remaining league rate to numerator and denominator. Multiply the focal team's original situation-matched expected GF/GA by those factors. Retain the original index formula and 1200-second final shrinkage. The own-net view mirrors the exposure rows first. Priors are fixed, untuned choices. Baseline columns exactly reproduce existing indexes.

Validate temporally: fit indexes using 2025–26 only; compare with 2026–27 situation-adjusted net goals per two minutes, among teams with at least 300 seconds in each period. Show exposure-weighted MSE and Spearman rank correlation. Future observations do not enter the training index. The test is a single season transition with small samples and no significance analysis. The current adjustment does not consistently improve performance and must remain experimental, separate from live odds. Do not equate it with a causal strength estimate or betting edge.

On refresh failure retain the last verified adjustment and its own cutoff. Never advance its date merely because the model or schedule updated. Fetch current repository scripts and preserve all panels during daily rebuilds.
