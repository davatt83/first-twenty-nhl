# First Twenty — embedded NHL 2026–27 records with daily publishing

**What this package contains:** The original First Twenty browser calculator, all 140 verified completed 2026–27 games through October 19, and an automated official-NHL ingestion/build workflow that can republish the **same** website each morning. No Python, terminal, or scripts on your Mac are required once it is hosted.

## Verified current-season data — October 20, 2026

- **140 of 140** completed 2026–27 regular-season game first-period results are embedded for **September 29–October 19, 2026**, inclusive.
- Data provenance: 89 NHL official Gamecenter play-by-play games independently reconstructed from a previously saved validated archive (first-period goals reconciled with goal events), 40 additional first-period results from dated CBS Sports scoreboard period tables, and 11 original game results independently cross-checked against the CBS tables. All 140 records are distinct.
- Cross-validated by game date, home team, away team, first-period goal count and all 21 scheduled game dates; no missing results through October 19.
- **The October 20 game day is not included.** These games may still be playing at the moment this model was produced. The 4 a.m. October 21 refresh should check them.
- Complete coverage is **through the dated cutoff only**, not through every future/current game. A downloaded HTML does not physically rewrite itself; the hosted HTML is rebuilt daily after the workflow is activated.
- The completed 2025–26 historical reference remains **team-level aggregates** (all 32 teams). It does not include complete 2025–26 individual-game hit-rate records.

## What automatic updating will do

1. Every morning around **4 a.m. America/Toronto**, GitHub Actions runs `scripts/update.mjs`, which requests the official NHL's `/score/YYYY-MM-DD` and Gamecenter feeds beginning **September 29, 2026**.
2. It accepts only completed **regular-season** games and obtains period-one goal totals from scoring events. It verifies team identities, unique records, 0–0 periods, source consistency and coverage for every game day up to the preceding Toronto calendar date.
3. If **any day or game fails** validation, that run fails and the **previous published file stays intact**. A later run retries the missing data.
4. On success, `scripts/build.mjs` writes the entire verified game array directly into `index.html` (`const SEED=...`), then `scripts/test.mjs` checks it. The workflow commits the updated HTML and JSON to the **same repository**, then **directly deploys the verified index.html as a GitHub Pages artifact in the very same workflow run**. This avoids a GitHub restriction where the action's own GITHUB_TOKEN commits do not trigger a separate Pages build.
5. You continue using one bookmarked URL. The HTML displays checked-through date and coverage. No CSV import or local Python.

Scheduled GitHub Actions jobs may start later than the exact requested minute. The workflow contains a daylight-saving/standard-time guard so it executes once per Toronto morning, not twice.

## Activate the recurring, hosted model

The connected GitHub account is **davatt83**. ChatGPT can add repository files through the connected GitHub app **after a repository exists**, but it cannot create a new repository with the actions currently authorized.

1. Open `https://github.com/new?owner=davatt83&name=first-twenty-nhl&visibility=public`, choose **Public** (on Free GitHub Pages), check **Add README**, and click **Create repository**. Public means the model's code and scores are visible to others.
2. In the ChatGPT conversation, confirm that `davatt83/first-twenty-nhl` exists. The connected GitHub tools can then upload the project contents without requiring you to run local code. Upload the workflow file **last** so its push triggers a single initial validation and deployment. Alternatively, place **the contents** of this ZIP in the repository root yourself, preserving `.github/workflows/daily.yml`, `scripts/`, and `data/`.
3. In **Settings → Actions → General**, allow GitHub Actions. The workflow requests `contents: write`, `pages: write`, and `id-token: write`. If your account policy blocks workflow pushes, adjust the Actions permissions for this repository.
4. In **Settings → Pages**, under **Build and deployment → Source**, select **GitHub Actions** (not Deploy from a branch).
5. Committing the workflow file **last** triggers the first validation and deployment automatically. Alternatively use **Actions → Update and publish First Twenty NHL → Run workflow**. Wait until the job is **green**, and confirm `data/coverage.json` has `"complete": true`. That same workflow deploys the website.
6. Bookmark `https://davatt83.github.io/first-twenty-nhl/`. Subsequent successful refreshes deploy an updated embedded HTML to the **same URL**, without downloading replacement models.

**Never interpret an unfinished (red) workflow run as an updated model.** A GitHub Pages URL or repository does not exist until you create and enable one. GitHub scheduled workflows can start late, so the refresh is scheduled for approximately 4 a.m., not precisely guaranteed at 4 a.m.

## Locally, without GitHub

Double-click `index.html` to open the existing offline snapshot (complete through October 19, 2026, but not thereafter). The Refresh button attempts direct NHL API requests and browser CORS relays, but this is a fallback, not reliable unattended updating. A downloaded HTML cannot rewrite its own source file every day. GitHub/cloud hosting is necessary for a consistently refreshed *embedded* dataset.

## Files

- `index.html` — generated browser calculator, including game data in the HTML
- `model.template.html` — UI and probability engine template, retained for daily builds
- `data/games-20262027.json` — season game records, one per matchup/date
- `data/coverage.json` — created after first successful NHL backfill; contains verification metadata
- `scripts/update.mjs` — official NHL-only downloader/validator, Node 22, no external packages
- `scripts/build.mjs` — regenerates HTML with game records embedded
- `scripts/test.mjs` — checks embedded output
- `scripts/fixture-test.mjs` — synthetic test for 0–0 first periods and complete games
- `.github/workflows/daily.yml` — unattended daily refresh and publish job

## Source and betting caveat

NHL endpoint: `https://api-web.nhle.com/v1/score/YYYY-MM-DD` and `/gamecenter/GAMEID/landing` / `play-by-play`. These are publicly accessible APIs, but their shape and availability could change. The updater fails closed if it cannot verify games. Predicted Over 1.5 probabilities still use a simplistic Poisson goal-count model; a complete historical database does not itself prove the betting model predicts profitable odds.