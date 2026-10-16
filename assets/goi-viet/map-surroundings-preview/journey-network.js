/* Fixed, illustrative province/port graph. Geometry and planning have no UI state. */
(() => {
  'use strict';
  const source=window.GoiVietJourneyNetworkData,nodes=new Map(source.nodes.map(n=>[n.id,Object.freeze({...n,point:Object.freeze([...n.point])})])),adj=new Map(),plans=new Map();
  let searches=0;
  function remember(key,value){plans.set(key,value);while(plans.size>64)plans.delete(plans.keys().next().value);return value;}
  for(const n of nodes.keys())adj.set(n,[]);
  for(const [index,e]of source.edges.entries()){
    adj.get(e.a).push({to:e.b,edge:e,index,reverse:false});adj.get(e.b).push({to:e.a,edge:e,index,reverse:true});
  }
  const node=id=>nodes.get(id),playable=[...nodes.values()].filter(n=>n.kind!=='port').map(n=>n.id);
  function plan(origin,destination){
    const key=origin+'>'+destination;if(plans.has(key)){const result=plans.get(key);plans.delete(key);plans.set(key,result);return result;}
    if(!nodes.has(origin)||!nodes.has(destination))return null;
    const start=nodes.get(origin),end=nodes.get(destination);
    if(origin===destination)return remember(key,{originId:origin,id:destination,available:true,start:start.point,end:end.point,nodeIds:[origin],legs:[],totalLength:0});
    searches++;
    const seaAllowed=start.kind==='island'||end.kind==='island',front=[{id:origin,mode:'none',cost:0,key:origin+'|none'}],dist=new Map([[origin+'|none',0]]),came=new Map();let goal=null;
    while(front.length){
      front.sort((a,b)=>b.cost-a.cost||b.key.localeCompare(a.key));const at=front.pop();if(at.cost!==dist.get(at.key))continue;
      if(at.id===destination){goal=at;break;}
      for(const link of adj.get(at.id)){
        const mode=link.edge.mode;if(mode==='sea'&&!seaAllowed)continue;
        const nextKey=link.to+'|'+mode,cost=at.cost+link.edge.length*(mode==='sea'?1.35:1)+(at.mode!=='none'&&at.mode!==mode?14:0);
        if(cost+1e-8<(dist.get(nextKey)??Infinity)){dist.set(nextKey,cost);came.set(nextKey,{previous:at.key,link});front.push({id:link.to,mode,cost,key:nextKey});}
      }
    }
    if(!goal)return null;
    const links=[];let current=goal.key;
    while(came.has(current)){const entry=came.get(current);links.push(entry.link);current=entry.previous;}
    links.reverse();
    const nodeIds=[origin],groups=[];let from=origin;
    for(const link of links){
      const points=link.reverse?[...link.edge.points].reverse():link.edge.points;
      let group=groups.at(-1);
      if(!group||group.mode!==link.edge.mode){group={mode:link.edge.mode,from,to:link.to,raw:[],nodeIds:[from]};groups.push(group);}
      group.raw.push(...(group.raw.length?points.slice(1):points));group.to=link.to;group.nodeIds.push(link.to);nodeIds.push(link.to);from=link.to;
    }
    const legs=groups.map(g=>({mode:g.mode,from:g.from,to:g.to,nodeIds:g.nodeIds,curve:buildArcLengthCurveFromRaw(g.raw)}));
    return remember(key,Object.freeze({originId:origin,id:destination,available:true,start:start.point,end:end.point,nodeIds,legs,totalLength:legs.reduce((n,l)=>n+l.curve.totalLen,0),cost:goal.cost}));
  }
  function schedule(route,reduced=false){
    if(!route?.legs.length)return [];
    const sea=route.legs.some(l=>l.mode==='sea'),total=sea?Math.max(4200,Math.min(9000,3200+route.totalLength*6)):Math.max(2200,Math.min(7000,1800+route.totalLength*5));
    const transfer=reduced?0:320,budget=total-transfer*(route.legs.length-1),weight=route.legs.reduce((n,l)=>n+l.curve.totalLen*(l.mode==='sea'?1.2:1),0);
    let cursor=0;const phases=[];
    for(const [index,leg]of route.legs.entries()){
      const duration=reduced?0:budget*leg.curve.totalLen*(leg.mode==='sea'?1.2:1)/weight;
      phases.push({kind:leg.mode,leg,start:cursor,duration});cursor+=duration;
      if(index<route.legs.length-1){phases.push({kind:'transfer',leg,next:route.legs[index+1],start:cursor,duration:transfer});cursor+=transfer;}
    }
    return phases;
  }
  window.GoiVietJourneyNetwork=Object.freeze({node,plan,schedule,playable:Object.freeze(playable),inspect:()=>({stations:source.checks.landNodes,ports:source.checks.ports,islands:source.checks.islands,railEdges:source.checks.railEdges,seaEdges:source.checks.seaEdges,searches,cachedPlans:plans.size,illustrative:true})});
})();
