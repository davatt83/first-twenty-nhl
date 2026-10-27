/* Daily fixtures shared with First Twenty. No live score assumptions. */
(async function(){
'use strict';
const el=id=>document.getElementById(id);
const data=JSON.parse(el('model-data').textContent);

const modelStatus=document.createElement('section');
modelStatus.id='modelDataStatus';
modelStatus.setAttribute('aria-label','Model data freshness');
modelStatus.style.cssText='display:flex;flex-wrap:wrap;gap:10px 28px;align-items:center;padding:14px 18px;margin-bottom:18px;background:#fff;border:1px solid #dbe5e4;border-radius:12px;color:#183b36;font-size:12px;line-height:1.6';
function formatModelDate(value){
 if(!value)return 'Not recorded';
 if(/^\d{4}-\d{2}-\d{2}$/.test(value)){
  const dt=new Date(value+'T12:00:00Z');
  return Number.isNaN(dt.getTime())?'Not recorded':new Intl.DateTimeFormat('en-CA',{timeZone:'UTC',month:'short',day:'numeric',year:'numeric'}).format(dt);
 }
 const dt=new Date(value);
 return Number.isNaN(dt.getTime())?'Not recorded':new Intl.DateTimeFormat('en-CA',{timeZone:'America/Toronto',month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit',timeZoneName:'short'}).format(dt);
}
for(const [label,value] of [['Games included through',data.dataThrough],['Model last updated',data.updatedAt||data.asOf]]){
 const item=document.createElement('div'),caption=document.createElement('span'),valueEl=document.createElement('strong');
 caption.textContent=label+' ';caption.style.color='#60747c';
 valueEl.textContent=formatModelDate(value);item.append(caption,valueEl);modelStatus.append(item);
}
if(!(data.updatedAt)&&/^\d{4}-\d{2}-\d{2}$/.test(data.asOf||'')){
 const note=document.createElement('span');note.textContent='Update time not recorded';note.style.cssText='font-size:10px;color:#728078';modelStatus.append(note);
}
document.querySelector('main').prepend(modelStatus);

const dateNow=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Toronto',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const panel=document.createElement('section');
panel.className='panel';panel.id='dailyMatchups';
panel.innerHTML='<h2>Choose a game</h2><label class="compact-label">Game day<input id="fixtureDate" type="date"></label><label class="compact-label" style="margin-top:8px">Matchup · away @ home<select id="fixtureGame"><option value="">Manual team selection</option></select></label><p id="fixtureStatus" class="small" role="status">Loading the NHL schedule…</p><div id="fixtureSides" hidden><p class="small">Which team is trailing?</p><div class="two"><button type="button" id="fixtureAway"></button><button type="button" id="fixtureHome"></button></div><p id="fixtureVenue" class="small"></p></div>';
document.querySelector('.inputs').before(panel);
el('fixtureDate').value=dateNow();
let schedule=null,selected=null;
const teamLabels=['trailing','leading'].map(id=>el(id).closest('label'));
const name=code=>Array.from(el('trailing').options).find(o=>+o.value===data.teams.indexOf(code))?.textContent||code;
function unlock(){document.querySelectorAll('.inputs select,.inputs input,.inputs button').forEach(x=>x.disabled=false);}
function manual(){
 unlock();
 selected=null;teamLabels.forEach(x=>x.hidden=false);el('home').disabled=false;el('fixtureSides').hidden=true;
 el('results').hidden=false;
 el('trailing').dispatchEvent(new Event('change'));
}
function chooseSide(home){
 if(!selected)return;
 unlock();el('home').disabled=true;
 const tr=home?selected.home:selected.away,le=home?selected.away:selected.home;
 el('trailing').value=String(data.teams.indexOf(tr));el('leading').value=String(data.teams.indexOf(le));el('home').value=home?'1':'0';
 el('fixtureAway').className=home?'secondary':'';
 el('fixtureHome').className=home?'':'secondary';
 el('fixtureAway').setAttribute('aria-pressed',String(!home));el('fixtureHome').setAttribute('aria-pressed',String(home));
 el('fixtureVenue').textContent=name(tr)+' trailing · '+(home?'Home':'Away')+' · enter the current deficit, clock and goalie status below.';
 el('trailing').dispatchEvent(new Event('change'));
}
function selectGame(){
 const day=schedule?.days.find(d=>d.date===el('fixtureDate').value);
 selected=day?.games.find(g=>g.id===el('fixtureGame').value)||null;
 if(!selected){manual();return;}
 teamLabels.forEach(x=>x.hidden=true);el('home').disabled=true;el('fixtureSides').hidden=false;
 el('fixtureAway').textContent=name(selected.away)+' · Away';el('fixtureHome').textContent=name(selected.home)+' · Home';
 for(const id of ['fixtureAway','fixtureHome']){el(id).className='secondary';el(id).setAttribute('aria-pressed','false');}
 el('fixtureVenue').textContent='Select the trailing team to load this matchup.';
 el('results').hidden=true;el('error').hidden=true;
 document.querySelectorAll('.inputs select,.inputs input,.inputs button').forEach(x=>x.disabled=true);
}
function draw(){
 const date=el('fixtureDate').value,day=schedule?.days.find(d=>d.date===date);
 el('fixtureGame').replaceChildren(new Option('Manual team selection',''));
 manual();
 if(!day){el('fixtureStatus').textContent='Schedule unavailable for this date. Use manual team selection.';return;}
 for(const g of day.games){
  if(!data.teams.includes(g.away)||!data.teams.includes(g.home)||['POST','CNCL'].includes(g.scheduleState))continue;
  const time=g.startUTC?new Intl.DateTimeFormat('en-CA',{timeZone:'America/Toronto',hour:'numeric',minute:'2-digit'}).format(new Date(g.startUTC))+' ET':'Time TBD';
  el('fixtureGame').add(new Option(g.away+' @ '+g.home+' · '+time,g.id));
 }
 const count=el('fixtureGame').options.length-1;
 const checked=new Date(schedule.fetchedAt);
 const stale=Date.now()-checked.getTime()>36*3600000;
 el('fixtureStatus').textContent=(count?count+' games':'No scheduled regular-season games')+' · times in Montreal. Schedule checked '+checked.toLocaleString('en-CA',{timeZone:'America/Toronto',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})+' ET.'+(stale?' Older schedule — confirm any changes.':'')+' Scores and clock are entered manually.';
}
el('fixtureDate').addEventListener('change',draw);
el('fixtureGame').addEventListener('change',selectGame);
el('fixtureAway').addEventListener('click',()=>chooseSide(false));
el('fixtureHome').addEventListener('click',()=>chooseSide(true));
for(const url of ['https://raw.githubusercontent.com/davatt83/first-twenty-nhl/main/data/upcoming.json','./upcoming.json']){
 try{
 const r=await fetch(url+'?t='+Date.now(),{cache:'no-store',signal:AbortSignal.timeout(12000)});
 if(!r.ok)throw Error('Schedule unavailable');
 const j=await r.json();
 if(!Array.isArray(j.days)||!Number.isFinite(Date.parse(j.fetchedAt))||j.days.some(d=>!Array.isArray(d.games)))throw Error('Invalid schedule');
 schedule=j;break;
 }catch(e){}
}
draw();
const openedDate=dateNow();
setInterval(()=>{if(dateNow()!==openedDate)el('fixtureStatus').textContent='A new Montreal game day has begun. Reload to load today’s matchups.';},60000);
})();
// Load the independent descriptive ranking panel.
{const rankingScript=document.createElement('script');rankingScript.src='rankings.js';document.body.append(rankingScript);}
