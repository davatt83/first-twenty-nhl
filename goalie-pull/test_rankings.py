import json,math
from pathlib import Path
import pandas as pd
p=Path(__file__).parent;j=json.loads((p/'empty-net-rankings.json').read_text());d=pd.read_csv(p/'empty-net-exposures.csv')
assert set(d.season)=={2025,2026} and d.seconds.min()>0
assert len(d)==len(d.drop_duplicates(['episode','stratum']))
for key,rows in j['views'].items():
 x=d if key=='combined' else d[d.season==int(key)]
 assert len(rows)==32 and len({r['team'] for r in rows})==32
 for field in ['gf','ga','seconds']:assert sum(r[field] for r in rows)==int(x[field].sum())
 for r in rows:
  if not r['seconds']:assert r['index'] is None;continue
  assert math.isclose(r['rawNetPer2'],120*(r['gf']-r['ga'])/r['seconds'])
  assert math.isclose(r['attack']+r['defence'],r['adjustedExcessPer2'],abs_tol=1e-12)
  assert math.isclose(r['index'],100+100*r['adjustedExcessPer2'])
  assert r['episodes']==x[x.team==r['team']].episode.nunique()
 assert math.isclose(sum(r['expectedGF'] for r in rows),x.gf.sum())
 assert math.isclose(sum(r['expectedGA'] for r in rows),x.ga.sum())
assert sum(r['episodes'] for r in j['views']['combined'])==j['audit']['uniqueEpisodes']
print('PASS: all 32 teams, three season views, exposure/goal reconciliation, episode uniqueness, benchmark totals and coefficient identities.')
