import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import assert from 'node:assert/strict';import http from 'node:http';import{spawnSync}from'node:child_process';
const base=fs.mkdtempSync(path.join(os.tmpdir(),'firsttwenty-history-'));
fs.mkdirSync(path.join(base,'scripts'));fs.mkdirSync(path.join(base,'data'));
fs.copyFileSync('scripts/backfill-2025.mjs',path.join(base,'scripts/backfill-2025.mjs'));
fs.copyFileSync('model.template.html',path.join(base,'model.template.html'));
fs.copyFileSync('data/schedule-20252026.json',path.join(base,'data/schedule-20252026.json'));
const game=(i,h,a,hs,as)=>({id:2025020000+i,gameState:'OFF',gameType:2,homeTeam:{abbrev:h,score:hs},awayTeam:{abbrev:a,score:as}});
const games=[game(1,'FLA','CHI',1,0),game(2,'NYR','PIT',1,1),game(3,'LAK','COL',1,0)];
const mock=http.createServer((req,res)=>{res.setHeader('content-type','application/json');let out;
if(req.url==='/v1/score/2025-10-07')out={games};
else if(req.url?.includes('gamecenter')){const isOne=req.url.includes('2025020001');out={summary:{scoring:[{periodDescriptor:{number:1},goals:req.url.includes('2025020002')?[{teamAbbrev:{default:'PIT'}}]:[]},{periodDescriptor:{number:2},goals:[]}]}};}
else {res.statusCode=404;out={error:'no fixture'}}res.end(JSON.stringify(out));});
await new Promise(r=>mock.listen(0,'127.0.0.1',r));
const port=mock.address().port;
// Do the test asynchronously because the mock HTTP server runs in the parent process.
const {spawn}=await import('node:child_process');
let output='';
const child=spawn(process.execPath,['scripts/backfill-2025.mjs'],{cwd:base,env:{...process.env,FIRST_TWENTY_API:`http://127.0.0.1:${port}/v1`,FIRST_TWENTY_HISTORY_START:'2025-10-07',FIRST_TWENTY_HISTORY_END:'2025-10-07',FIRST_TWENTY_HISTORY_BATCH:'1'}});
for await(const chunk of child.stdout)output+=chunk;
for await(const chunk of child.stderr)output+=chunk;
const exit=await new Promise(resolve=>child.once('exit',resolve));await new Promise(resolve=>mock.close(resolve));
if(exit!==0)throw Error('Fixture failed: '+output);
const db=JSON.parse(fs.readFileSync(path.join(base,'data/games-20252026.json')));assert.equal(db.games.length,3);assert.equal(db.meta.complete,false);
assert.deepEqual(db.meta.daysComplete,['2025-10-07']);const zero=db.games.find(x=>x.gameId==='2025020001');assert.equal(zero.ap1+zero.hp1,0);assert(db.games.some(x=>x.gameId==='2025020002'&&x.ap1===1));
console.log('PASS: historical backfill handles valid 0–0, period-one goals, incremental incomplete coverage, and explicit sample metadata.');