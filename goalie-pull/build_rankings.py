"""Build descriptive 5-on-6 performance from screened tactical episodes and raw shifts.
Usage: python build_rankings.py SOURCE HISTORICAL_RAW OUTPUT
"""
from pathlib import Path
import sys,json,hashlib
import numpy as np,pandas as pd
from scipy.stats import spearmanr
src,old,out=map(Path,sys.argv[1:]);out.mkdir(parents=True,exist_ok=True)
episodes=pd.read_csv(src/'tactical_episodes.csv');index=pd.read_csv(src/'game_index.csv');ab=pd.read_csv(src/'team_abbreviation_evidence.csv')
rows=[];audit={'screenedEpisodes':0,'eligibleEpisodes':0,'excludedSeconds':0,'excludedGoalEvents':0,'acceptedGF':0,'acceptedGA':0,'unsupportedEpisodes':0};seen=set()
for year in [2025,2026]:
 season=int(f'{year}{year+1}');raw=old if year==2025 else src/'raw_2026'
 p=pd.read_parquet(raw/f'NHL_PBPS_GC_{season}.parquet');s=pd.read_parquet(raw/f'NHL_SCS_{season}.parquet');r=pd.read_parquet(raw/f'NHL_ROSTERS_{season}.parquet')
 pg=dict(tuple(p.groupby('gameId')));sg=dict(tuple(s[s.periodNumber==3].groupby('gameId')));rg=dict(tuple(r.groupby('gameId')))
 mp=ab[ab.season==season].set_index('teamId').abbreviation.to_dict();rev={v:k for k,v in mp.items()}
 for gid,eps in episodes[episodes.season==season].groupby('gameId'):
  g=index[(index.gameId==gid)&(index.gameTypeId==2)].iloc[0];pb=pg[gid];sh=sg[gid];goalies=set(rg[gid].loc[rg[gid].positionCode=='G','playerId']);counts={}
  for team in [g.homeTeamId,g.awayTeamId]:
   gc=np.zeros(1200,int);sc=gc.copy()
   for pid,ss in sh[sh.teamId==team].groupby('playerId'):
    covered=np.zeros(1200,bool)
    for a,b in zip(ss.startSecondsElapsedInPeriod,ss.endSecondsElapsedInPeriod):
     if pd.notna(a) and pd.notna(b) and 0<=a<b<=1200:covered[int(a):int(b)]=True
    if pid in goalies:gc+=covered
    else:sc+=covered
   counts[team]=(gc,sc)
  goals=pb[(pb.eventTypeDescKey=='goal')&(pb.periodNumber<=3)].sort_values('sortOrder')
  for ep in eps.itertuples():
   audit['screenedEpisodes']+=1;team=rev[ep.leading];opp=rev[ep.trailing];a=max(600,1200-int(ep.remaining));b=min(1200,1200-int(ep.remaining)+int(ep.duration))
   if a>=b:continue
   mask=(counts[team][0]==1)&(counts[team][1]==5)&(counts[opp][0]==0)&(counts[opp][1]==6)
   cells={};tickbins={}
   for t in range(a,b):
    if not mask[t]:audit['excludedSeconds']+=1;continue
    before=goals[goals.secondsElapsedInGame<=2400+t];margin=int((before.eventOwnerTeamId==team).sum()-(before.eventOwnerTeamId==opp).sum())
    if not 1<=margin<=4:audit['excludedSeconds']+=1;continue
    key=(int(gid),int(team),t);assert key not in seen;seen.add(key)
    rem=1200-t;stratum=f'{year}|{min(margin,3)}|'+('0-60' if rem<=60 else '61-120' if rem<=120 else '121-300' if rem<=300 else '301-600')
    tickbins[t]=stratum;cells.setdefault(stratum,[0,0,0])[0]+=1
   if not cells:audit['unsupportedEpisodes']+=1;continue
   audit['eligibleEpisodes']+=1
   for goal in goals[(goals.secondsElapsedInGame>2400+a)&(goals.secondsElapsedInGame<=2400+b)].itertuples():
    t=int(goal.secondsElapsedInGame)-2400-1
    home=team==g.homeTeamId
    valid=(goal.homeSkaterCount==5 and goal.awaySkaterCount==6 and not goal.homeIsEmptyNet and goal.awayIsEmptyNet) if home else (goal.awaySkaterCount==5 and goal.homeSkaterCount==6 and not goal.awayIsEmptyNet and goal.homeIsEmptyNet)
    if t not in tickbins or not valid:audit['excludedGoalEvents']+=1;continue
    gf=goal.eventOwnerTeamId==team
    if gf and not goal.isEmptyNetAgainst:audit['excludedGoalEvents']+=1;continue
    cells[tickbins[t]][1 if gf else 2]+=1;audit['acceptedGF' if gf else 'acceptedGA']+=1
   for st,(seconds,gf,ga) in cells.items():rows.append(dict(season=year,game=int(gid),team=ep.leading,opponent=ep.trailing,episode=f'{gid}-{ep.trailing}-{ep.remaining}',stratum=st,seconds=seconds,gf=gf,ga=ga))
 print(year,'completed',flush=True)
df=pd.DataFrame(rows);df.to_csv(out/'empty-net-exposures.csv',index=False)
teams=sorted(set(ab[ab.season==20262027].abbreviation))
def table(d,prior=1200):
 league=d.groupby('stratum')[['seconds','gf','ga']].sum();rates=league[['gf','ga']].div(league.seconds,axis=0)
 d=d.copy();d['egf']=d.seconds*d.stratum.map(rates.gf);d['ega']=d.seconds*d.stratum.map(rates.ga)
 ans=[]
 for team in teams:
  x=d[d.team==team];secs=int(x.seconds.sum());gf=int(x.gf.sum());ga=int(x.ga.sum());n=x.episode.nunique();egf=float(x.egf.sum());ega=float(x.ega.sum());delta=120*(gf-ga-egf+ega)/(secs+prior)
  ans.append(dict(team=team,episodes=n,games=x.game.nunique(),seconds=secs,gf=gf,ga=ga,gfPerEpisode=gf/n if n else None,gaPerEpisode=ga/n if n else None,rawNetPer2=120*(gf-ga)/secs if secs else None,attack=120*(gf-egf)/(secs+prior) if secs else None,defence=120*(ega-ga)/(secs+prior) if secs else None,adjustedExcessPer2=delta if secs else None,index=100+100*delta if secs else None,provisional=n<20 or secs<600,expectedGF=egf,expectedGA=ega))
 return sorted(ans,key=lambda x:-(x['index'] if x['index'] is not None else -1e9))
views={str(y):table(df[df.season==y]) for y in [2025,2026]};views['combined']=table(df)
# Out-of-time descriptive check: chronological game IDs within 2025 regular season.
games=sorted(df.loc[df.season==2025,'game'].unique());cut=games[len(games)//2];first=df[(df.season==2025)&(df.game<cut)];second=df[(df.season==2025)&(df.game>=cut)]
a={r['team']:r for r in table(first)};b={r['team']:r for r in table(second,0)};valid=[t for t in teams if a[t]['seconds']>=300 and b[t]['seconds']>=300]
corr=spearmanr([a[t]['index'] for t in valid],[b[t]['adjustedExcessPer2'] for t in valid])
research={'check':'2025–26 first half of games with eligible exposure versus second half; >=5 minutes in each half','teams':len(valid),'spearman':float(corr.statistic),'pValue':float(corr.pvalue),'splitGameId':int(cut)}
audit.update(seconds=int(df.seconds.sum()),gf=int(df.gf.sum()),ga=int(df.ga.sum()),uniqueEpisodes=int(df.episode.nunique()),games=int(df.game.nunique()));assert audit['gf']==audit['acceptedGF'] and audit['ga']==audit['acceptedGA'];assert all(df.seconds>0)
model=json.loads((src/'model.json').read_text())
result={'dataThrough':model.get('dataThrough','2026-10-25'),'modelAsOf':model.get('asOf'),'scope':'Final 10 minutes; leading by 1–4; screened tactical pulls; exact 5-on-6 only','priorSeconds':1200,'indexDefinition':'100 + 100 × 120 × (GF − GA − expected GF + expected GA) / (seconds + 1200)','strata':'Season × lead (1, 2, 3–4) × remaining time (0–60, 61–120, 121–300, 301–600 seconds)','views':views,'audit':audit,'research':research}
(out/'empty-net-rankings.json').write_text(json.dumps(result,indent=2,allow_nan=False))
print(json.dumps({'audit':audit,'research':research,'top':views['combined'][:5]},indent=2))
