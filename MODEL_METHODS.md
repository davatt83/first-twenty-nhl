# First Twenty v2 — methodology and limitations

**Market:** NHL first-period combined goals **Over 1.5** in a scheduled regular-season game. Predictions concern the full first period **before puck drop**. They are not live-betting probabilities.

## 1. Data and venue controls

- 2025–26 has verified first-period home/away **team goal totals** (41 games per venue for each team). Detailed 2025–26 game logs are **not yet verified**; no previous-season observed Over 1.5 frequencies are invented.
- 2026–27 initially embeds 140 completed first periods (September 29–October 19, 2026), and a scheduled 4 a.m. Toronto runner checks official NHL game scores/period totals. See the model's displayed through-date and counts; this number is not live unless the scheduled job succeeds.
- A second incremental collector attempts 2025–26 individual game logs. **Only 1,312 reconciled games with correct 41/41 venue and goals-for/against totals count as a complete 2025–26 observed-history dataset.** Until then the model keeps using the known season aggregates.
- Venue inputs matter. A home team's **home** GF/GA is compared with the visiting team's **away** GF/GA.

## 2. Original reference model — explicitly preserved

For historical venue rates `hGF`, `hGA`, `aGF`, `aGA`:

```
original_home_goals = (hGF + aGA)/2
original_away_goals = (aGF + hGA)/2
lambda_original = original_home_goals + original_away_goals
p_original = 1 - exp(-lambda_original) * (1 + lambda_original)
```

This is an arithmetic-average goal-rate Poisson model. Its simplicity is useful as a benchmark, but the first-period Poisson assumption is not established as perfect.

## 3. Opponent-sensitive scoring estimate

Let `L_home` and `L_away` denote league-wide mean home and away first-period goals for the reference season. First shrink each offense or defense rate toward the corresponding league goal mean using **12 pseudo-games**. Then:

```
matchup_home_goals = shrunk_home_offense * shrunk_away_defense / L_home
matchup_away_goals = shrunk_away_offense * shrunk_home_defense / L_away
```

This multiplicative rate-ratio matchup model can differ from a straight average when a high-output attack faces a particularly vulnerable defense. The matchup Poisson estimate uses **40% original goals and 60% adjusted matchup goals**, with the result again converted by `P(>=2)=1-exp(-lambda)*(1+lambda)`.

## 4. Actual Over 1.5 evidence — modest influence by design

Each verified individual game has an observed outcome: **1** if combined 1P goals >= 2, otherwise **0**. For each team, compute the differences between observed outcomes and the expected hit probability for the venue. Home-venue games get weight **1**, and the other venue contributes at **0.35**. Within combined-season mode, verified 2026–27 outcomes get **2.5x** the 2025–26 weight. Without verified historical game outcomes, no historical hit-rate contribution is made.

For each selected team's venue-residual, shrink the weighted error sum by **12 pseudo-games**. Average the home and away residuals, multiply by **0.65**, and apply that correction to the matchup Poisson probability to form a more aggressive experimental estimate. Finally:

```
final_probability = 0.70 * original_probability
                  + 0.30 * experimental_adjusted_probability
```

The blend is deliberately conservative because stronger corrections did not show robust superior walk-forward accuracy. These weights are research assumptions, not established optimal parameters.

**2026–27 only:** previous-season *team* records are excluded. Its GF/GA rates include an explicit prior of eight neutral (0.85 goals for, 0.85 against) pseudo-games per venue, so a short season never pretends a team's first two matches are conclusive. The neutral prior is an assumption; last-season team-specific results are excluded.

**Combined:** 2025–26 venue totals plus 2.5 times 2026–27 venue totals, divided by 41 plus 2.5 times current venue game count.

## 5. No-vig fair American odds and sportsbook comparison

At predicted probability `p`:

```
if p >= 0.5: American fair odds = -100*p/(1-p)
if p <  0.5: American fair odds = +100*(1-p)/p
```

The app compares the offered sportsbook odds by converting them into decimal odds `d`; estimated profit on $100 at risk is `100 * [p*(d-1)-(1-p)]`. Positive *model-implied* EV does not demonstrate profit or an identified bookmaker inefficiency.

## 6. Walk-forward evidence, not performance marketing

The Validation tab scores every embedded 2026–27 game in chronological game-day order, restricting each forecast to *current-season games played on earlier dates* plus the completed 2025–26 scoring totals. This avoids future-game leakage and same-day contamination.

**Exploratory through October 19, 2026, 140 games:**

| Forecast | Mean Brier score (lower better) |
|---|---:|
| Original arithmetic Poisson | ~0.2471 |
| Full unblended experimental hybrid | ~0.2478 |
| Conservative balanced hybrid | ~0.2469 |

The improvement of ~0.0002 for the balanced hybrid is tiny. A game-day-resampling bootstrap of the difference yielded an approximate 95% interval that included zero. **These games influenced the research and are not a clean independent final holdout**; no recorded sportsbook closing odds were tested. Calibration and profitability remain unverified. The validation tab recalculates its metrics as actual data is added.

## 7. Operational safeguards

- Current-season collector fails rather than publishing a newly incomplete day or inconsistent first-period score.
- Historic backfill accepts complete verified game days into a provisional archive and waits until **all** 1,312 games pass reconciliation before using previous-season actual hit rates.
- Publishing rebuilds the HTML with games embedded and runs code/fixture tests; the previous hosted version is retained on a failed primary refresh.
- The website is a public GitHub Pages app; a file downloaded to a laptop does **not** update itself.

**Future work:** a true separate-season holdout, scoring-goal distribution checks, scoring-state/penalty effects, baseline book line comparison, and temporal calibration as more games accrue. Adding parameters without those tests risks overfitting.