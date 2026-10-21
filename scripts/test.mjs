import fs from 'node:fs';
import assert from 'node:assert/strict';
const rows=JSON.parse(fs.readFileSync('data/games-20262027.json','utf8')).games;
const seen=new Set();for(const g of rows){assert(/^2026-\d\d-\d\d$/.test(g.date));assert(g.away!==g.home);assert(Number.isInteger(g.hp1)&&g.hp1>=0);assert(Number.isInteger(g.ap1)&&g.ap1>=0);assert(!seen.has(g.id),'Duplicate '+g.id);seen.add(g.id);}
const html=fs.readFileSync('index.html','utf8');
assert(html.includes('const EMBED_META='));assert(html.includes('const SEED='));assert(html.includes('2026–27 only'));assert(html.includes('Fair American odds'));assert(html.includes('const NHL='));
for(const g of rows)assert(html.includes(g.id),'Missing embedded game '+g.id);
const prior=JSON.parse(fs.readFileSync('data/games-20252026.json','utf8'));
if(prior.meta.complete){assert.equal(prior.games.length,1312);assert(html.includes('HISTORY_SEED=[{'));}else assert(html.includes('HISTORY_SEED=[];'));
console.log('OK: '+rows.length+' unique verified-game records embedded; matchup inputs and season modes present.');