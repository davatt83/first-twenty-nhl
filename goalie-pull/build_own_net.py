"""Own-net rankings. Usage: python build_own_net.py SOURCE RANKING_DIR OUTPUT.
Requires the validated empty-net-exposures.csv from build_rankings.py.
"""
from pathlib import Path
import json,sys
import pandas as pd
src,rank,out=map(Path,sys.argv[1:]);out.mkdir(parents=True,exist_ok=True)
x=pd.read_csv(rank/'empty-net-exposures.csv');base=json.loads((rank/'empty-net-rankings.json').read_text())
# Exact mirror: goals against the defender become goals for the pulling team.
d=x.rename(columns={'team':'opponent','opponent':'team','gf':'ga','ga':'gf'})
eps=pd.read_csv(src/'tactical_episodes.csv');games=pd.read_csv(src/'game_index.csv').set_index('gameId')
eps=eps[eps.season.isin([20252026,20262027])].sort_values('remaining',ascending=False).drop_duplicates(['gameId','trailing'])
valid=set(d.episode);timing=[]
for e in eps.itertuples():
 key=f'{e.gameId}-{e.trailing}-{e.remaining}'
 if key not in valid or not 1<=e.deficit<=4 or not 0<e.remaining<=600:continue
 g=games.loc[e.gameId];own=g.finalRegHomeGoals if e.home else g.finalRegAwayGoals;opp=g.finalRegAwayGoals if e.home else g.finalRegHomeGoals
 timing.append(dict(season=int(str(e.season)[:4]),game=int(e.gameId),team=e.trailing,deficit=int(e.deficit),remaining=int(e.remaining),recovered=int(own>=opp),band='0–60s' if e.remaining<=60 else '61–120s' if e.remaining<=120 else '121–180s' if e.remaining<=180 else '181–300s' if e.remaining<=300 else '301–600s'))
t=pd.DataFrame(timing);t.to_csv(out/'own-net-timing.csv',index=False)
teams=[r['team'] for r in base['views']['combined']]
def build(z,tt):
 league=z.groupby('stratum')[['seconds','gf','ga']].sum();z=z.copy();z['egf']=z.seconds*z.stratum.map(league.gf/league.seconds);z['ega']=z.seconds*z.stratum.map(league.ga/league.seconds)
 ans=[]
 for team in teams:
  a=z[z.team==team];b=tt[tt.team==team];secs=int(a.seconds.sum());gf=int(a.gf.sum());ga=int(a.ga.sum());n=int(a.episode.nunique());attack=120*(gf-a.egf.sum())/(secs+1200);defence=120*(a.ega.sum()-ga)/(secs+1200)
  splits=[]
  for deficit in range(1,5):
   q=b[b.deficit==deficit];splits.append(dict(deficit=deficit,games=len(q),medianPullSeconds=float(q.remaining.median()) if len(q) else None,recovered=int(q.recovered.sum()),recoveryRate=float(q.recovered.mean()) if len(q) else None))
  ans.append(dict(team=team,index=float(100+100*(attack+defence)) if secs else None,attack=float(attack) if secs else None,defence=float(defence) if secs else None,gf=gf,ga=ga,episodes=n,seconds=secs,gfPer2=120*gf/secs if secs else None,gaPer2=120*ga/secs if secs else None,rawNetPer2=120*(gf-ga)/secs if secs else None,secondsPerGA=secs/ga if ga else None,gfPerEpisode=gf/n if n else None,gaPerEpisode=ga/n if n else None,provisional=n<20 or secs<600,timing=splits))
 bands=[]
 for deficit in range(1,5):
  for band in ['0–60s','61–120s','121–180s','181–300s','301–600s']:
   q=tt[(tt.deficit==deficit)&(tt.band==band)];bands.append(dict(deficit=deficit,band=band,games=len(q),recovered=int(q.recovered.sum()),rate=float(q.recovered.mean()) if len(q) else None))
 return dict(teams=sorted(ans,key=lambda a:-(a['index'] if a['index'] is not None else -1e9)),timingBands=bands)
views={str(y):build(d[d.season==y],t[t.season==y]) for y in [2025,2026]};views['combined']=build(d,t)
result=dict(dataThrough=base['dataThrough'],views=views,scope=base['scope'],timingGames=len(t),definition='Index = 100 + 100 × 120 × (GF − GA − expected GF + expected GA) / (seconds + 1200). Expected goals match season, deficit and remaining time.')
assert d.gf.sum()==x.ga.sum() and d.ga.sum()==x.gf.sum() and d.seconds.sum()==x.seconds.sum()
assert not t.duplicated(['game','team']).any()
for view in views.values():
 assert len(view['teams'])==32
 for a in view['teams']:
  if a['seconds']:assert abs(a['index']-100-100*(a['attack']+a['defence']))<1e-8
  for b in a['timing']:assert 0<=b['recovered']<=b['games']
(out/'own-net-rankings.json').write_text(json.dumps(result,indent=2,allow_nan=False))
print(json.dumps(dict(gf=int(d.gf.sum()),ga=int(d.ga.sum()),seconds=int(d.seconds.sum()),timingGames=len(t),top=views['combined']['teams'][:3]),indent=2))
