/** Fetch the official NHL regular-season scoreboard for today and the next 7 days.
 * Each day is grouped by America/Toronto calendar date for the dashboard.
 * Invalid/inaccessible source data aborts before replacing the last verified schedule.
 */
import fs from 'node:fs';
const NHL=process.env.FIRST_TWENTY_API||'https://api-web.nhle.com/v1';
const OUTPUT='data/upcoming.json';
const TEAM_CODES=new Set(['ANA','BOS','BUF','CAR','CBJ','CGY','CHI','COL','DAL','DET','EDM','FLA','LAK','MIN','MTL','NJD','NSH','NYI','NYR','OTT','PHI','PIT','SEA','SJS','STL','TBL','TOR','UTA','VAN','VGK','WPG','WSH']);
const abbrev=x=>typeof x==='string'?x:x?.default||'';
const currentTorontoDate=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Toronto',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const nextDate=(s,i)=>{const d=new Date(s+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+i);return d.toISOString().slice(0,10)};
const today=process.env.FIRST_TWENTY_SCHEDULE_DATE||currentTorontoDate();
if(!/^20\d\d-\d\d-\d\d$/.test(today)||!Number.isFinite(Date.parse(today+'T12:00:00Z')))throw Error('Invalid Toronto schedule date');
const dayCount=Number(process.env.FIRST_TWENTY_SCHEDULE_DAYS||8);
if(!Number.isInteger(dayCount)||dayCount<1||dayCount>15)throw Error('Invalid schedule horizon');
async function getJSON(url){
 let err;
 for(let attempt=0;attempt<3;attempt++){
  const ctl=new AbortController(),timeout=setTimeout(()=>ctl.abort(),15000);
  try{
   const response=await fetch(url,{headers:{accept:'application/json','user-agent':'FirstTwentySchedule/1.0'},signal:ctl.signal});
   if(!response.ok)throw Error('HTTP '+response.status);
   const json=await response.json();
   if(!Array.isArray(json?.games))throw Error('Schedule is missing games array');
   return json;
  }catch(e){err=e;if(attempt<2)await new Promise(r=>setTimeout(r,800*(attempt+1)))}finally{clearTimeout(timeout)}
 }
 throw Error(url+': '+err?.message);
}
function parseDate(date,payload){
 const used=new Set(),games=[],excluded=[];
 for(const g of payload.games){
  if(Number(g.gameType)!==2||!/^202602\d{4}$/.test(String(g.id)))continue;
  const away=abbrev(g.awayTeam?.abbrev),home=abbrev(g.homeTeam?.abbrev);
  if(!TEAM_CODES.has(away)||!TEAM_CODES.has(home)||away===home)throw Error(date+': unrecognized matchup '+g.id);
  const id=String(g.id);
  if(used.has(id))throw Error(date+': duplicate game '+id);
  used.add(id);
  const status=String(g.gameState||'FUT'),scheduleState=String(g.gameScheduleState||'OK');
  if(['POST','CNCL'].includes(scheduleState)){excluded.push({id,away,home,status,scheduleState});continue;}
  const startUTC=g.startTimeUTC||null;
  if(startUTC&&!Number.isFinite(Date.parse(startUTC)))throw Error(date+': invalid start time '+id);
  games.push({id,date,away,home,startUTC,status,scheduleState});
 }
 games.sort((a,b)=>(a.startUTC||'').localeCompare(b.startUTC||'')||a.id.localeCompare(b.id));
 return {date,games,excluded};
}
const days=[];
for(let i=0;i<dayCount;i++){
 const date=nextDate(today,i);
 const payload=await getJSON(NHL+'/score/'+date);
 const d=parseDate(date,payload);
 days.push(d);
 console.log(date+': '+d.games.length+' regular-season matchups, '+d.excluded.length+' postponed/cancelled');
}
const output={source:'NHL official daily score endpoint',timezone:'America/Toronto',fetchedAt:new Date().toISOString(),date:today,through:nextDate(today,dayCount-1),days};
fs.writeFileSync(OUTPUT,JSON.stringify(output,null,2)+'\n');
console.log('Verified schedule: '+days.reduce((n,d)=>n+d.games.length,0)+' matchups across '+dayCount+' days');
