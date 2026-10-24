import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {createServer} from 'node:http';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'firsttwenty-schedule-'));
fs.mkdirSync(path.join(dir,'scripts'));fs.mkdirSync(path.join(dir,'data'));
fs.copyFileSync('scripts/schedule.mjs',path.join(dir,'scripts/schedule.mjs'));
const make=(id,away,home,scheduleState='OK',gameType=2)=>({id,gameType,gameState:'FUT',gameScheduleState:scheduleState,startTimeUTC:'2026-10-24T23:00:00Z',awayTeam:{abbrev:away},homeTeam:{abbrev:home}});
const server=createServer((req,res)=>{
 res.setHeader('Content-Type','application/json');
 const games=req.url.endsWith('2026-10-24')?[make(2026021001,'BOS','MTL'),make(2026021002,'CAR','NYR','POST'),make(2026010001,'ANA','LAK','OK',1)]:[];
 res.end(JSON.stringify({games}));
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const port=server.address().port;
let output='';
try{
 const child=spawn(process.execPath,['scripts/schedule.mjs'],{cwd:dir,env:{...process.env,FIRST_TWENTY_API:'http://127.0.0.1:'+port+'/v1',FIRST_TWENTY_SCHEDULE_DATE:'2026-10-24',FIRST_TWENTY_SCHEDULE_DAYS:'2'}});
 for await(const x of child.stdout)output+=x;
 for await(const x of child.stderr)output+=x;
 const exit=await new Promise(r=>child.once('exit',r));
 assert.equal(exit,0,output);
 const j=JSON.parse(fs.readFileSync(path.join(dir,'data/upcoming.json'),'utf8'));
 assert.equal(j.date,'2026-10-24');assert.equal(j.days.length,2);
 assert.equal(j.days[0].games.length,1);assert.equal(j.days[0].games[0].away,'BOS');
 assert.equal(j.days[0].excluded.length,1);assert.equal(j.days[1].games.length,0);
 console.log('PASS: schedule fixture includes regular-season matchups, excludes postponed/preseason games and accepts no-game dates.');
}finally{await new Promise(r=>server.close(r));fs.rmSync(dir,{recursive:true,force:true});}
