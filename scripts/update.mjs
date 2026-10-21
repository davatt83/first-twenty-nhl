/** First Twenty official NHL first-period sync. Node.js 20+, zero dependencies.
 *  Finds each finished NHL regular-season game from daily NHL score endpoints,
 *  verifies actual period-one scoring using Gamecenter, and refuses silent gaps.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dbfile=path.join(root,'data/games-20262027.json');
const reportFile=path.join(root,'data/coverage.json');
const dateStart=process.env.FIRST_TWENTY_START||'2026-09-29';
const NHL=process.env.FIRST_TWENTY_API||'https://api-web.nhle.com/v1';
const ESPN=process.env.FIRST_TWENTY_ESPN_API||'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl';
const espnDaily=new Map();
const REGULAR=/^202602\d{4}$/;
const ABBRS=new Set(['ANA','BOS','BUF','CAR','CBJ','CGY','CHI','COL','DAL','DET','EDM','FLA','LAK','MIN','MTL','NJD','NSH','NYI','NYR','OTT','PHI','PIT','SEA','SJS','STL','TBL','TOR','UTA','VAN','VGK','WPG','WSH']);
const code=v=>typeof v==='string'?v:(v?.default||'');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const torontoDate=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Toronto',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
function previousDay(s){const d=new Date(s+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-1);return d.toISOString().slice(0,10)}
function datesBetween(a,b){let result=[];for(let t=new Date(a+'T12:00:00Z');t<=new Date(b+'T12:00:00Z');t.setUTCDate(t.getUTCDate()+1))result.push(t.toISOString().slice(0,10));return result}
async function getJSON(url){let error;for(let attempt=0;attempt<3;attempt++){const control=new AbortController();const timer=setTimeout(()=>control.abort(),18000);try{const r=await fetch(url,{signal:control.signal,headers:{accept:'application/json','user-agent':'FirstTwentyDataValidation/1.0'}});if(!r.ok)throw Error(`HTTP ${r.status}`);const data=await r.json();if(!data||typeof data!=='object')throw Error('Empty JSON');return data;}catch(e){error=e;if(attempt<2)await sleep(600*(attempt+1))}finally{clearTimeout(timer)}}throw Error(`${url}: ${error?.message||error}`)}
const firstPeriod=p=>Number(p?.periodDescriptor?.number??p?.period?.number??p?.periodNumber??p?.period??0);
const finished=g=>['OFF','FINAL','OVER'].includes(g.gameState)&&Number(g.gameType)===2&&REGULAR.test(String(g.id));
function identify(game){const home=code(game.homeTeam?.abbrev),away=code(game.awayTeam?.abbrev);if(!ABBRS.has(home)||!ABBRS.has(away)||home===away)throw Error('Bad teams '+game.id);return{home,away}}
function parseDailyGoals(game,date){if(!Array.isArray(game.goals))return null;const {home,away}=identify(game);const total=Number(game.homeTeam.score)+Number(game.awayTeam.score);
 // A shootout adds one tiebreaker to the final score but NOT to goal events.
 // Require the full scoring log; partial score-endpoint goals are never trusted.
 const shotout=game.gameOutcome?.lastPeriodType==='SO';
 const expected=total-(shotout?1:0);
 if(game.goals.length!==expected)return null;
 let hp1=0,ap1=0;for(const goal of game.goals){const period=firstPeriod(goal);if(!period)return null;if(period!==1)continue;const team=code(goal.teamAbbrev||goal.team||goal.scoringTeam);if(team===home)hp1++;else if(team===away)ap1++;else return null;}return{hp1,ap1};}
function parseLanding(landing,home,away){const blocks=landing.summary?.scoring||landing.scoring;if(!Array.isArray(blocks))return null;
 const first=blocks.find(s=>firstPeriod(s)===1);if(!first||!Array.isArray(first.goals))return null;
 let hp1=0,ap1=0;for(const goal of first.goals){const team=code(goal.teamAbbrev||goal.team);if(team===home)hp1++;else if(team===away)ap1++;else return null;}return{hp1,ap1};}
function parsePlayByPlay(payload,home,away){if(!Array.isArray(payload.plays)||payload.plays.length<20)return null;
 let hp1=0,ap1=0;const hId=Number(payload.homeTeam?.id),aId=Number(payload.awayTeam?.id);
 for(const ev of payload.plays){if(ev.typeDescKey!=='goal'||firstPeriod(ev)!==1)continue;const owner=Number(ev.details?.eventOwnerTeamId);const team=code(ev.details?.teamAbbrev||ev.teamAbbrev);
 if(owner===hId||team===home)hp1++;else if(owner===aId||team===away)ap1++;else return null;}
 return{hp1,ap1};}
// Secondary period-score fallback, used only when official scoring endpoints cannot
// verify a completed game. NHL daily schedule remains the coverage authority.
async function espnPeriodScore(date,home,away){
 let request=espnDaily.get(date);
 if(!request){request=getJSON(`${ESPN}/scoreboard?dates=${date.replaceAll('-','')}&limit=100`);espnDaily.set(date,request)}
 const payload=await request;
 const matches=(payload.events||[]).filter(e=>{
   const teams=e.competitions?.[0]?.competitors||[];
   return teams.some(t=>t.homeAway==='home'&&code(t.team?.abbreviation)===home)&&teams.some(t=>t.homeAway==='away'&&code(t.team?.abbreviation)===away);
 });
 if(matches.length!==1)return null;
 const event=matches[0];
 if(event.status?.type?.completed!==true)return null;
 if(event.season?.type!=null&&Number(event.season.type)!==2)return null;
 const teams=event.competitions[0].competitors;
 function p1(side){const t=teams.find(t=>t.homeAway===side);const score=t?.linescores?.[0]?.value;return score===null||score===undefined?NaN:Number(score)}
 const hp1=p1('home'),ap1=p1('away');
 if(!Number.isInteger(hp1)||!Number.isInteger(ap1)||hp1<0||ap1<0)return null;
 return {hp1,ap1};
}
const key=(date,away,home)=>`${date}_${away}_${home}`;
function validRow(g){return g&&/^2026-\d\d-\d\d$/.test(g.date)&&ABBRS.has(g.home)&&ABBRS.has(g.away)&&g.home!==g.away&&Number.isInteger(g.hp1)&&Number.isInteger(g.ap1)&&g.hp1>=0&&g.ap1>=0&&g.hp1<21&&g.ap1<21&&g.id===key(g.date,g.away,g.home)}
async function verifiedGame(g,date){const {home,away}=identify(g);const id=String(g.id);const scores=[];
 const score=parseDailyGoals(g,date);if(score)scores.push(['score',score]);
 try{const landing=await getJSON(`${NHL}/gamecenter/${id}/landing`);const result=parseLanding(landing,home,away);if(result)scores.push(['gamecenter',result]);}catch(e){if(!score)console.log(`  ${id} landing retry via play-by-play: ${e.message}`)}
 if(!scores.length){try{const pbp=await getJSON(`${NHL}/gamecenter/${id}/play-by-play`);const got=parsePlayByPlay(pbp,home,away);if(got)scores.push(['play-by-play',got]);}catch(e){console.log('  '+id+' official play-by-play unavailable: '+e.message)}}
 if(!scores.length){try{const x=await espnPeriodScore(date,home,away);if(x)scores.push(['espn-period-boxscore',x]);}catch(e){console.log('  '+id+' secondary boxscore unavailable: '+e.message)}}
 if(!scores.length)throw Error('Period-one scoring not verifiable for '+id);
 const match=scores[0][1];for(const [source,x] of scores.slice(1))if(x.hp1!==match.hp1||x.ap1!==match.ap1)throw Error(`Conflicting NHL first-period results ${id}: ${JSON.stringify(scores)}`);
 const row={id:key(date,away,home),gameId:id,date,away,home,hp1:match.hp1,ap1:match.ap1,source:scores[0][0]==='espn-period-boxscore'?'espn-period-boxscore':'nhl-official',sourceMethods:scores.map(([s])=>s)};
 if(!validRow(row))throw Error('Invalid parsed game '+id);
 const finalTotal=Number(g.homeTeam.score)+Number(g.awayTeam.score);if(row.hp1+row.ap1>finalTotal)throw Error('First-period score exceeds final score '+id);
 return row;
}
const original=JSON.parse(fs.readFileSync(dbfile,'utf8'));
const originalRows=(original.games||[]);
if(originalRows.some(g=>!validRow(g)))throw Error('Previously embedded database contains invalid rows; refusing update');
const existing=new Map(originalRows.map(g=>[g.id,g]));
if(existing.size!==originalRows.length)throw Error('Previously embedded database contains duplicate game IDs');
const cutoff=process.env.FIRST_TWENTY_THROUGH||previousDay(torontoDate());
if(cutoff<dateStart){console.log('Season not started');process.exit(0)}
const days=datesBetween(dateStart,cutoff);
// Recheck the three most recent game dates, including corrections. Trust only
// previously NHL-verified older records while still checking daily schedules.
const recheckFrom=previousDay(previousDay(cutoff));
const errors=[],seen=new Set(),checks=[];
let finalCount=0,updated=0;
async function checkDate(date){const payload=await getJSON(`${NHL}/score/${date}`);if(!Array.isArray(payload.games))throw Error('No games list '+date);
 const scheduled=payload.games.filter(g=>REGULAR.test(String(g.id)));
 const pending=scheduled.filter(g=>!finished(g)&&!['CNCL','POST'].includes(g.gameScheduleState));
 const finals=scheduled.filter(finished);const rows=[];
 for(const g of finals){
   const {home,away}=identify(g);
   const old=existing.get(key(date,away,home));
   if(old&&(!old.gameId||old.gameId===String(g.id))&&date<recheckFrom){
     const finalTotal=Number(g.homeTeam.score)+Number(g.awayTeam.score);
     if(old.hp1+old.ap1>finalTotal)throw Error('Cached score now exceeds final score '+g.id);
     rows.push(old);
   }else rows.push(await verifiedGame(g,date));
 }
 return{date,scheduled:scheduled.length,finals,rows,pending:pending.length};}
// Concurrency limited to avoid burdening NHL servers and receiving throttling.
const queue=[...days];const count=Number(process.env.FIRST_TWENTY_WORKERS||3);
await Promise.all(Array.from({length:count},async()=>{while(queue.length){const date=queue.shift();try{const result=await checkDate(date);checks.push({date,scheduled:result.scheduled,final:result.finals.length,verified:result.rows.length,pending:result.pending});finalCount+=result.finals.length;
 for(const row of result.rows){const old=existing.get(row.id);if(old&&(old.hp1!==row.hp1||old.ap1!==row.ap1))throw Error(`Record conflict ${row.id}: ${old.ap1}-${old.hp1} vs ${row.ap1}-${row.hp1}`);if(!old)updated++;existing.set(row.id,row);seen.add(row.id)}
 if(result.pending)errors.push(`${date}: ${result.pending} scheduled game(s) not final`);console.log(`${date}: ${result.rows.length}/${result.finals.length} final games verified`);
 }catch(e){errors.push(`${date}: ${e.message}`);console.error(`${date}: ERROR ${e.message}`)}}}));
const vanished=originalRows.filter(g=>g.date<=cutoff&&!seen.has(g.id));
if(vanished.length)errors.push('Previously accepted game(s) missing from NHL schedules: '+vanished.map(g=>g.id).slice(0,12).join(', '));
if(seen.size!==finalCount)errors.push(`Game coverage mismatch: ${seen.size} accepted vs ${finalCount} completed`);
const games=[...existing.values()].filter(g=>g.date<=cutoff).sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id));
const coverage=checks.sort((a,b)=>a.date.localeCompare(b.date));
const daysCovered=new Set(coverage.filter(d=>!d.pending&&d.verified===d.final).map(d=>d.date));
const fullyCovered=days.every(d=>daysCovered.has(d));
const latest=games.reduce((v,g)=>g.date>v?g.date:v,'');
const meta={checkedAt:new Date().toISOString(),checkedThrough:cutoff,lastGameDate:latest,verifiedGames:games.length,officialFinalCount:finalCount,datesChecked:coverage.length,daysExpected:days.length,daysComplete:daysCovered.size,newOrVerifiedRecords:updated,complete:fullyCovered&&!errors.length,errors};
// Strict mode: never publish a new 'complete' model if any day or game could not be checked.
// Keep prior published files intact on a failed refresh.
if(!meta.complete){console.error('INCOMPLETE. Previous model preserved. '+JSON.stringify(meta));process.exitCode=1;}
else{
 fs.writeFileSync(dbfile,JSON.stringify({season:'20262027',games,meta},null,2)+'\n');
 fs.writeFileSync(reportFile,JSON.stringify({meta,dates:coverage},null,2)+'\n');
 console.log(`SUCCESS ${games.length} games verified through ${cutoff}, ${updated} imported/confirmed.`);
}