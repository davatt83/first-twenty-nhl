/* Live evidence, fixed-state clock comparison and descriptive team decomposition. */
(()=>{
'use strict';
if(document.getElementById('liveEvidence')||!window.__model)return;
const $=id=>document.getElementById(id),data=window.__model.data,model=window.__model;
const pct=x=>x==null?'—':(100*x).toFixed(1)+'%',fmt=(x,n=1)=>x==null?'—':Number(x).toFixed(n),clock=x=>x==null?'—':Math.floor(Math.round(x)/60)+':'+String(Math.round(x)%60).padStart(2,'0');
const section=(id,title)=>{const s=document.createElement('section');s.id=id;s.className='support';s.style.cssText='margin:16px 0;padding:16px;border:1px solid #d4e3df;border-radius:12px;background:#f6faf8;color:#173c36';s.innerHTML='<h3>'+title+'</h3>';return s;};
const evidence=section('liveEvidence','Evidence behind this estimate'),future=section('clockComparison','If the score stays the same'),profile=section('teamExecution','Pull timing, scoring and conceding');
$('results').prepend(evidence);$('results').append(future,profile);
let own=null,adjusted=null;
const divisions={};['BOS BUF DET FLA MTL OTT TBL TOR','CAR CBJ NJD NYR PHI PIT WSH','ARI CHI COL DAL MIN NSH STL WPG UTA','ANA CGY EDM LAK SJS SEA VAN VGK'].forEach((s,i)=>s.split(' ').forEach(t=>divisions[t]=i));
function evidenceHTML(r){
 const q=r.query,[a,b,c,e,decay]=data.parameters,qc=q.coach??-1,cm=data.coachParameters?.market||0;
 const rows=(model.cells.get([q.remaining,q.deficit,q.out].join('/'))||[]).filter(x=>(!q.season||x[0]===q.season)&&(q.trailingGoals===undefined||x[16]===q.trailingGoals));
 let total=0,teamWeight=0,pair=0;
 for(const x of rows){const w=(1+a*(x[5]===q.trailing)+b*(q.leading>=0&&x[6]===q.leading)+c*(x[7]===q.home)+e*(q.leading>=0&&x[8]===+(divisions[data.teams[q.trailing]]===divisions[data.teams[q.leading]]))+cm*(qc>=0&&x[14]===qc))*Math.pow(decay,data.latestSeason-x[0]);total+=w;if(x[5]===q.trailing)teamWeight+=w;if(x[5]===q.trailing&&x[6]===q.leading)pair++;}
 const tr=data.teams[q.trailing],le=data.teams[q.leading]||'selected opponent';
 return `<h3>Evidence behind this estimate</h3><strong>${r.provisional?'Provisional · small sample':'Pooled historical estimate'}</strong><p>${r.n} comparable states · effective sample ${fmt(r.neff,0)} after weighting.</p><details><summary>Team contribution and weighting</summary><p class="small">${tr} as trailing team: ${r.ntr} · ${le} as leading team: ${r.nle} · exact pairing: ${pair}. ${pct(total?teamWeight/total:0)} of probability weight comes from ${tr} trailing; the remainder comes from other teams.</p><p class="small">${a===0&&b===0?'Team matching currently has zero weight in market probabilities: these are league-based estimates, with retained situation adjustments.':'Market probabilities combine league history with the retained team adjustments.'} Coach weight in market probabilities: ${cm}. Pull timing uses a separate weighting model (${r.actualPulls} observed future pulls; effective known-outcome sample ${fmt(r.neffKnown,0)}). Sample size is evidence volume, not a confidence score; displayed probability ranges omit model error.</p></details>`;
}
function render(){
 const r=window.__query();if(!r||!r.supported||$('results').hidden){evidence.hidden=future.hidden=profile.hidden=true;return;}evidence.hidden=future.hidden=profile.hidden=false;
 evidence.innerHTML=evidenceHTML(r);
 const q=r.query;
 future.innerHTML='<h3>If the score stays the same</h3><p class="small">Same teams, deficit, venue, coach, season and goalie status at each clock. Separate historical snapshots—not a forecast that the next minute will pass without a goal. Regulation outcomes only.</p><div class="tablewrap"><table><thead><tr><th>Clock</th><th>Leader next</th><th>Trailing next</th><th>No more goals</th><th>Leader EN goal*</th><th>Evidence</th></tr></thead><tbody>'+[0,30,60].map(offset=>{
 const t=q.remaining-offset;if(t<30)return `<tr><td>+${offset}s</td><td colspan="5">${t<=0?'Regulation ends; no later snapshot.':'Below the model’s 0:30 minimum.'}</td></tr>`;
 const s=model.predict({...q,remaining:t});if(!s.supported)return `<tr><td>${clock(t)}</td><td colspan="5">No comparable evidence.</td></tr>`;
 return `<tr><td>${clock(t)}${offset?' (+'+offset+'s)':' · now'}</td><td>${pct(s.next[0])}</td><td>${pct(s.next[1])}</td><td>${pct(s.next[2])}</td><td>${pct(s.en)}</td><td>${s.n} states · effective ${fmt(s.neff,0)}${s.provisional?' · provisional':''}</td></tr>`;
 }).join('')+'</tbody></table></div><p class="small">*At least one leading-team empty-net goal before regulation ends; it need not be the next goal. Future snapshots can move unevenly because they use different historical samples.</p>';
 renderProfile(q);
}
function renderProfile(q){
 if(!own){profile.innerHTML='<h3>Pull timing, scoring and conceding</h3><p class="small">Loading team evidence…</p>';return;}
 const key=q.season?String(q.season):'combined',tr=data.teams[q.trailing],a=own.views[key]?.teams.find(x=>x.team===tr),timing=a?.timing.find(x=>x.deficit===q.deficit);
 if(!a)return;
 profile.innerHTML=`<h3>${tr} · strategy and execution</h3><p class="small">Descriptive own-net history · through ${own.dataThrough} · ${q.season?q.season+'–'+String(q.season+1).slice(-2):'both seasons'}. These measures do not change live odds.</p><div class="stats"><div class="stat"><span>When they pull · down ${q.deficit}</span><strong>${clock(timing?.medianPullSeconds)}</strong><small>${timing?.games||0} first screened pulls</small></div><div class="stat"><span>Scoring with own net empty</span><strong>${fmt(a.gfPer2,2)} / 2 min</strong><small>${a.gf} goals in ${a.episodes} episodes</small></div><div class="stat"><span>Conceding with own net empty</span><strong>${fmt(a.gaPer2,2)} / 2 min</strong><small>${a.ga} goals in ${fmt(a.seconds/60)} eligible minutes</small></div></div><p class="small">${a.ga?fmt(a.secondsPerGA,0)+' eligible seconds per conceded goal.':'No conceded goals in this sample; this does not imply zero risk.'} Exposure ÷ goals is not an expected waiting time. Execution rates cover all eligible 1–4-goal deficits; timing matches the selected deficit and only games with a screened pull. ${a.provisional?'Small execution sample. ':''}${timing?.games<20?'Small timing sample. ':''}Earlier pulling alone does not establish a better strategy.</p>`;
}
// Run after the calculator's own handlers, including matchup-side programmatic changes.
document.querySelectorAll('select,input').forEach(el=>el.addEventListener('change',()=>queueMicrotask(render)));render();
async function get(name){const r=await fetch(name,{cache:'no-store'});if(!r.ok)throw Error(name);return r.json();}
get('own-net-rankings.json').then(x=>{own=x;render();}).catch(()=>{profile.innerHTML='<h3>Team evidence unavailable</h3><p>Reload to retry. Live predictions remain available.</p>';});
const research=section('opponentAdjusted','Opponent-adjusted performance · experimental');research.className='panel';document.querySelector('.layout').after(research);
research.innerHTML='<h2>Opponent-adjusted performance</h2><p class="small">Loading adjusted rankings…</p>';
get('opponent-adjusted.json').then(x=>{
 adjusted=x;
 research.innerHTML=`<span class="tag">EXPERIMENTAL · DESCRIPTIVE</span><h2>Does opponent strength change the picture?</h2><p class="small">Compare the existing situation-adjusted index with an opponent-adjusted index. Above 100 is better than its benchmark. Live predictions are unchanged.</p><div class="two"><label>Team’s situation<select id="adjustedRole"><option value="defending">Facing an empty net</option><option value="own">Own net empty</option></select></label><label>Season<select id="adjustedSeason"><option value="combined">Both seasons</option><option value="2026">2026–27</option><option value="2025">2025–26</option></select></label></div><label>Sort by<select id="adjustedSort"><option value="index">Opponent-adjusted index</option><option value="baseline">Existing index</option><option value="delta">Largest upward change</option></select></label><p id="adjustedStatus" class="small"></p><div class="tablewrap" style="max-height:430px;overflow:auto"><table><thead><tr><th>Rank*</th><th>Team</th><th>Existing</th><th>Opponent-adjusted</th><th>Change</th><th>Episodes</th></tr></thead><tbody id="adjustedRows"></tbody></table></div><p class="small">*Rank follows the selected sort. † Fewer than 20 episodes or 10 eligible minutes.</p><details><summary>Does it predict later performance?</summary><div id="adjustedValidation"></div></details><details><summary>How the adjustment works</summary><p class="small">We estimate each opponent’s scoring and conceding tendency relative to its season, score and clock mix, excluding all games involving the team being rated. A fixed 20-minute league prior reduces sparse-opponent extremes. We multiply situation-matched expected goals by these opponent factors, then retain the existing 20-minute shrinkage for the final index. This is a single-pass descriptive adjustment, not a causal team-strength model. It does not adjust for lineups or individual players. The combined view uses opponent factors separately within each season.</p></details>`;
 function draw(){const role=adjusted.roles[$('adjustedRole').value],key=$('adjustedSort').value,rows=role.views[$('adjustedSeason').value].slice().sort((a,b)=>a[key]==null?1:b[key]==null?-1:b[key]-a[key]||a.team.localeCompare(b.team));
 $('adjustedRows').innerHTML=rows.map((r,i)=>`<tr><td>${r.index==null?'—':i+1}</td><td>${r.team}${r.provisional?' †':''}</td><td>${fmt(r.baseline)}</td><td>${fmt(r.index)}</td><td>${r.delta>0?'+':''}${fmt(r.delta)}</td><td>${r.episodes}</td></tr>`).join('');
 $('adjustedStatus').textContent='Data through '+adjusted.dataThrough+(adjusted.dataThrough!==data.dataThrough?' · Older than the live model; adjustment awaits a rebuild.':'');
 const v=role.validation;$('adjustedValidation').innerHTML=`<p><strong>${v.status}</strong></p><p class="small">Train on ${v.training}; test on ${v.testing}: ${v.teams} teams with at least 5 eligible minutes in both samples. Exposure-weighted mean squared error: existing ${fmt(v.baselineWeightedMSE,4)}; opponent-adjusted ${fmt(v.adjustedWeightedMSE,4)} (lower is better). Rank correlation: existing ${fmt(v.baselineSpearman,2)}; adjusted ${fmt(v.adjustedSpearman,2)}.</p><p class="small">${v.note||'Insufficient evidence.'}</p>`;
 }
 ['adjustedRole','adjustedSeason','adjustedSort'].forEach(id=>$(id).addEventListener('change',draw));draw();
}).catch(()=>{research.innerHTML='<h2>Opponent-adjusted performance</h2><p>Adjusted rankings could not load. Reload to retry; original rankings remain available.</p>';});
})();
