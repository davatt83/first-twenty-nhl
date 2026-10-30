# Empty-Net Performance Index — first descriptive edition

This ranks the team defending 5-on-6 against a tactical empty net. It does not modify fair odds. Data cover 2025–26 and completed 2026–27 games through October 29, 2026, matching the verified model snapshot.

## Definitions

Only regular-season third-period final-ten-minute exposure while the defending team leads by 1–4 is counted. The existing rule-screened tactical-pull episodes identify candidate intervals. Within them, merged per-player shift coverage must show defending skaters=5, defending goalies=1, attacking skaters=6 and attacking goalies=0. Duplicate overlapping shifts cannot inflate counts. Exposure is integer clock seconds, not wall time. Repeated pulls remain separate episodes, but an episode contributes only its qualifying seconds. A goal at the episode ending clock is eligible using preceding-second exposure and the event's recorded manpower/empty-net flags; a goal at its starting clock is excluded. Goals at shared boundaries cannot be counted twice. Own-goal records use the official scoring-team attribution.

For each second, reconstruct the score from preceding regulation goal events. Goals use the pre-goal score band. Exclude ambiguous/delayed-penalty absences, mismatched manpower, tied or unsupported deficits and exposure before the final ten minutes. The source screening excludes an entire absence containing a penalty, which can introduce selection bias; this is not a census of all empty-net play. Results are conditional on this screened sample.

## Coefficients

- Raw net coefficient: `120 × (GF − GA) / exposure_seconds`.
- Expected GF and GA: sum the exposure in each season × lead (1, 2, 3–4) × clock band (0–60, 61–120, 121–300, 301–600) multiplied by that cell's league scoring/conceding rates.
- Adjusted net coefficient: `120 × (GF − GA − expected_GF + expected_GA) / (exposure_seconds + 1200)`.
- Index: `100 + 100 × adjusted_net_coefficient`. Index 120 means +0.20 adjusted net goals per two minutes, NOT 20% higher goal probability.
- Attack contribution: `120 × (GF − expected_GF)/(seconds+1200)`; defence contribution: `120 × (expected_GA − GA)/(seconds+1200)`. These sum to the adjusted coefficient.

The 20-minute prior is an explicit untuned design choice. The benchmark is 100; the unweighted average of team indices need not equal 100 after shrinkage. Zero-exposure teams receive no estimate. Small samples are marked provisional below 20 episodes OR 10 minutes; this is not a significance test. Combined seasons use equal weighting per observed second, while situational baselines remain season-specific. No opponent-strength or personnel adjustment is claimed.

## Audit and exploratory stability

Current audit (October 29): {"screenedEpisodes": 1128, "eligibleEpisodes": 1066, "excludedSeconds": 5375, "excludedGoalEvents": 4, "acceptedGF": 498, "acceptedGA": 178, "unsupportedEpisodes": 58, "seconds": 75275, "gf": 498, "ga": 178, "uniqueEpisodes": 1066, "games": 824}. Every accepted second has a unique game/team/second key. Granular exposure cells are in the CSV.

A chronological split of 2025–26 games containing exposure, with at least five minutes per team in each half, compares first-half shrunk index with second-half unshrunk adjusted net performance. All 32 teams qualified: Spearman rho=0.273, p=0.131. This is exploratory and does not establish predictive value. No ROI or probability calibration claim is made. League baselines are calculated separately within each half. No ranking uncertainty intervals are estimated; small differences should not be treated as reliable orderings.

## Reproduce and refresh

Requires Python with pandas, numpy, pyarrow and scipy. Run `python build_rankings.py SOURCE_DIR HISTORICAL_RAW_DIR OUTPUT_DIR`. SOURCE_DIR is the extracted validated NHL_Model_Source_and_Results.zip, containing tactical_episodes.csv, game_index.csv, team_abbreviation_evidence.csv, model.json and raw_2026/. HISTORICAL_RAW_DIR contains the three 20252026 parquet files from NHL_Historical_Data_2021-2026.zip. Review audit and run test_rankings.py. Publish generated empty-net-rankings.json and exposure CSV together; preserve rankings.js and its loader at the end of matchups.js. Do not publish a ranking with dataThrough later than its verified raw inputs or advance the main model date for a presentation change.
