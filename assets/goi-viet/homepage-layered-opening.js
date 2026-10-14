// One layered scene: blank paper, continuous terrain through mist, fixed bridge dissolve.
// Logo, copy, actions and music retain the existing DOM timing and controller.
(() => {
  const clamp=v=>Math.max(0,Math.min(1,v));
  const progress=(time,start,end)=>{const p=clamp((time*12/window.GoiVietHomeOpeningConfig.duration-start)/(end-start));return p*p*(3-2*p);};
  window.GoiVietHomeOpening={progress,async create(canvas){
    const duration=window.GoiVietHomeOpeningConfig.duration,native=await window.GoiVietHomeScene.create(canvas);
    const metadata={...native.metadata,introDuration:duration,continuous:true};let frames=0;
    const phase=time=>{
      const t=time*12/duration;
      if(t<.8)return 'Nền giấy · chờ cảnh mở ra';
      if(t<3.2)return 'Núi và mây tiến vào từ hai phía';
      if(t<5.3)return 'Cây, cò và lá mang sức sống vào cảnh';
      if(t<7.8)return 'Gói Việt và câu chuyện hành trình';
      if(t<12)return 'Ba miền và lời mời cùng khám phá';
      return 'Cảnh hoàn chỉnh · chuyển động tiếp tục';
    };
    const renderFrame=time=>{frames++;native.renderFrame(time,{introDuration:duration});};
    const setResolution=(width,height)=>{native.setResolution(width,height);metadata.width=native.metadata.width;metadata.height=native.metadata.height;};
    renderFrame(0);
    return {renderFrame,setResolution,metadata,phase,native,get frames(){return frames;},get mode(){return native.mode;},get cachedBirdFrames(){return native.cachedBirdFrames;}};
  }};
})();
