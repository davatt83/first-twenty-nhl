const fs=require('fs'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync('goalie-pull/index.html','utf8');
const d=JSON.parse(html.match(/<script[^>]*id="model-data"[^>]*>([\s\S]*?)<\/script>/)[1]);
assert.deepEqual(d.seasons,[2025,2026]);assert(d.data.length>0&&d.data.every(r=>r[0]>=2025));
assert.equal(d.data.length,d.stateGoals.length);assert(d.allowProvisional);
for(const s of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g))if(!s[1].includes('application/json'))new vm.Script(s[2]);
assert(html.includes('PROVISIONAL'));assert(html.includes('2025–26 + 2026–27'));
console.log('PASS: goalie-pull scope, aligned rows, provisional settings and script syntax');
