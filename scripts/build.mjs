/** Build one self-contained First Twenty HTML with every verified game baked in. */
import fs from 'node:fs';
const db=JSON.parse(fs.readFileSync('data/games-20262027.json','utf8'));
const games=db.games||[];
const m=db.meta||{};
const complete=Boolean(m.complete);
const meta={complete,checkedThrough:m.checkedThrough||null,lastGameDate:m.lastGameDate||null,verifiedGames:games.length,officialFinalCount:m.officialFinalCount??null,expectedCompletedThrough:m.expectedCompletedThrough||null,expectedCompletedGames:m.expectedCompletedGames??null,checkedAt:m.checkedAt||null};
let html=fs.readFileSync('model.template.html','utf8');
const escaped=JSON.stringify(games).replaceAll('<','\\u003c');
const injection=`const SEED=${escaped}; // Generated from game-level verified NHL first-period results\nconst EMBED_META=${JSON.stringify(meta)};`;
if(!/const SEED=\[[^\n]*; \/\//.test(html))throw Error('Seed marker missing from template');
html=html.replace(/const SEED=\[[^\n]*; \/\/[^\n]*/,injection);
// Embedded verified records always take precedence over older locally cached browser records.
html=html.replace('if(valid(g))games.set(g.id,g)','if(valid(g)&&!games.has(g.id))games.set(g.id,g)');
const cover=complete?
 `COMPLETE THROUGH ${meta.checkedThrough} · ${games.length} verified games embedded (NHL play-by-play + checked boxscores).`:
 `INCOMPLETE DATA · ${games.length}${meta.expectedCompletedGames?' / '+meta.expectedCompletedGames:''} verified games through ${meta.lastGameDate}; missing results remain. The season-only view is provisional.`;
html=html.replace(/<div class="status" id="status">[^<]*<\/div>/,`<div class="status" id="status">${cover}</div>`);
html=html.replace(/<div class="note" id="asOf"[^>]*>[^<]*<\/div>/,`<div class="note" id="asOf" style="margin-top:8px;color:${complete?'#6de2be':'#ffd09a'}">${cover}</div>`);
html=html.replace('11 verified boxscores preloaded · 140 games played through Oct 19',`Verified first-period records · ${games.length} games`);
html=html.replace('// Each opening requests updates; while the tab stays open, check after 4 a.m. Toronto time.',`function expectedLastCompleteDay(){const today=localDateMontreal();const hour=Number(new Intl.DateTimeFormat('en-GB',{timeZone:'America/Toronto',hour:'2-digit',hourCycle:'h23'}).format(new Date()));const d=new Date(today+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-(hour>=4?1:2));return d.toISOString().slice(0,10)}
// Opened after 4 a.m. Toronto: only refresh if embedded coverage is stale.`);
html=html.replace(/function dataSummary\(\)\{/,`function dataSummary(){`);
// Remove the former hard-coded 140-game completeness estimate, replacing it with the published coverage manifest.
html=html.replace(/txt\('#asOf','Latest verified first-period game: '[^\n]*?\);/,`txt('#asOf',EMBED_META.complete?'Complete verified game log through '+EMBED_META.checkedThrough+' · '+cur+' verified games included.':'Partial NHL data: '+cur+' games saved'+(EMBED_META.expectedCompletedGames?' of '+EMBED_META.expectedCompletedGames+' completed through '+EMBED_META.expectedCompletedThrough:'')+'. Latest verified '+newest+'. Incomplete coverage.');`);
html=html.replace(/txt\('#warning',mode==='current'\?/,"txt('#warning',mode==='current'?");
html=html.replace("'PARTIAL 2026–27 coverage: '+nH.n+' '+home+' games and '+nA.n+' '+away+' games saved. These are not full current-season samples; current-only estimates are provisional.'", "(EMBED_META.complete?'Current-season sample: '+nH.n+' '+home+' games and '+nA.n+' '+away+' games. Small-sample uncertainty remains.':'PARTIAL 2026–27 data: '+nH.n+' '+home+' games and '+nA.n+' '+away+' games. Incomplete coverage; provisional estimates.')");
html=html.replace("'PARTIAL 2026–27 coverage: '+nH.n+' '+home+' games and '+nA.n+' '+away+' games saved. These are not full current-season samples; refresh before betting.'", "(EMBED_META.complete?'Verified NHL games through '+EMBED_META.checkedThrough+'. Observed rates and Poisson probabilities are distinct.':'PARTIAL NHL data: '+nH.n+' '+home+' games and '+nA.n+' '+away+' games. The current-season sample is incomplete.')");
// The hosted HTML is itself refreshed daily; allow manual NHL refresh for extra updates,
// but don't auto-run costly unreliable CORS-proxy backfills when the published data is complete.
html=html.replace("(async()=>{await refresh('current');})(); // Previous-season detailed logs remain an optional user-triggered task; aggregates already embedded.","if(!EMBED_META.complete || EMBED_META.checkedThrough < expectedLastCompleteDay()){refresh('current');} // Stale local copies try a refresh; hosted model updates via the scheduled workflow.");
html=html.replace("if(hour>=4 && lastCheckDate!==date){lastCheckDate=date;refresh('current')}","if(hour>=4 && EMBED_META.checkedThrough < expectedLastCompleteDay() && lastCheckDate!==date){lastCheckDate=date;refresh('current')}");
fs.writeFileSync('index.html',html);
console.log('Built index.html with',games.length,'embedded 2026–27 games. Complete:',complete);