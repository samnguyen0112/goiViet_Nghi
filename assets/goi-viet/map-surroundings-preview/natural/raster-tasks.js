/* Preview-only raster queue. The exact existing pixel kernels run in a worker;
   missing textures never block pointer/camera events. Blob workers also support file URLs. */
(() => {
  'use strict';
  let worker=null,failed=false,serial=0,scheduled=0;
  const jobs=new Map(),pending=new Map(),definitions=new Map(),listeners=new Set();
  function workerMain(){
    const kernels=new Map();
    self.onmessage=e=>{
      const m=e.data;
      try{
        if(m.type==='define'){kernels.set(m.name,new Function('data',m.factory)(m.data));return;}
        const pixels=kernels.get(m.name)(m.args);
        self.postMessage({id:m.id,width:pixels.width,height:pixels.height,buffer:pixels.buffer},[pixels.buffer]);
      }catch(error){self.postMessage({id:m.id,error:error.message});}
    };
  }
  function notify(){
    if(scheduled)return;
    scheduled=setTimeout(()=>{scheduled=0;for(const fn of listeners)fn();if(document.getElementById('introScreen')?.classList.contains('intro-hidden'))requestMapRender(2);},160);
  }
  function start(){
    if(worker||failed)return worker;
    try{
      const url=URL.createObjectURL(new Blob(['('+workerMain.toString()+')()'],{type:'application/javascript'}));worker=new Worker(url);URL.revokeObjectURL(url);
      worker.onmessage=e=>{const m=e.data,job=jobs.get(m.id);if(!job)return;jobs.delete(m.id);pending.delete(job.key);if(m.error){failed=true;job.reject(new Error(m.error));return;}
        const canvas=document.createElement('canvas');canvas.width=m.width;canvas.height=m.height;canvas.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(m.buffer),m.width,m.height),0,0);job.resolve(canvas);notify();};
      worker.onerror=()=>{failed=true;worker.terminate();worker=null;for(const job of jobs.values())job.reject(new Error('Raster worker unavailable'));jobs.clear();pending.clear();notify();};
      for(const [name,d]of definitions)worker.postMessage({type:'define',name,...d});
    }catch(error){failed=true;}
    return worker;
  }
  function define(name,factory,data){const d={factory,data};definitions.set(name,d);if(worker)worker.postMessage({type:'define',name,...d});else start();}
  function build(name,key,args){const idKey=name+':'+key;if(pending.has(idKey))return pending.get(idKey);const w=start();if(!w)return Promise.reject(new Error('Raster worker unavailable'));
    if(jobs.size>=384)return Promise.reject(new Error('Raster queue full; retry next draw'));
    const id=++serial,promise=new Promise((resolve,reject)=>jobs.set(id,{key:idKey,resolve,reject}));pending.set(idKey,promise);w.postMessage({type:'build',name,id,args});return promise;
  }
  window.GoiVietRasterTasks=Object.freeze({define,build,onUpdate:fn=>listeners.add(fn),inspect:()=>({available:!!worker&&!failed,failed,pending:jobs.size,completed:serial-jobs.size})});
})();
