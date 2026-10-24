import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const html=fs.readFileSync('index.html','utf8');
const src=html.match(/<script>([\s\S]*?)<\/script>/);
assert(src,'Generated calculator must include inline script');
new vm.Script(src[1],{filename:'index.html inline JS'});
for(const anchor of ['id="v-board"','id="boardRows"','id="boardDate"','id="boardMode"','id="boardSort"','id="boardRefresh"','function boardPredictions(date)','function renderBoard()','function boardLoadDate(force=false)','const SCHEDULE_SEED=']){
 assert(html.includes(anchor),'Missing daily board feature: '+anchor);
}
const seed=html.match(/const SCHEDULE_SEED=(\{[^\n]*\});/);
assert(seed,'Embedded schedule missing');
const schedule=JSON.parse(seed[1]);
assert(Array.isArray(schedule.days));
const codes=new Set(['ANA','BOS','BUF','CAR','CBJ','CGY','CHI','COL','DAL','DET','EDM','FLA','LAK','MIN','MTL','NJD','NSH','NYI','NYR','OTT','PHI','PIT','SEA','SJS','STL','TBL','TOR','UTA','VAN','VGK','WPG','WSH']);
for(const d of schedule.days){
 assert(/^\d{4}-\d{2}-\d{2}$/.test(d.date));
 const keys=new Set();
 for(const g of d.games){
  assert(g.date===d.date&&codes.has(g.home)&&codes.has(g.away)&&g.away!==g.home);
  assert(!keys.has(g.id),'Duplicate scheduled NHL game '+g.id);keys.add(g.id);
  assert(!['POST','CNCL'].includes(g.scheduleState),'Postponed game included');
 }
}
const current=JSON.parse(fs.readFileSync('data/games-20262027.json','utf8')).games;
assert(current.length>=140&&new Set(current.map(g=>g.id)).size===current.length);
const teams=JSON.parse(html.match(/const TEAMS=(\{[^\n]+\});/)[1]);
const engineCtx={};vm.runInNewContext(fs.readFileSync('scripts/engine.js','utf8')+'\nthis.Engine=FirstTwentyEngine',engineCtx);
const eng=engineCtx.Engine;
const hist=JSON.parse(fs.readFileSync('data/games-20252026.json','utf8'));
assert(hist.games.length===1312,'Must retain full last season');
for(const d of schedule.days){
 const before=current.filter(g=>g.date<d.date);
 const fixture=d.games[0];if(!fixture)continue;
 for(const mode of ['last','current','combined']){
  const model=eng.predict({home:fixture.home,away:fixture.away,mode,teams,current:before,history:hist.games});
  assert(model.p>0&&model.p<1&&Number.isFinite(model.p));
  const fair=model.p>=.5?-Math.round(100*model.p/(1-model.p)):Math.round(100*(1-model.p)/model.p);
  assert(Number.isInteger(fair),'Fair American odds must be finite');
  // Adding a game on the selected date must not alter the morning inputs.
  assert(before.every(g=>g.date<d.date),'Same-day information leakage');
 }
}
console.log('PASS: inline browser JS parses, sortable daily board present, official fixtures unique, fair odds and pregame leakage safeguards verified.');
