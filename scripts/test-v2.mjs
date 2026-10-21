import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const s=fs.readFileSync('index.html','utf8');
// Published HTML must contain the current default pricing engine and the experimental comparison.\nif(fs.readFileSync('scripts/engine.js','utf8').includes('const p=baselineP')){assert(s.includes('const p=baselineP'),'Published HTML still contains an older pricing engine');assert(s.includes('Hybrid experimental:'),'Published HTML missing experimental comparison labels');}
const teams=JSON.parse(s.match(/const TEAMS=(\{[^\n]+\});/)[1]);
const rows=JSON.parse(fs.readFileSync('data/games-20262027.json','utf8')).games;
const context={};vm.runInNewContext(fs.readFileSync('scripts/engine.js','utf8')+'\nthis.FT=FirstTwentyEngine;',context);
const eng=context.FT;
const test=eng.predict({home:'MTL',away:'NSH',mode:'combined',teams,current:rows,history:[]});
assert(test.p>0&&test.p<1);assert(test.baselineP>0&&test.baselineP<1);
assert(Math.abs(test.hybridP-(.7*test.baselineP+.3*test.aggressiveP))<1e-10,'Ensemble formula changed unexpectedly');
assert(Math.abs(test.p-test.baselineP)<1e-12,'Primary probability must be the benchmark until stronger holdout evidence exists');
assert(test.hCurrentN>0&&test.aCurrentN>0);
for(const mode of ['last','current','combined']){
 const z=eng.predict({home:'DET',away:'MTL',mode,teams,current:rows});assert(z.p>0&&z.p<1,`Invalid ${mode} result`);
 if(mode==='last')assert(Math.abs(z.p-z.baselineP)<.05,'Previous-only should remain close to original baseline');
}
const cv=eng.walkForward({teams,current:rows});assert.equal(cv.count,rows.length);
assert(cv.metrics.hybrid.brier>=0&&cv.metrics.hybrid.brier<=1);
assert(cv.outcomes.every(x=>x.baseline>=0&&x.hybrid<=1));
assert.equal(cv.distribution.observed.reduce((a,b)=>a+b,0),rows.length);
assert(Math.abs(cv.distribution.expected.reduce((a,b)=>a+b,0)-rows.length)<1e-8);
// Future and same-day leakage are prohibited: another October 8 match must not affect Oct 8 predictions.
const example=rows.find(g=>g.date==='2026-10-08');assert(example);
const before=eng.walkForward({teams,current:rows}).outcomes.find(g=>g.date===example.date&&g.home===example.home&&g.away===example.away);
const swapped=rows.map(g=>g.date===example.date?{...g,hp1:0,ap1:0}:g);
const after=eng.walkForward({teams,current:swapped}).outcomes.find(g=>g.date===example.date&&g.home===example.home&&g.away===example.away);
assert(Math.abs(before.hybrid-after.hybrid)<1e-12,'Future or same-day scoring leaked into a prediction');
assert(s.includes('data-tab="validate"')&&s.includes('id="modelComparison"'));
const prev=JSON.parse(fs.readFileSync('data/games-20252026.json','utf8'));
if(prev.meta?.complete){assert.equal(prev.games.length,1312);assert(s.includes('HISTORY_SEED=[{'));}
else assert(s.includes('HISTORY_SEED=[];'),'Previous-season history must not be invented');
console.log('PASS: prediction variants, sample isolation, '+rows.length+' chronological forecasts, no same-day leakage.');
console.log('Brier: original',cv.metrics.baseline.brier.toFixed(4),'balanced',cv.metrics.hybrid.brier.toFixed(4));