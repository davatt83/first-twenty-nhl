"""Opponent-adjusted descriptive indexes. Usage: python build_refinements.py RANKING_DIR.
Leave the focal team's games out of opponent estimates. Fixed 1200-second priors.
"""
import json,sys
from pathlib import Path
import pandas as pd
import numpy as np
from scipy.stats import spearmanr
P=1200

def fit(d,teams):
    league=d.groupby('stratum')[['seconds','gf','ga']].sum()
    rates=league[['gf','ga']].div(league.seconds,axis=0)
    z=d.copy()
    for f in ['gf','ga']:z['e'+f]=z.seconds*z.stratum.map(rates[f])
    out=[]
    for team in teams:
        a=z[z.team==team];other=z[z.team!=team]
        other_rates=other.groupby('stratum')[['seconds','gf','ga']].sum()
        egf=ega=0.
        for (season,opp),part in a.groupby(['season','opponent']):
            b=other[(other.season==season)&(other.opponent==opp)]
            # Opponent's concession/scoring tendency relative to its situation mix.
            for f in ['gf','ga']:
                seasonrows=other[other.season==season]
                rate=seasonrows[f].sum()/seasonrows.seconds.sum() if seasonrows.seconds.sum() else 0.
                expected=(b.seconds*b.stratum.map(other_rates[f]/other_rates.seconds)).sum()
                multiplier=(b[f].sum()+P*rate)/(expected+P*rate) if rate else 1.
                if f=='gf':egf+=part.egf.sum()*multiplier
                else:ega+=part.ega.sum()*multiplier
        secs=int(a.seconds.sum());n=int(a.episode.nunique())
        base=120*(a.gf.sum()-a.ga.sum()-a.egf.sum()+a.ega.sum())/(secs+P)
        adj=120*(a.gf.sum()-a.ga.sum()-egf+ega)/(secs+P)
        out.append(dict(team=team,seconds=secs,episodes=n,index=100+100*adj if secs else None,baseline=100+100*base if secs else None,delta=100*(adj-base) if secs else None,provisional=n<20 or secs<600))
    return sorted(out,key=lambda r:-(r['index'] if r['index'] is not None else -1e9))

def evaluate(d,teams):
    train=d[d.season==2025];test=d[d.season==2026]
    a={r['team']:r for r in fit(train,teams)}
    rates=test.groupby('stratum')[['seconds','gf','ga']].sum()
    rates['net']=(rates.gf-rates.ga)/rates.seconds
    targets=[]
    for t in teams:
        b=test[test.team==t];sec=b.seconds.sum()
        if a[t]['seconds']<300 or sec<300:continue
        actual=120*(b.gf.sum()-b.ga.sum()-(b.seconds*b.stratum.map(rates.net)).sum())/sec
        targets.append((t,actual,sec,(a[t]['baseline']-100)/100,(a[t]['index']-100)/100))
    if len(targets)<3:return {'teams':len(targets),'status':'Too few teams for a comparison'}
    v=np.array([r[1:] for r in targets]); mse=lambda col:float(np.average((v[:,col]-v[:,0])**2,weights=v[:,1]))
    b=mse(2);aerr=mse(3)
    return dict(teams=len(targets),training='2025–26',testing='2026–27 through data cutoff',minimumSecondsEach=300,baselineWeightedMSE=b,adjustedWeightedMSE=aerr,baselineSpearman=float(spearmanr(v[:,0],v[:,2]).statistic),adjustedSpearman=float(spearmanr(v[:,0],v[:,3]).statistic),status='Lower observed error; exploratory only' if aerr<b else 'No improvement in observed error',note='One season transition, small current-season sample; no statistical significance or betting advantage established. Target is next-season situation-adjusted net goals per 2 minutes; test outcomes never enter training indexes.')

def build(path):
    d=pd.read_csv(path/'empty-net-exposures.csv');base=json.loads((path/'empty-net-rankings.json').read_text());teams=sorted(r['team'] for r in base['views']['combined'])
    result=dict(dataThrough=base['dataThrough'],priorSeconds=P,roles={})
    for role,x in [('defending',d),('own',d.rename(columns={'team':'opponent','opponent':'team','gf':'ga','ga':'gf'}))]:
        result['roles'][role]={'views':{key:fit(x if key=='combined' else x[x.season==int(key)],teams) for key in ['2025','2026','combined']},'validation':evaluate(x,teams)}
    (path/'opponent-adjusted.json').write_text(json.dumps(result,indent=2,allow_nan=False)+'\n')
    print(json.dumps({k:v['validation'] for k,v in result['roles'].items()},indent=2))
if __name__=='__main__':build(Path(sys.argv[1]))
