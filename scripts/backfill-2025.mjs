/** Incremental verified 2025–26 first-period backfill.
 *  Does not allow incomplete game logs to become model priors or 'exact hit rates'.
 *  Saves only whole, verified NHL game days; validates 1312 games and team splits.
 */
import fs from 'node:fs';
const DB='data/games-20252026.json',template='model.template.html';
const MANIFEST='data/schedule-20252026.json';
const START='2025-10-07', END='2026-04-16', EXPECTED=1312;
const API=process.env.FIRST_TWENTY_API||'https://api-web.nhle.com/v1';
const BATCH=Math.max(1,Math.min(167,Number(process.env.FIRST_TWENTY_HISTORY_BATCH||60)));
const FIRST=process.env.FIRST_TWENTY_HISTORY_START||START,LAST=process.env.FIRST_TWENTY_HISTORY_END||END;
const validTeams=new Set('ANA BOS BUF CAR CBJ CGY CHI COL DAL DET EDM FLA LAK MIN MTL NJD NSH NYI NYR OTT PHI PIT SEA SJS STL TBL TOR UTA VAN VGK WPG WSH'.split(' '));
const code=x=>typeof x==='string'?x:(x?.default||'');
const period=p=>Number(p?.periodDescriptor?.number??p?.period?.number??p?.periodNumber??p?.period??0);
const wait=t=>new Promise(r=>setTimeout(r,t));
async function json(path){let last;for(let t=0;t<3;t++){const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),18000);try{const r=await fetch(API+path,{headers:{accept:'application/json','user-agent':'FirstTwentyHistoryAudit/1.0'},signal:ctl.signal});if(!r.ok)throw Error(`HTTP ${r.status}`);return await r.json();}catch(e){last=e;if(t<2)await wait(500*(t+1));}finally{clearTimeout(timer);}}throw Error(path+': '+last?.message);}
function dateRange(a,b){const dates=[];for(let t=new Date(a+'T12:00:00Z');t<=new Date(b+'T12:00:00Z');t.setUTCDate(t.getUTCDate()+1))dates.push(t.toISOString().slice(0,10));return dates;}
const id=(d,a,h)=>`${d}_${a}_${h}`;
function valid(g){return g&&g.id===id(g.date,g.away,g.home)&&g.date>=START&&g.date<=END&&validTeams.has(g.away)&&validTeams.has(g.home)&&g.away!==g.home&&Number.isInteger(g.ap1)&&Number.isInteger(g.hp1)&&g.ap1>=0&&g.hp1>=0&&g.ap1<20&&g.hp1<20;}
function parseScores(block,home,away){if(!Array.isArray(block))return null;let ap1=0,hp1=0;for(const g of block){const t=code(g.teamAbbrev||g.team||g.scoringTeam);if(t===home)hp1++;else if(t===away)ap1++;else return null;}return{ap1,hp1};}
function fromDaily(g,home,away){if(!Array.isArray(g.goals))return null;const score=Number(g.homeTeam?.score)+Number(g.awayTeam?.score);if(!Number.isFinite(score))return null;const sho=g.gameOutcome?.lastPeriodType==='SO'?1:0;if(g.goals.length!==score-sho)return null;const goals=[];for(const goal of g.goals){const p=period(goal);if(!p)return null;if(p===1)goals.push(goal);}return parseScores(goals,home,away);}
function fromLanding(j,home,away){const periods=j.summary?.scoring||j.scoring;if(!Array.isArray(periods))return null;const one=periods.find(x=>period(x)===1);return one?parseScores(one.goals,home,away):null;}
function fromPbp(j,home,away){if(!Array.isArray(j.plays)||j.plays.length<20)return null;const events=j.plays.filter(x=>x.typeDescKey==='goal'&&period(x)===1);let hp1=0,ap1=0;const h=Number(j.homeTeam?.id),a=Number(j.awayTeam?.id);for(const x of events){const id=Number(x.details?.eventOwnerTeamId),t=code(x.details?.teamAbbrev||x.teamAbbrev);if(id===h||t===home)hp1++;else if(id===a||t===away)ap1++;else return null;}return{hp1,ap1};}
async function verify(g,date,spotCheck){const gameId=String(g.id),home=code(g.homeTeam?.abbrev),away=code(g.awayTeam?.abbrev);if(!validTeams.has(home)||!validTeams.has(away)||home===away)throw Error('Invalid teams '+gameId);
 const sources=[];const scores=fromDaily(g,home,away);if(scores)sources.push({source:'score',...scores});
 // Every score-feed scoring log must reconcile with the full final result.
 // Cross-check at least one game per game day against the independent official landing feed;
 // missing/incomplete score logs always require the landing or play-by-play endpoint.
 if(!scores||spotCheck)try{const landing=await json(`/gamecenter/${gameId}/landing`);const x=fromLanding(landing,home,away);if(x)sources.push({source:'landing',...x});}catch(e){if(!scores)console.log('Landing unavailable for',gameId,e.message);}
 if(!sources.length){const pbp=await json(`/gamecenter/${gameId}/play-by-play`);const x=fromPbp(pbp,home,away);if(x)sources.push({source:'play-by-play',...x});}
 if(!sources.length)throw Error(`No verified first period: ${gameId}`);
 for(const row of sources.slice(1))if(row.hp1!==sources[0].hp1||row.ap1!==sources[0].ap1)throw Error('Disagreement '+gameId);
 const row={id:id(date,away,home),gameId,date,home,away,hp1:sources[0].hp1,ap1:sources[0].ap1,source:'nhl-official',sourceMethods:sources.map(x=>x.source)};
 if(!valid(row))throw Error('Invalid game '+gameId);
 if(row.hp1+row.ap1>Number(g.homeTeam.score)+Number(g.awayTeam.score))throw Error('Exceeds final '+gameId);
 return row;}
const manifest=JSON.parse(fs.readFileSync(MANIFEST,'utf8'));
const planned=(manifest.games||[]).map(([gameId,date,away,home])=>({gameId,date,away,home}));
if(planned.length!==EXPECTED||new Set(planned.map(g=>g.gameId)).size!==EXPECTED)throw Error('Historical 1312-game manifest missing or duplicate');
const allDates=[...new Set(planned.map(g=>g.date))].sort();
const scheduleGamesByDay=new Map(allDates.map(d=>[d,planned.filter(g=>g.date===d)]));
if(allDates[0]!==START||allDates.at(-1)!==END)throw Error('Schedule dates do not span full 2025-26 regular season');
const venueCounts=new Map();
for(const g of planned){
 if(!/^202502\d{4}$/.test(g.gameId)||!validTeams.has(g.home)||!validTeams.has(g.away)||g.home===g.away)throw Error('Bad manifest game '+g.gameId);
 for(const [t,v] of [[g.home,'home'],[g.away,'away']])venueCounts.set(t+'_'+v,(venueCounts.get(t+'_'+v)||0)+1);
}
if(venueCounts.size!==64||[...venueCounts.values()].some(v=>v!==41))throw Error('Manifest venue counts not 41 per team');
const previous=fs.existsSync(DB)?JSON.parse(fs.readFileSync(DB,'utf8')):{season:'20252026',games:[],meta:{daysComplete:[],complete:false}};
if((previous.games||[]).some(g=>!valid(g)))throw Error('Invalid historical row in cache');
const rows=new Map((previous.games||[]).map(g=>[g.id,g]));if(rows.size!==(previous.games||[]).length)throw Error('Duplicate historical records');
const done=new Set(previous.meta?.daysComplete||[]),errors=[];
if([...done].some(d=>!scheduleGamesByDay.has(d)))throw Error('Cached completed date not in archived fixture list');
const dateList=allDates.filter(d=>d>=FIRST&&d<=LAST&&!done.has(d)).slice(0,BATCH);
const pending=[...dateList],confirmed=[];
await Promise.all(Array.from({length:3},async()=>{while(pending.length){const date=pending.shift();try{
  const schedule=await json('/score/'+date);if(!Array.isArray(schedule.games))throw Error('No game list');
  const regular=schedule.games.filter(g=>/^202502\d{4}$/.test(String(g.id)));
  const expected=scheduleGamesByDay.get(date)||[];
  if(regular.length!==expected.length)throw Error('Schedule coverage mismatch '+regular.length+' versus '+expected.length);
  const expectedById=new Map(expected.map(g=>[g.gameId,g]));
  for(const g of regular){const m=expectedById.get(String(g.id));
   if(!m||code(g.homeTeam?.abbrev)!==m.home||code(g.awayTeam?.abbrev)!==m.away)throw Error('Schedule game ID/team discrepancy '+g.id);
  }
  if(regular.some(g=>!['OFF','FINAL','OVER'].includes(g.gameState)))throw Error('Unfinished regular season game');
  const collected=[];for(const [i,g] of regular.entries()){const row=await verify(g,date,i===0);const old=rows.get(row.id);if(old&&(old.hp1!==row.hp1||old.ap1!==row.ap1||old.gameId!==row.gameId))throw Error('Previously verified game changed: '+row.id);collected.push(row);}
  if(collected.length!==new Set(collected.map(x=>x.id)).size)throw Error('Duplicate games in daily response');
  confirmed.push({date,rows:collected});console.log(date,collected.length,'NHL games');
 }catch(e){errors.push(date+': '+e.message);console.error('SKIP',date,e.message);}}}));
for(const c of confirmed){for(const g of c.rows)rows.set(g.id,g);done.add(c.date)}
const fullDates=allDates.every(d=>done.has(d));
const finishedRows=[...rows.values()].sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id));
let complete=fullDates&&finishedRows.length===EXPECTED;const mismatches=[];
if(complete){const teams=JSON.parse(fs.readFileSync(template,'utf8').match(/const TEAMS=(\{[^\n]+\});/)[1]);for(const [abbr,t] of Object.entries(teams)){for(const venue of ['home','away']){const games=finishedRows.filter(g=>g[venue]===abbr);const gf=games.reduce((s,g)=>s+(venue==='home'?g.hp1:g.ap1),0),ga=games.reduce((s,g)=>s+(venue==='home'?g.ap1:g.hp1),0);const refGf=venue==='home'?t.hgf:t.agf,refGa=venue==='home'?t.hga:t.aga;if(games.length!==41||gf!==refGf||ga!==refGa)mismatches.push(`${abbr} ${venue}: actual ${games.length}/${gf}/${ga}, expected 41/${refGf}/${refGa}`);}}
 if(mismatches.length)complete=false;}
const next={season:'20252026',games:finishedRows,meta:{complete,daysComplete:[...done].sort(),totalDays:allDates.length,verifiedGames:finishedRows.length,expectedGames:EXPECTED,lastCheckedAt:new Date().toISOString(),issues:[...errors,...mismatches]}};
if(confirmed.length||!fs.existsSync(DB))fs.writeFileSync(DB,JSON.stringify(next,null,2)+'\n');
console.log('2025–26 status:',JSON.stringify({verified:finishedRows.length,days:done.size,totalDays:allDates.length,complete,errors:errors.slice(0,4),mismatches:mismatches.slice(0,4)}));
if(mismatches.length)process.exitCode=1;