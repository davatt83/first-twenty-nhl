# First Twenty — 2025–26 first-period scoring study

**Data integrity:** 1312 unique completed NHL regular-season games, 32 teams × 82 games, 41 home + 41 away per team; all venue scoring totals reconciled. Data dates 2025-10-07–2026-04-16. The 2026–27 model is separately refreshed and reported with its own verified data-through date.

## 2025–26 observed first-period scoring

- Over 1.5 goals: **705/1312 = 53.73%** (95% Wilson interval 51.03%–56.42%). This is a league-wide historical hit rate, **not** fair odds for an individual matchup.
- Average combined first-period goals: **1.756**; sample variance **1.718**; variance/mean **0.978**.
- At the league-wide mean, Poisson predicts 52.40% of periods with 2+ goals.

| First-period goals | Observed games | Poisson expected games |
|---|---:|---:|
| 0 | 232 | 226.6 |
| 1 | 375 | 397.9 |
| 2 | 378 | 349.4 |
| 3+ | 327 | 338.0 |

Pearson four-bin goodness-of-fit statistic χ²=4.15, approximate df=2, p≈0.1255. This is an **in-sample descriptive fit** using an estimated league mean, not a test of betting returns or opponent-level forecasts.

## Do teams demonstrate persistent Over 1.5 tendencies?

Each team has 82 games. The table compares each unadjusted observed hit count against the season league-wide rate, with Benjamini–Hochberg adjustment across 32 exploratory tests. Team outcomes overlap through shared matchups, schedules differ in opponent strength, and this is **not** a causal or independent signal test.

| Team | Games over 1.5 | Hit rate | Unadjusted p | BH q |
|---|---:|---:|---:|---:|
| LAK | 34/82 | 41.5% | 0.027 | 0.373 |
| CGY | 35/82 | 42.7% | 0.047 | 0.373 |
| DET | 35/82 | 42.7% | 0.047 | 0.373 |
| WSH | 35/82 | 42.7% | 0.047 | 0.373 |
| SJS | 51/82 | 62.2% | 0.150 | 0.798 |
| TOR | 51/82 | 62.2% | 0.150 | 0.798 |
| BOS | 50/82 | 61.0% | 0.223 | 0.877 |
| OTT | 49/82 | 59.8% | 0.319 | 0.877 |
| FLA | 40/82 | 48.8% | 0.378 | 0.877 |
| NJD | 40/82 | 48.8% | 0.378 | 0.877 |
| NYI | 40/82 | 48.8% | 0.378 | 0.877 |
| COL | 48/82 | 58.5% | 0.439 | 0.877 |
| PIT | 48/82 | 58.5% | 0.439 | 0.877 |
| STL | 48/82 | 58.5% | 0.439 | 0.877 |
| UTA | 48/82 | 58.5% | 0.439 | 0.877 |
| VGK | 41/82 | 50.0% | 0.508 | 0.877 |
| BUF | 47/82 | 57.3% | 0.580 | 0.877 |
| CAR | 47/82 | 57.3% | 0.580 | 0.877 |
| EDM | 47/82 | 57.3% | 0.580 | 0.877 |
| MTL | 47/82 | 57.3% | 0.580 | 0.877 |
| DAL | 42/82 | 51.2% | 0.659 | 0.877 |
| MIN | 42/82 | 51.2% | 0.659 | 0.877 |
| NYR | 42/82 | 51.2% | 0.659 | 0.877 |
| ANA | 46/82 | 56.1% | 0.740 | 0.877 |
| CBJ | 46/82 | 56.1% | 0.740 | 0.877 |
| SEA | 46/82 | 56.1% | 0.740 | 0.877 |
| VAN | 46/82 | 56.1% | 0.740 | 0.877 |
| PHI | 43/82 | 52.4% | 0.826 | 0.943 |
| CHI | 44/82 | 53.7% | 1.000 | 1.000 |
| NSH | 44/82 | 53.7% | 1.000 | 1.000 |
| TBL | 44/82 | 53.7% | 1.000 | 1.000 |
| WPG | 44/82 | 53.7% | 1.000 | 1.000 |

## 2026–27 chronological prediction checks

Predictions for 140 completed games use the full, earlier 2025–26 history and only 2026–27 games from **earlier dates**. The parameters were researched using early 2026–27 results, so this remains exploratory rather than a clean independent holdout.

| Model | Mean Brier | Mean log loss |
|---|---:|---:|
| baseline | 0.24706 | 0.68719 |
| matchup | 0.24780 | 0.68861 |
| hybrid | 0.24720 | 0.68742 |

Balanced minus baseline Brier improvement (positive is better): -0.00013. Day-block bootstrap 95% interval: **[-0.00121, 0.00105]**; includes zero = yes. This is **not** a measured sportsbook edge.

**Data/source note:** Official NHL gamecenter and daily scoring feeds, reconciled with an archived 1,312-game schedule; reproducible analysis in scripts/research-2025.mjs. No sportsbook odds or transactions were included.
