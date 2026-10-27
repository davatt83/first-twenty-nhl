# NHL Late Game Lab — working model v2

## October 25, 2026: 2025–26 onward edition

The public calculator uses only seasons beginning in 2025 or later, including coach profiles and rankings. The default combines 2025–26 and 2026–27; the season selector can isolate either. Current-season observations contribute immediately without a minimum per-team sample. The interface reports comparable game counts by season. Conditional pull timing retains the recent-season factor of 0.35 (each 2026–27 observation has about 2.86 times the age weight of 2025–26). Outcome and pull-probability weights are otherwise unchanged.

Nonempty samples below the old thresholds (60 raw / 40 effective games) now show explicitly provisional estimates. Pull medians with fewer than 20 observed pulls are provisional. No observations still means no estimate. These sparse empirical probabilities and prices can be unstable; the combined view supplies more evidence. No artificial games or inferred goal events are introduced.

The verified data-through date is October 25, 2026 after the October 26 refresh. All validation scores below are frozen legacy results, not fresh validation of this restricted model or its provisional prices. Existing fitted settings were retained, not re-estimated using the current season. Historical research artifacts remain in the source archive solely as an audit record; they do not enter the active calculator.

Public page: https://davatt83.github.io/first-twenty-nhl/goalie-pull/

Run `test_recent.js` for this edition's engine checks. The older parity/browser tests describe the superseded multi-season edition. `test_recent_browser.js` exercises the new controls when a Chromium installation is available. GitHub deployment includes the goalie-pull page on every subsequent First Twenty publication; the First Twenty updater does not ingest goalie-pull data.

## Current data update — through October 25, 2026

The public [GitHub goalie-pull calculator](https://davatt83.github.io/first-twenty-nhl/goalie-pull/) includes all **184 completed regular-season games through October 25**, adding **95 games** to the October 12 edition. The most recent complete game day contains five games. The older private Site is not updated by this publication.

All 184 games have play-by-play, rosters, shift charts, game-end and regulation-ending records. Goal totals reconcile to final scores (with the shootout decision handled separately). All 95 additions agree with CBS daily schedules and scores across 13 game days, and no previously accepted games were lost. Raw files are archived in `raw_2026`.

All **368 team-game coach assignments** are populated using dated tenure records. Five provider entries lacked start dates: Toronto, Edmonton, Vancouver, Vegas and Los Angeles. `verified_coach_intervals.json` records bounded tenure intervals corroborated by the earlier dated game evidence, current head-coach listing and later dated NHL/team coverage (Sportsnet for Edmonton). These are tenure-continuity assignments, not independent confirmation of physical bench attendance at every game. Intervals do not extend beyond their dated corroboration.

The 2026–27 isolated view contains **2,207 qualifying states from 154 games and 126 screened tactical goalie-absence episodes**. Thirty complete games have no supported states. The combined 2025–26 and 2026–27 view contains **18,521 states**. Current-season observations remain included even for small samples, with provisional labels; no pre-2025 season enters active estimates.

The source contains repeated shift records and reused shift numbers. The existing reconstruction merges interval coverage per player, preventing duplicate goalie/skater counts. Two one-second skater-boundary discrepancies occur before the last ten minutes and do not change supported late-game snapshots. There are zero shift-versus-play-by-play disagreements among the checked snapshot observations. Unsupported manpower and ambiguous pull situations remain excluded; see `current_state_audit.json`.

Validation: the recent-scope engine checks passed across 112 supported scenarios, including 59 provisional cases, probability/settlement identities, signed odds, season isolation and current-season inclusion. Frozen historical validation files remain byte-for-byte unchanged. This refresh adds observations; it does not establish new predictive accuracy or betting profitability.

## Open and use it

Download **NHL_Late_Game_Calculator.html** and open it in Chrome, Safari or another modern browser. All model data and calculations are embedded. No account, server, Python installation or internet connection is needed to use the calculator. The interactive version was tested in Chromium; other browsers have not been independently tested. Share the downloaded HTML file itself, rather than a conversation-only download link.

1. The calculator opens in **Live game**. Select the trailing and leading teams, deficit, regulation clock and whether the trailing goalie is in or out. These five choices remain visible and automatically update the estimate.
2. Read the leading opponent's empty-net scoring chance, pull chance and median pull clock. Switch between the **Next goal** and **Full-game spread** market tabs; enter sportsbook odds only if you want the model's offered-price comparison.
3. Open **Coach** to verify the auto-selected coach or change venue, season and game-situation settings. Next-goal settlement, coach history, full coach rankings and validation are in separate disclosures.
4. Switch to **Plan ahead** to estimate a coach-informed pull clock from a 10:00 remaining reference state; that scenario does not require the current clock.


The calculator is a working historical prediction baseline. A single-year quote is an exploratory slice of that year’s games, not a separately validated model. It is **not a proven profitable betting strategy**.

## Supported scope

- NHL regular-season games; final 10 minutes, sampled every 30 seconds, from 0:30 through 10:00 remaining.
- A team trailing by one, two, three or four goals.
- Five-on-five with both goalies in, or six-on-five with the trailing goalie out. No active or delayed penalty at the input state.
- Next-goal probabilities for the leading team, trailing team and no further qualifying goal. Both no-goal-loses and no-goal-refund contracts are priced.
- Whole-game half-goal spreads from ±1.5 through ±4.5 for either team. The handicap applies to the final score including goals already scored, not just goals after placing the bet.
- Opponent empty-net goal yes/no by the end of regulation at the estimated pull clock, conditional on goalie status. This is distinct from which team scores the next regulation goal. The panel also shows the leading opponent’s observed empty-net episode record.

Unsupported: playoffs, tied games, deficits above four, penalties at the input state, clocks below 30 seconds, live automated feeds, player-specific bets, moneylines and ±0.5/±1.0 spreads. The interface withholds prices for unsupported states and insufficient samples.

For the supported spread sizes, a tied regulation game cannot change its cover outcome when an OT/shootout winner receives a single deciding goal. Consequently, those full-game spreads can be settled from the regulation margin without modelling which team wins overtime. Confirm that this matches the sportsbook's convention. Because the input requires one team to be trailing, reaching overtime would require a regulation goal first; regulation-only and overtime-inclusive next-goal probabilities therefore coincide in this version. Shootout attempts do not qualify as next goals.

## Actual training data

The original acquisition contains 6,993 games across 2021–22 through 2025–26, including playoffs. The working model filters to regular-season states in its supported domain: **82,941 snapshots from 5,715 games**. These snapshots are not independent games.

Play-by-play is combined with goalie and skater shifts, using rosters to identify goalie player IDs. Player shifts are merged before counting on-ice personnel. Scores at landmarks include goals at that clock; only later goals are future outcomes. The known missing goalie team-game is excluded. Exact goalie-shift boundary snapshots are excluded. Home/away and division membership are known input context. Arizona stays a separate historical team; the two Utah team IDs are grouped under their common Utah abbreviation.

Rule-screened tactical absences must have supporting live empty-net observations and exclude clear delayed penalties, penalty-boundary ambiguity and goal-at-start ambiguity. “Confirmed” in the extraction code means rule-screened, not verified by video. Future uncertain pull labels are marked missing, not silently labelled no pull. The calculator reports their weighted fraction and worst-case bounds for pull-by-end probability.

Current goalie-out eligibility is determined from the current/past state, not by whether a future empty-net goal occurs or whether the absence later ends in a penalty. Future penalties and repeated pulls remain part of actual market outcomes.

## Model mechanics

This is a weighted empirical outcome model, not a neural network or a fixed scoring-rate simulation. It pools games with the same remaining time, score deficit and goalie status, and uses their subsequent observed paths. Those paths naturally include equalizers, goalie returns, repeat pulls and multiple goals.

For a comparable historical game, the weight is:

`(1 + a*same_trailing_team + b*same_leading_team + c*same_venue + d*same_division_status) * recency_factor^(latest_training_season - game_season)`

Each cell contains at most one snapshot per game. Team matching is additive rather than multiplicative, preventing a small exact-match group from dominating excessively. This is league pooling with team/context weighting. Coach matching is added separately to the pull estimator and is an observational predictor, not a causal claim.

Two parameter sets were selected independently on the validation season:

| Component | Trailing-team weight | Leading-team weight | Venue weight | Division weight | Annual recency factor |
|---|---:|---:|---:|---:|---:|
| Pull timing | 8 | 8 | 0 | 0 | 0.75 |
| Market outcomes | 0 | 0 | 0 | 1 | 1.0 |

The market objective combines next-goal log loss and leading-team −1.5 Brier score. The pull objective is Brier score for a pull within 60 seconds among goalie-in states with known pull outcomes. Settings were chosen from 72 candidates on 2024–25, using 2021–22 through 2023–24 for fitting. Final evaluation uses 2025–26 with the first four seasons as its historical pool. The delivered calculator then pools all five seasons with these settings frozen.

**Team weights were not retained for market prices.** They worsened the chosen validation objective. Team and opponent weights were retained for pull timing. As a result, changing teams within the same division category can change pull estimates and historical profiles without changing market odds. This is an evidence-driven limitation, not a hidden fixed-price bug. The tool does not force a presumed team advantage into the betting prices.

## Held-out results

The test covers **1,134 games and 16,163 snapshots** with at least 60 historical comparison games. Results weight each game equally, averaging its eligible snapshots, rather than allowing long games with many snapshots to dominate. The deployed calculator also requires an effective sample of at least 40.

| Measure (lower is better) | Model | League-only baseline |
|---|---:|---:|
| Next-goal multiclass Brier score | 0.580841 | 0.580922 |
| Next-goal log loss | 0.970074 | 0.970215 |
| Leading team −1.5 Brier score | 0.151605 | 0.151643 |
| Pull within 60 seconds Brier score | 0.042534 | 0.042902 |

These are probability scoring measures, not betting win rates or returns. The baseline pools the same clock/deficit/goalie-status states with no team, venue, division or recency adjustment.

Using 1,000 game-cluster bootstrap draws, the model-minus-baseline next-goal Brier difference has an approximate 95% interval of **[-0.000645, 0.000476]**. The spread difference interval is **[-0.000150, 0.000081]**. Both include zero: there is no clear evidence that these market adjustments beat the simple baseline. The coach addition to the pull forecast is evaluated separately below.

The core markets scored in model selection/testing are regulation next-goal and leading-team −1.5. Other supported spreads and the any-empty-net-goal output are calculated from the same empirical outcomes but were not independently optimized or validated to the same extent. Review the calibration CSV and subgroup sample sizes before treating narrow situations as reliable.

## Reading fair odds and uncertainty

For no-push bets, fair decimal odds are `1/p_win`; estimated return per unit at decimal odds O is `p_win*(O-1)-p_loss`. With a no-goal refund, fair decimal odds are `1+p_loss/p_win`, and the no-goal probability becomes a push. The calculator never conditions away no-goal risk unless the refund rule is selected.

Probability and return intervals use an approximate Wilson interval with effective sample size, computed as `(sum(weights))² / sum(weights²)`. These describe sampling variability only. They do not cover label mistakes, coaching changes, model misspecification, delayed data, stale prices or bet rejection. The refund-return interval conditions on decisive outcomes and treats push probability as estimated/fixed. A boundary probability with no observed wins or losses does not receive a reliable fair quote.

Pull clocks are conditional on a pull occurring. The median and middle-half range are remaining game-clock times, not seconds until the pull. A no-pull probability and the ambiguous-label bounds must be considered alongside them.

Historical coach and team profiles show first classified pull timings, conditional on a classified pull, and opponents' empty-net conversion. They pool different exposure lengths and game situations and remain descriptive.

## Missing features and practical limits

- Dated coach tenures were joined to game dates; coach association can reflect roster, management and game context. One Chicago team-game on 5 December 2024 has no dated coach assignment and uses pooled evidence.
- No pregame strength, injuries, line combinations, possession/zone, standings incentives or current-season live updates are separately modelled.
- Historical live bookmaker prices are not included. ROI, execution quality, suspensions and realistic profitability have not been backtested.
- Coach defaults follow the NHL list of 23 June 2026; verify the coach actually on the bench. A newly hired coach without games in the training sample receives pooled forecasts.
- Next-goal and spread bets from one game are correlated. The calculator does not recommend stake sizes or treat these as independent bets.

## Reproduce and inspect

The source ZIP includes the fitted data, state table, extraction/fitting code, calculator template, engine, validation predictions, calibration tables and test results. No raw 192 MB archive is duplicated; the earlier NHL_Historical_Data_2021-2026.zip supplies raw inputs if rebuilding from scratch.

Python dependencies: pandas, numpy, pyarrow, scipy, lxml. Run `build_states.py /path/to/extracted/NHL_archive`, then `fit_model.py`, `build_coaches.py` (requires the supplied season schedule JSON and dated coach HTML), `fit_coaches.py`, `build_app.py`, and `update_report_coaches.py`. The fitting code does not require an API key. The browser calculator does not require Python. The engine is also importable from Node through `engine.js` and `model.json`.

Sources: [NHL_DB archive](https://huggingface.co/datasets/RentoSaijo/NHL_DB), [nhlscraper documentation](https://rentosaijo.github.io/nhlscraper/reference/gc_play_by_plays.html), [NHL team divisions](https://www.nhl.com/info/teams/). Data is NHL-derived and compiled by RentoSaijo/NHL_DB. No sportsbook integration is implied.

## Coach integration: data and validation

Historical coaching tenures are linked to game dates, then to the trailing team’s coach at that game. The sample includes **65 historical coaches** and **1 unknown assignment among 13,120 team-games**. The unknown game remains in pooled team data without a coach match. [Dated tenures](https://statvault.org/coaches/nhl) and [game dates](https://morehockeystats.com/data/files) are compiled third-party data. The selector uses the [NHL’s 23 June 2026 coach list](https://www.nhl.com/news/topic/offseason/nhl-coaches-2023-24-season-290549742). A temporary bench replacement may be missed in the compiled tenure source.

The pull estimator adds `24 × same_trailing_coach` to its existing additive historical weighting, including matches from a prior team. This weight was selected on 2024–25 from 0, 2, 8 and 24. The next-goal and spread validation selected a coach weight of `0`, so coach selection **does not change the market odds**. A coach new to the five-season sample has no coach matches; the estimator uses pooled history.

| 2025–26 held-out pull within 60 seconds (lower is better) | Brier score |
|---|---:|
| Previous team/context model | 0.042534 |
| Coach-enhanced model | 0.042103 |

The paired game-cluster bootstrap 95% interval for coach-enhanced minus previous pull Brier is **[-0.000930, -0.000160]**. This measures average predictive improvement, not coach causation or betting profitability. The first model was developed before this retrospective coach study; a later untouched season would provide a stronger independent test.

Coach history shows first classified pull clocks for the chosen coach and team, conditional on pulling. The evidence line shows same-coach comparison games overall and with the chosen team at the exact score and clock. These can be sparse for new hires.

## Single-season trends and the next season

The **Historical sample** input isolates 2021–22, 2022–23, 2023–24, 2024–25, 2025–26 or the in-progress 2026–27 season. The selected year filters the *actual historical states* used for pull timing, next-goal, empty-net and spread calculations. The coach, team pull-time and opponent empty-net profiles are filtered to that same year. “All available seasons” restores the pooled, chronologically validated model. The odds, when displayed, are empirical fair prices based on the selected sample; no historical sportsbook prices are attached.

The original holdout metrics and coach weight selection belong to the **pooled five-season estimator**. Single-year market prices were not separately tuned or backtested. The same baseline support threshold of 60 matching games and effective sample threshold of 40 applies; a very narrow one-year state may withhold a betting price. Check coach-specific matching game counts: a league-wide one-year sample can be adequate even when a newly hired coach’s matching sample is tiny. Year-to-year movement is descriptive, not a significance test; do not infer a profitable trend from a few cells.

The 2026–27 regular season began **29 September 2026** and expands to **84 games per team / 1,344 games** ([NHL announcement](https://www.nhl.com/news/nhl-announces-2026-27-regular-season-schedule)). This build includes every completed game through **October 25, 2026**, and the calculator exposes 2026–27 as a standalone season filter.

`refresh_season.py` checks the public provider and game-date source. Run `python refresh_season.py --season 2026` to check availability, and use `--refresh` only after complete game and coach coverage is available. `append_official_games.py` can fill a lagging archive from official NHL gamecenter feeds, but it refuses non-final games and still requires complete play-by-play, shifts and rosters. The refresh path was dry-run against all 1,312 completed 2025–26 regular-season games: it rebuilt the same 16,314 qualifying states and 972 tactical episodes without changing the delivered historical model. The script checks completed periods, home/away identities, goalie shifts and dated coaching assignments, rebuilds the 2026–27 state table, replaces this season’s prior partial rows, updates the offline HTML, and leaves the frozen historical validation scores untouched. It aborts if coach assignments are unknown, data is incomplete or an upstream schema has changed. The hosted tool is updated by the scheduled refresh; a downloaded HTML file remains a fixed offline copy. Early-season estimates may have no coach history and insufficient same-year comparison games; select pooled seasons when the year-only view withholds a quote. The expanded 84-game schedule and any concurrent strategic changes can reduce the relevance of older seasons.

## Coach-only profile across teams

The calculator’s **Coach explorer · all teams** lets you select any historical coach independently of the trailing team and opponent inputs. It combines all the teams and years the person coached within the archived 2021–22 through 2025–26 regular seasons. The selected season also filters this profile. The explorer displays teams and games coached, classified first-pull clock medians by deficit, the number of comparable opportunities, and excluded ambiguous pull labels. Choosing a coach here does not change the sportsbook pricing inputs above; use the separate *Trailing head coach* field for that estimate.

For a coach-to-coach comparison, a game qualifies if the team is trailing by one or two goals at **5:00 remaining** with a recognized goalie-in 5-on-5 or goalie-out 6-on-5 state. A screened goalie pull by **3:00 remaining** counts as an early pull. Each game enters once. Pull outcomes marked ambiguous are excluded, but shown separately. There were **3,071** candidate coach-games; **466** had uncertain labels, leaving **2,605 known coach-games**. The league-wide early rate on those known games was **22.4%**. Other scores and manpower situations are outside this particular comparison.

The adjusted comparison starts at the league rate, adds each coach’s average difference from games with the same **season, deficit and home/away status**, and divides that difference by `n + 30` rather than `n` to shrink small samples. Coaches need **at least 30 known qualifying games** to be ranked; **39** passed this cutoff. This is a descriptive standardized rate, not the probability the coach will pull in a live game. Current team, strength, possession, opposition and coaching changes can explain part of an association. The approximate intervals in the explorer resample the coach’s eligible games with the league baseline fixed; they do not account for all model and label uncertainty. Ranks can overlap substantially.

| Earlier group (2021–26) | Known games | Early pulls | Adjusted comparison | Teams in sample |
|---|---:|---:|---:|---|
| Patrick Roy | 37 | 22 | 36.9% | NYI |
| Jim Montgomery | 50 | 20 | 32.8% | BOS, STL |
| Dean Evason | 60 | 21 | 31.1% | MIN, CBJ |
| Paul Maurice | 66 | 22 | 30.7% | FLA, WPG |
| Craig Berube | 79 | 27 | 29.7% | STL, TOR |

| Later group (2021–26) | Known games | Early pulls | Adjusted comparison | Teams in sample |
|---|---:|---:|---:|---|
| Luke Richardson | 53 | 2 | 12.0% | CHI |
| Scott Arniel | 37 | 6 | 14.7% | WPG |
| Lane Lambert | 52 | 6 | 14.8% | NYI, SEA |
| Bruce Cassidy | 80 | 11 | 15.3% | VGK, BOS |
| Mike Sullivan | 70 | 8 | 15.7% | PIT, NYR |

A coach’s median first pull is conditional on a classified pull happening and can be misleading without the no-pull denominator. The 5:00 opportunity measure includes games with no pull, which makes the earlier/later comparison more meaningful. A coach may appear on the list despite moving teams (for example, Jim Montgomery at Boston and St. Louis). Coach identity improved the historical pull forecast on the earlier holdout; this ranking by itself was not validated as a betting strategy.


## Planning view: estimate the first pull without entering a clock

The **Plan ahead** view uses a fixed reference state; **Live game** is the default. Choose the trailing team and coach, opponent, score deficit, venue, goalie state, and historical seasons. For a goalie still in net at five on five, it assumes the team is trailing by the chosen margin at **10:00 remaining**. It uses matching 10:00 historical snapshots and the model's validated coach/team/opponent weighting to estimate the first future pull clock, its 25th–75th percentile window conditional on a pull, and the probability a pull has occurred by 5:00, 3:00, 2:00 and 1:00. Those cumulative probabilities divide by games with a known future pull outcome and include games with no pull; uncertain labels are disclosed separately. The underlying observation may later change deficit or include other events; this is a planning forecast conditional on the 10:00 reference state, not a claim that the current score will persist. Unsupported strata are withheld. If the goalie is already out, there is no first-pull forecast. Switch to **Live game** to enter the actual remaining clock and see next-goal and full-game spread prices; these are conditional on the live state, not prices derived from a prospective pull time. The planning timing estimates themselves have not been separately tested for calibration at each displayed clock threshold.


## Opponent empty-net goal odds at the projected pull time

The planning view estimates a coach-informed median pull clock, conditional on a future classified pull, and rounds to the nearest 30-second historical snapshot. It then independently compares two supported conditions with the same selected deficit, venue, trailing team and leading opponent: trailing goalie still in (five on five), and trailing goalie already out (six on five). No exact score is needed for the empty-net outcome. Each price uses the held-out-selected market weights for teams, division and recency; the validated coach weight for market outcomes is zero. Coach selection changes the estimated pull clock, and can therefore change the historical state used for these *conditional* prices.

“Opponent empty-net goal” is **at least one goal scored into the trailing team's unguarded net before regulation ends**, whether or not it is the next goal. The reverse “no opponent empty-net goal” is also displayed. Fair decimal odds are `1 / p` where both win and loss occurred; American odds accompany them. The opponent's next regulation goal is shown separately: it includes ordinary goals and assumes a no-further-goal result loses the opponent selection. The optional full-game spread is from the same conditional game state.

The opponent's descriptive empty-net episode record reports goals, screened episodes and time exposed. Its numerator and denominator differ from the state-based forecast, so do not interchange the two percentages. A goalie may return and be pulled again later; the forecast looks for any future opponent empty-net goal. The before/after rows describe different groups of historical games and do not estimate the causal effect of a pull. The goalie may not be pulled at the median clock; the deficit may change first. The empty-net goal estimates and scenario odds have not been independently calibrated against sportsbook prices or tested for profitability. The goalie-in and goalie-out snapshots are conditional quotes for that future state, not current fair odds for a wager placed earlier. Bookmaker next-goal and empty-net-specific settlement rules should be checked against these definitions.

The source package retains final regulation score reconstruction and a regulation-only team-total calculation for future analysis. The main planning interface now centers the opponent's empty-net goal because team totals require an exact future score and have not been separately validated.


## League-wide coach pull aggression rank

The coach explorer shows the selected coach's rank across **all teams coached**, with the selected season filter applied. Its standardized early-pull statistic measures the percentage of known games in which the coach's trailing team was down one or two at 5:00 and had pulled by 3:00, adjusted for season, deficit and venue and shrunk toward the league average by 30 comparison games. Higher adjusted rate ranks as more aggressive. This includes no-pull games. The default all-season pool has 68 coach names: 39 meet the minimum 30 known games and receive a **qualified rank** from 1 through 39; 26 more have at least one known game and receive a **provisional position** among all 65 observed coaches; the remaining three have no known comparable games and are unranked. The expandable table includes all 68, shows game counts and makes provisional positions explicit. A single season can have no qualified coaches but still show provisional comparisons. Equal adjusted rates are ordered by larger known sample, then stable coach ID. Rankings are descriptive, not causal, and 466 pooled candidate games had ambiguous labels excluded from the rate.


## Coach behavior after switching franchises

A separate cross-franchise check of 14 coaches with at least 10 eligible games at both stops finds a moderate Pearson correlation **r = 0.45 (p = 0.107)** in adjusted early-pull propensity and a stronger exploratory rank correlation **ρ = 0.71 (p = 0.0048)**. The median first-pull clock has **r = 0.08 (p = 0.797)** between stops. This supports treating coach identity as a modest propensity prior, not a stable exact pull clock. The previously held-out improvement of the coach-weighted pull model is small and includes coaches who never changed teams. Detailed definitions, selected coach comparisons, uncertainty and reproduction are in `NHL_Coach_Portability_Analysis.md` in the source package.


## Compact live workflow

The default screen prioritizes teams, goal deficit, regulation clock and goalie status. Coach, venue and season are behind an advanced disclosure; next-goal and spread prices appear in one-tap tabs below the empty-net estimate. The current fitted market weights for individual teams, coach and venue are zero, while the pull model retains coach and team weights. Division is the only nonzero historical matching boost for the market model. This is a fitted-model audit, not a claim that the true effect of home ice or team quality is zero. See `NHL_Live_Interface_Audit.md` in the source package for the input-priority rationale, model limits and interaction checks.


## Strong recent-season weighting for the median pull clock

The default **Median-clock weighting** is now **Strong recent**, available inside the Coach disclosure. The conditional pull-time distribution uses an annual factor of **0.35**: an otherwise identical observation in the newest available season receives 1.00 weight, the prior season 0.35, two seasons earlier 0.1225, three earlier 0.042875 and four earlier 0.01500625. Thus a newest-season game gets about **2.86 times** the timing weight of a prior-season game, in addition to the existing coach/team matching factors. This applies to the **median and middle-half pull-clock range**. It does not retune pull probabilities, next-goal or spread outcomes: the pull-probability weighting remains at the validated annual factor 0.75. Scenario prices may change indirectly when a different median clock is selected. Historical descriptive coach ranks remain historical comparisons; select one season to isolate those too.

The chronological sensitivity check selected 0.35 on 2024–25 median-clock error among the tested factors 1, 0.75, 0.5, 0.35 and 0.25. At 10:00, conditional on a subsequent classified pull, mean absolute clock error was 47.05 seconds with the original factor versus 46.76 with 0.35 on the 488 validation pulls; on 455 held-out 2025–26 pulls it was 46.70 versus 46.44 seconds. The gain is small, so stronger recency primarily reflects the requested preference for current tendencies, not a major demonstrated accuracy improvement. The short-horizon pull-probability sensitivity did not consistently favor stronger recency across the two years, which is why that probability weighting stays separate. `validate_recent_pull.py` and `pull_recency_sensitivity.json` reproduce this check; its pull-probability metric averages eligible snapshots equally within each game and is not directly interchangeable with the older headline validation metric.

**Season isolation remains available.** Choose an individual year in Historical sample to exclude every other year from prediction and profiles. Within one season, the recency factor is a common multiplier and does not change the median. Until completed 2026–27 data are ingested, its selector is disabled and marked awaiting data. Successful updates add the season to the available choices automatically. The newest available season becomes the newest weighting reference; early-season sample sizes and normal support thresholds still apply. Current-season-only results can be withheld when a state has too few comparable observations. The existing daily refresh checks completed game days and publishes only after the required data and coach assignments are available.


## Empty dropdowns or calculator startup

Download and extract `NHL_Late_Game_Calculator_Download.zip`, then open the extracted HTML directly in Chrome or Safari with JavaScript enabled. An in-app preview may block scripts. The calculator now keeps controls disabled until initialization completes and displays a startup notice with opening instructions; initialization errors display their message. A normal-browser check verified 32 selectable teams and 68 coach explorer profiles, interaction checks, and mobile layout. A JavaScript-disabled check verified that the instructions remain visible. No change to model probabilities was made for this fix.
