/** Reproducible first-period history diagnostics. No network or betting prices.
    A complete 1,312-game, venue-reconciled history is an absolute prerequisite. */
import fs from 'node:fs';
import vm from 'node:vm';
const inFile='data/games-20252026.json';
const previous=JSON.parse(fs.readFileSync(inFile,'utf8'));
if(!previous.meta?.complete || previous.games?.length!==1312){
 console.log('Historical research not published: verified 2025–26 game history is incomplete.');
 process.exit(0);
}
const history=previous.games;
const c=fs.readFileSync('model.template.html','utf8');
const teams=JSON.parse(c.match(/const TEAMS=(\{[^\n]+\});/)[1]);
const codes=Object.keys(teams);
const ids=new Set(history.map(g=>g.gameId));
if(ids.size!==1312 || codes.length!==32) throw Error('Season identities inconsistent');
for(const code of codes){
 for(const venue of ['home','away']){
  const gs=history.filter(g=>g[venue]===code);
  const gf=gs.reduce((s,g)=>s+(venue==='home'?g.hp1:g.ap1),0);
  const ga=gs.reduce((s,g)=>s+(venue==='home'?g.ap1:g.hp1),0);
  const t=teams[code];
  if(gs.length!==41||gf!==(venue==='home'?t.hgf:t.agf)||ga!==(venue==='home'?t.hga:t.aga)) throw Error('Venue mismatch: '+code+' '+venue);
 }
}
const n=history.length, goals=history.map(g=>g.hp1+g.ap1), hits=goals.filter(x=>x>=2).length, mu=goals.reduce((s,x)=>s+x,0)/n;
const varSample=goals.reduce((s,x)=>s+(x-mu)**2,0)/(n-1);
const bins=[0,1,2,3].map(k=>goals.filter(x=>k===3?x>=3:x===k).length);
const expected=[Math.exp(-mu),mu*Math.exp(-mu),mu*mu*Math.exp(-mu)/2,1-Math.exp(-mu)*(1+mu+mu*mu/2)].map(x=>n*x);
const chi2=bins.reduce((s,x,i)=>s+(x-expected[i])**2/expected[i],0);
const pChi2=Math.exp(-chi2/2); // 4 bins - 1 total - 1 fitted mean = df2
const fixed=(x,k=3)=>Number(x).toFixed(k);
function wilson(k,n){const z=1.95996398454,p=k/n,d=1+z*z/n,center=(p+z*z/(2*n))/d,half=z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n))/d;return [center-half,center+half]}
function binomP(k,n,p){let pmf=Math.pow(1-p,n),total=pmf<=0?0:0;const vals=[];
 for(let i=0;i<=n;i++){vals.push(pmf);pmf*=((n-i)/(i+1))*(p/(1-p));}
 const obs=vals[k];return Math.min(1,vals.reduce((s,x)=>s+(x<=obs*(1+1e-10)?x:0),0));}
const league=hits/n;
const teamRows=codes.map(code=>{const gs=history.filter(g=>g.home===code||g.away===code),h=gs.filter(g=>g.hp1+g.ap1>=2).length;return{team:code,games:gs.length,hits:h,rate:h/gs.length,p:binomP(h,gs.length,league)};}).sort((a,b)=>a.p-b.p);
let minimum=1;for(let i=teamRows.length-1;i>=0;i--){minimum=Math.min(minimum,teamRows[i].p*teamRows.length/(i+1));teamRows[i].bh=Math.min(1,minimum)}
const all=JSON.parse(fs.readFileSync('data/games-20262027.json','utf8'));
const context={};vm.runInNewContext(fs.readFileSync('scripts/engine.js','utf8')+'\nthis.FT=FirstTwentyEngine;',context);
const cv=context.FT.walkForward({teams,current:all.games,history});
const grouped=new Map();for(const r of cv.outcomes){if(!grouped.has(r.date))grouped.set(r.date,[]);grouped.get(r.date).push(r)}
const days=[...grouped.keys()];
let rand=20261021;const random=()=>{rand=(1664525*rand+1013904223)>>>0;return rand/4294967296};
const improvement=rows=>rows.reduce((s,r)=>s+(r.baseline-r.y)**2-(r.hybrid-r.y)**2,0)/rows.length;
const diff=improvement(cv.outcomes),boots=[];
for(let b=0;b<1200;b++){const arr=[];for(let j=0;j<days.length;j++){arr.push(...grouped.get(days[Math.floor(random()*days.length)]))}boots.push(improvement(arr));}
boots.sort((a,b)=>a-b);const ci=[boots[Math.floor(boots.length*.025)],boots[Math.floor(boots.length*.975)]];
const conf=wilson(hits,n);
const report=`# First Twenty — 2025–26 first-period scoring study\n\n`+
`**Data integrity:** ${n} unique completed NHL regular-season games, 32 teams × 82 games, 41 home + 41 away per team; all venue scoring totals reconciled. Data dates ${history[0]?.date}–${history.at(-1)?.date}. The 2026–27 model is separately refreshed and reported with its own verified data-through date.\n\n`+
`## 2025–26 observed first-period scoring\n\n`+
`- Over 1.5 goals: **${hits}/${n} = ${fixed(league*100,2)}%** (95% Wilson interval ${fixed(conf[0]*100,2)}%–${fixed(conf[1]*100,2)}%). This is a league-wide historical hit rate, **not** fair odds for an individual matchup.\n`+
`- Average combined first-period goals: **${fixed(mu)}**; sample variance **${fixed(varSample)}**; variance/mean **${fixed(varSample/mu)}**.\n`+
`- At the league-wide mean, Poisson predicts ${fixed((1-Math.exp(-mu)*(1+mu))*100,2)}% of periods with 2+ goals.\n\n`+
`| First-period goals | Observed games | Poisson expected games |\n|---|---:|---:|\n`+
['0','1','2','3+'].map((l,i)=>`| ${l} | ${bins[i]} | ${fixed(expected[i],1)} |`).join('\n')+`\n\n`+
`Pearson four-bin goodness-of-fit statistic χ²=${fixed(chi2,2)}, approximate df=2, p≈${fixed(pChi2,4)}. This is an **in-sample descriptive fit** using an estimated league mean, not a test of betting returns or opponent-level forecasts.\n\n`+
`## Do teams demonstrate persistent Over 1.5 tendencies?\n\n`+
`Each team has 82 games. The table compares each unadjusted observed hit count against the season league-wide rate, with Benjamini–Hochberg adjustment across 32 exploratory tests. Team outcomes overlap through shared matchups, schedules differ in opponent strength, and this is **not** a causal or independent signal test.\n\n`+
`| Team | Games over 1.5 | Hit rate | Unadjusted p | BH q |\n|---|---:|---:|---:|---:|\n`+
teamRows.map(x=>`| ${x.team} | ${x.hits}/82 | ${fixed(x.rate*100,1)}% | ${fixed(x.p,3)} | ${fixed(x.bh,3)} |`).join('\n')+`\n\n`+
`## 2026–27 chronological prediction checks\n\n`+
`Predictions for ${cv.count} completed games use the full, earlier 2025–26 history and only 2026–27 games from **earlier dates**. The parameters were researched using early 2026–27 results, so this remains exploratory rather than a clean independent holdout.\n\n`+
`| Model | Mean Brier | Mean log loss |\n|---|---:|---:|\n`+
['baseline','matchup','hybrid'].map(k=>`| ${k} | ${fixed(cv.metrics[k].brier,5)} | ${fixed(cv.metrics[k].logLoss,5)} |`).join('\n')+`\n\n`+
`Balanced minus baseline Brier improvement (positive is better): ${fixed(diff,5)}. Day-block bootstrap 95% interval: **[${fixed(ci[0],5)}, ${fixed(ci[1],5)}]**; includes zero = ${ci[0]<=0&&ci[1]>=0?'yes':'no'}. This is **not** a measured sportsbook edge.\n\n`+
`**Data/source note:** Official NHL gamecenter and daily scoring feeds, reconciled with an archived 1,312-game schedule; reproducible analysis in scripts/research-2025.mjs. No sportsbook odds or transactions were included.\n`;
fs.writeFileSync('RESEARCH_2025_26.md',report);
fs.writeFileSync('data/research-2025.json',JSON.stringify({complete:true,season:'20252026',games:n,hits,rate:league,mean:mu,variance:varSample,dispersion:varSample/mu,bins,expected,chi2,pChi2,wilson:conf,teams:teamRows,holdout:{count:cv.count,metrics:cv.metrics,brierImprovement:diff,brierImprovementCI:ci}},null,2)+'\n');
console.log(`History ${n}: ${hits} overs (${fixed(100*league,2)}%); chi² ${fixed(chi2,2)} p ${fixed(pChi2,4)}; teams BH q<.05 ${teamRows.filter(x=>x.bh<.05).length}; 2026 mean Brier original ${fixed(cv.metrics.baseline.brier,5)}, hybrid ${fixed(cv.metrics.hybrid.brier,5)}.`);