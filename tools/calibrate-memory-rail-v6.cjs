// Source wheel-rim samples and a common rail line, in native image coordinates.
const fs=require('node:fs'),path=require('node:path');
const base=path.resolve(__dirname,'../assets/goi-viet/memory-rail-v6');
const trainAsset=JSON.parse(fs.readFileSync(path.join(base,'train-front-stack.json')));
const nativeWheels=[[47,189,26],[247,216,26],[364,234,28],[573,264,29],[718,288,29],[945,322,30],[1110,349,31],[1425,398,34],[1599,433,46],[1699,450,47],[1801,468,47],[1903,486,39]];
const finalPlate=fs.existsSync(path.join(base,'viaduct-station-final.json'));
const infrastructure=[-32,finalPlate?185-53*859/2048:185,859],m=.23,nativeRailIntercept=finalPlate?192:139,cameraShear=-.075;
const scale=infrastructure[2]/2048,B=infrastructure[1]+nativeRailIntercept*scale-m*infrastructure[0];
const tw=350,ts=tw/trainAsset.width,targetIntercept=30;
function fit(points){
 const n=points.length,sx=points.reduce((s,p)=>s+p[0],0),sy=points.reduce((s,p)=>s+p[1],0);
 const m=(n*points.reduce((s,p)=>s+p[0]*p[1],0)-sx*sy)/(n*points.reduce((s,p)=>s+p[0]**2,0)-sx*sx);
 return {m,b:(sy-m*sx)/n};
}
const ranges=[[0,331],[331,675],[675,1040],[1040,1530],[1530,2102]];
const parts=ranges.map(([left,right],index)=>{
 const samples=nativeWheels.filter(p=>p[0]>=left&&p[0]<right),line=fit(samples);
 return {index,clip:[left/trainAsset.width*100,right/trainAsset.width*100],shear:m-line.m,offset:targetIntercept-line.b*ts,nativeLine:line,nativeWheels:samples,
  maximumContactError:Math.max(...samples.map(p=>Math.abs(p[1]-line.m*p[0]-line.b)*ts))};
});
const wheels=nativeWheels.map(([x,y,r])=>({native:[x,y],x:x*ts,y:targetIntercept+m*x*ts,radius:r*ts}));
const config={frame:[795,394],infrastructureId:finalPlate?'viaduct-station-final':'viaduct-station-aligned',infrastructure,cameraShear,
 rail:{nativeSlope:m,nativeIntercept:nativeRailIntercept,authoringSlope:m,authoringIntercept:B,screenSlope:m+cameraShear,leftOverscan:32},
 train:{id:'train-front-stack',width:tw,x:30,y:B+m*30-targetIntercept,direction:'right',coaches:['red','blue','green','red'],chimney:[2000*ts,148*ts],parts,wheels},
 motion:{duration:12000,steadyUntil:.75,deceleration:'cubic-bezier(.5,1,.5,1)',from:[-397.5,-397.5*m],to:[0,0]},method:'Native art preserved. Five CSS train segments align measured wheel rims to a shared rail projection; engine fit uses all four wheels.'};
fs.writeFileSync(path.join(base,'geometry.json'),JSON.stringify(config,null,2));
console.log(JSON.stringify({rail:config.rail,trainPosition:[config.train.x,config.train.y],contactErrors:parts.map(p=>p.maximumContactError)}));
