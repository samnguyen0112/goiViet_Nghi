// Read the actual browser trajectory and its velocity across the braking transition.
const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/memory-white-smooth');
(async()=>{
 const b=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const p=await b.newPage({viewport:{width:1200,height:800},reducedMotion:'reduce'});
 try{
  await p.goto('file:///'+root.replaceAll('\\','/')+'/map-surroundings-preview-3.html');
  await p.waitForFunction(()=>window.GoiVietHomeIntro&&window.GoiVietMemoryChapter);
  await p.evaluate(()=>{GoiVietHomeIntro.skip();GoiVietMemoryChapter.begin();});
  await p.locator('.n6-exit-world').scrollIntoViewIfNeeded();await p.emulateMedia({reducedMotion:'no-preference'});
  await p.waitForFunction(()=>document.querySelector('.n6-train').getAnimations().length);
  const report=await p.locator('.n6-train').evaluate(async el=>{
   const a=el.getAnimations()[0],duration=a.effect.getTiming().duration,scale=el.closest('.n6-exit-world').getBoundingClientRect().width/795,samples=[];
   a.pause();
   for(let t=0;t<=duration;t+=100){a.currentTime=t;const r=el.getBoundingClientRect();samples.push({t,x:r.left/scale,y:r.top/scale});}
   const speed=samples.slice(1).map((s,i)=>({t:s.t,value:(s.x-samples[i].x)*10}));
   return {duration,samples,speed};
  });
  assert.equal(report.duration,12000);
  const steady=report.speed.filter(s=>s.t<=9000).map(s=>s.value),braking=report.speed.filter(s=>s.t>9000).map(s=>s.value);
  assert(Math.max(...steady)<45,'Train rushes into view');
  assert(Math.max(...steady)-Math.min(...steady)<.3,'Steady travel changes speed');
  assert(report.speed.every(s=>s.value>=-.05),'Train reverses or jumps');
  assert(Math.abs(braking[0]-steady.at(-1))<.3,'Braking starts with a velocity jump');
  assert(braking.every((v,i)=>!i||v<=braking[i-1]+.2),'Train accelerates during braking');
  assert(braking.at(-1)<.1,'Train stops abruptly');
  report.summary={steadySpeed:steady.reduce((s,n)=>s+n,0)/steady.length,steadyVariation:Math.max(...steady)-Math.min(...steady),brakingEntryChange:braking[0]-steady.at(-1),lastSpeed:braking.at(-1)};
  await fs.writeFile(path.join(out,'speed-check.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report.summary));
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
