import json,math
from pathlib import Path
import pandas as pd
from build_refinements import fit
p=Path(__file__).parent
r=json.loads((p/'opponent-adjusted.json').read_text())
b=json.loads((p/'empty-net-rankings.json').read_text());own=json.loads((p/'own-net-rankings.json').read_text())
assert r['dataThrough']==b['dataThrough']==own['dataThrough']
for role,item in r['roles'].items():
 for key,rows in item['views'].items():
  old=b['views'][key] if role=='defending' else own['views'][key]['teams'];old={a['team']:a for a in old}
  assert len(rows)==len({a['team'] for a in rows})==32
  for a in rows:
   assert a['seconds']==old[a['team']]['seconds']
   if a['seconds']:
    assert math.isclose(a['baseline'],old[a['team']]['index'],abs_tol=1e-9)
    assert math.isclose(a['index']-a['baseline'],a['delta'],abs_tol=1e-9)
# Identical opponent strengths must not change the situation benchmark.
z=pd.DataFrame([dict(team=t,opponent=o,season=2025,stratum='2025|1|0-60',seconds=120,gf=1,ga=1,episode=t+o) for t in 'ABC' for o in 'ABC' if t!=o])
for a in fit(z,list('ABCD')):
 assert a['index']==100 if a['seconds'] else a['index'] is None
print('PASS: baseline parity, 32 teams, coverage, coefficient identities, equal-strength opponents and no-exposure teams.')
