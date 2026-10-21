/* First Twenty v2 — pure predictive engine shared by browser and backtest.
   NO future match or future same-day outcomes may enter a historical forecast.
   History array must contain the complete reconciled prior-season data or []. */
const FirstTwentyEngine = (() => {
  const PRIOR_VENUE=8, RATE_SHRINK=12, RESID_SHRINK=12, RECENT_WEIGHT=2.5;
  const MATCH_WEIGHT=.60, EVIDENCE_WEIGHT=.65, HYBRID_BLEND=.30;
  const codes=['ANA','BOS','BUF','CAR','CBJ','CGY','CHI','COL','DAL','DET','EDM','FLA','LAK','MIN','MTL','NJD','NSH','NYI','NYR','OTT','PHI','PIT','SEA','SJS','STL','TBL','TOR','UTA','VAN','VGK','WPG','WSH'];
  const poiss=x=>1-Math.exp(-x)*(1+x);
  const clip=(p,lo=.025,hi=.95)=>Math.max(lo,Math.min(hi,p));
  const brier=(p,y)=>(p-y)**2;
  const logloss=(p,y)=>-y*Math.log(clip(p,.0001,.9999))-(1-y)*Math.log(1-clip(p,.0001,.9999));
  function averages(teams){let h=0,a=0;for(const team of Object.values(teams)){h+=team.hgf;a+=team.agf;}return{home:h/(41*32),away:a/(41*32)};}
  function perVenue(rows,code,venue){const chosen=rows.filter(g=>g[venue]===code);const gf=chosen.reduce((sum,g)=>sum+(venue==='home'?g.hp1:g.ap1),0),ga=chosen.reduce((sum,g)=>sum+(venue==='home'?g.ap1:g.hp1),0);return{n:chosen.length,gf,ga};}
  function rates(teams,current,code,venue,mode){
    const t=teams[code],cur=perVenue(current,code,venue);
    const past={n:41,gf:venue==='home'?t.hgf:t.agf,ga:venue==='home'?t.hga:t.aga};
    if(mode==='last')return{...past,curN:cur.n};
    if(mode==='combined')return{n:past.n+RECENT_WEIGHT*cur.n,gf:past.gf+RECENT_WEIGHT*cur.gf,ga:past.ga+RECENT_WEIGHT*cur.ga,curN:cur.n};
    if(mode==='current')return{n:cur.n+PRIOR_VENUE,gf:cur.gf+PRIOR_VENUE*.85,ga:cur.ga+PRIOR_VENUE*.85,curN:cur.n};
    throw Error('Unsupported mode '+mode);
  }
  function expectedVenueRate(teams,code,venue){const t=teams[code];return venue==='home'?(t.hgf+t.hga)/41:(t.agf+t.aga)/41;}
  function evidenceResidual(team,venue,mode,teams,current,history){
    let weightedDeviation=0,n=0;const leaguePrior=poiss(1.7);
    const run=(records,factor,useTeamPrior)=>{
      for(const g of records){if(g.home!==team&&g.away!==team)continue;
        const usedVenue=g.home===team?'home':'away';const venueFactor=usedVenue===venue?1:.35;const w=factor*venueFactor;
        const expected=useTeamPrior?poiss(expectedVenueRate(teams,team,usedVenue)):leaguePrior;
        weightedDeviation+=w*(Number(g.hp1+g.ap1>=2)-expected);n+=w;
      }
    };
    if(mode!=='current'&&history.length===1312)run(history,1,true);
    if(mode!=='last')run(current,mode==='combined'?RECENT_WEIGHT:1,mode==='combined');
    return{delta:weightedDeviation/(RESID_SHRINK+n),n};
  }
  function predict({home,away,mode='combined',teams,current=[],history=[]}){
    if(!teams[home]||!teams[away]||home===away)throw Error('Invalid matchup');
    const lg=averages(teams),h=rates(teams,current,home,'home',mode),a=rates(teams,current,away,'away',mode);
    const hgf=h.gf/h.n,hga=h.ga/h.n,agf=a.gf/a.n,aga=a.ga/a.n;
    const baseHome=(hgf+aga)/2,baseAway=(agf+hga)/2;
    const lambdaBase=baseHome+baseAway,baselineP=poiss(lambdaBase);
    const lh=mode==='current'?.85:lg.home,la=mode==='current'?.85:lg.away;
    const shrink=(v,n,mu)=>(v*n+RATE_SHRINK*mu)/(n+RATE_SHRINK);
    const hOff=shrink(hgf,h.n,lh),aDef=shrink(aga,a.n,lh);
    const aOff=shrink(agf,a.n,la),hDef=shrink(hga,h.n,la);
    // Multiplicative offense vs opponent-defense strengths relative to league-scoring baseline.
    // The unshrunk arithmetic comparator ignores this interaction and remains visible.
    const strengthHome=clip(hOff*aDef/lh,.1,4.5),strengthAway=clip(aOff*hDef/la,.1,4.5);
    const lambdaStrength=strengthHome+strengthAway,strengthP=poiss(lambdaStrength);
    const goalHome=(1-MATCH_WEIGHT)*baseHome+MATCH_WEIGHT*strengthHome;
    const goalAway=(1-MATCH_WEIGHT)*baseAway+MATCH_WEIGHT*strengthAway;
    const lambda=goalHome+goalAway,matchupP=poiss(lambda);
    const hist=history.length===1312?history:[];
    const homeEvidence=evidenceResidual(home,'home',mode,teams,current,hist);
    const awayEvidence=evidenceResidual(away,'away',mode,teams,current,hist);
    const adjustment=EVIDENCE_WEIGHT*.5*(homeEvidence.delta+awayEvidence.delta);
    const aggressiveP=clip(matchupP+adjustment);
    // Conservative evidence blend: retain 70% of the original benchmark until
    // an independent holdout supports a stronger departure.
    const hybridP=clip(.70*baselineP+HYBRID_BLEND*aggressiveP);
    const p=baselineP; // Previous-season study does not justify promoting the experimental hybrid.
    return{p,hybridP,lambda:lambdaBase,lambdaMatchup:lambda,lambdaBase,goalHome,goalAway,baselineP,strengthP,matchupP,aggressiveP,adjustment:HYBRID_BLEND*adjustment,homeEvidence,awayEvidence,historyIncluded:hist.length===1312,hCurrentN:h.curN,aCurrentN:a.curN,h,a};
  }
  function walkForward({teams,current,history=[]}){
    const ordered=[...current].sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id));
    const outcomes=[];let done=[],oldDate='';
    for(const g of ordered){if(g.date!==oldDate){done=ordered.filter(x=>x.date<g.date);oldDate=g.date;}
      const x=predict({home:g.home,away:g.away,mode:'combined',teams,current:done,history});
      outcomes.push({date:g.date,home:g.home,away:g.away,y:Number(g.hp1+g.ap1>=2),baseline:x.baselineP,matchup:x.matchupP,hybrid:x.hybridP,goals:g.hp1+g.ap1,lambdaBase:x.lambdaBase});
    }
    const metrics={};for(const key of ['baseline','matchup','hybrid']){
      const count=outcomes.length||1;metrics[key]={brier:outcomes.reduce((s,r)=>s+brier(r[key],r.y),0)/count,logLoss:outcomes.reduce((s,r)=>s+logloss(r[key],r.y),0)/count,mean:outcomes.reduce((s,r)=>s+r[key],0)/count,predicted:outcomes.reduce((s,r)=>s+r[key],0)/count};
    }
    const totalGoals=outcomes.reduce((s,r)=>s+r.goals,0),meanGoals=outcomes.length?totalGoals/outcomes.length:0;
    const varGoals=outcomes.length>1?outcomes.reduce((s,r)=>s+(r.goals-meanGoals)**2,0)/(outcomes.length-1):0;
    const distribution={mean:meanGoals,variance:varGoals,dispersion:meanGoals?varGoals/meanGoals:null,observed:[0,1,2].map(k=>outcomes.filter(r=>k===2?r.goals>=2:r.goals===k).length),expected:[0,1,2].map(k=>outcomes.reduce((s,r)=>s+(k===0?Math.exp(-r.lambdaBase):k===1?r.lambdaBase*Math.exp(-r.lambdaBase):r.baseline),0))};
    return {count:outcomes.length,actual:outcomes.length?outcomes.reduce((s,r)=>s+r.y,0)/outcomes.length:0,metrics,distribution,outcomes};
  }
  return{predict,walkForward,poiss,averages,constants:{PRIOR_VENUE,RATE_SHRINK,RESID_SHRINK,RECENT_WEIGHT,MATCH_WEIGHT,EVIDENCE_WEIGHT,HYBRID_BLEND}};
})();