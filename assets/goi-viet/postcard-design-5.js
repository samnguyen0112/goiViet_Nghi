/* Preview-5 copy of postcard-design-3.js (P5-03 slice 2): interface text follows the VI/EN choice (GoiVietI18n).
   Other pages keep postcard-design-3.js. */
/* The editable journal and the exported PNG read the same session and opt-ins. */
(() => {
  'use strict';
  const T = (key, fallback, vars) => { const I = window.GoiVietI18n; if (!I) return fallback; const value = I.t(key, vars); return value === key ? fallback : value; };
  function paint() {
    const canvas = document.getElementById('postcardExportCanvas'); if (!canvas) return;
    canvas.width = canvas.width;
    const g = canvas.getContext('2d'), W = canvas.width, H = canvas.height;
    const ink='#194b40', muted='#64715e', gold='#b2945a', red='#a7372d';
    const box=(x,y,w,h,r,fill,stroke)=>{g.beginPath();g.roundRect(x,y,w,h,r);if(fill){g.fillStyle=fill;g.fill();}if(stroke){g.strokeStyle=stroke;g.lineWidth=1;g.stroke();}};
    const text=(value,x,y,size=16,color=ink,weight=400,family='sans')=>{g.fillStyle=color;g.font=canvasFont(size,weight,family);g.fillText(value,x,y);};
    const lines=(value,x,y,width,size=15,color=muted,count=2)=>{g.fillStyle=color;g.font=canvasFont(size,400);return drawPostcardTextLines(g,value,x,y,width,size*1.5,count);};
    g.fillStyle='#fff9ec';g.fillRect(0,0,W,H);
    box(18,18,W-36,H-36,20,null,gold);box(25,25,W-50,H-50,15,null,'#e5d8ba');
    text(T('png.kicker','GÓI VIỆT · KÝ ỨC GIA ĐÌNH'),58,66,12,gold,600);
    text(T('png.title','Lưu bút một chuyến đi'),58,116,38,ink,700,'display');
    const date=new Date().toLocaleDateString(window.GoiVietI18n?.lang()==='en'?'en-GB':'vi-VN');
    text(T('png.players',`${state.playerCount} người cùng chơi   ·   ${date}`,{n:state.playerCount,date}),60,146,14,muted);
    const logo=postcardArtwork.logo;
    // Preview 3: the ivory-ribbon logo needs more room than the solid red mark to stay legible.
    if(logo){const scale=Math.min(220/logo.naturalWidth,92/logo.naturalHeight);g.drawImage(logo,W-282,44,logo.naturalWidth*scale,logo.naturalHeight*scale);}
    else text('Gói Việt',W-245,100,31,red,700,'display');
    text(T('png.stamps',`${state.completedStamps.length} dấu kỷ niệm`,{n:state.completedStamps.length}),W-247,150,15,red,600);
    g.strokeStyle='#d7c49d';g.beginPath();g.moveTo(58,173);g.lineTo(W-58,173);g.stroke();
    const x1=58,x2=558,col=464,top=194,bottom=H-100;
    box(x1,top,col,bottom-top,12,'#f5efdf',null);box(x2,top,col,bottom-top,12,'#f9f3e5',null);
    text('01',x1+20,top+30,13,gold,600);text(T('png.visited','Những ga đã ghé'),x1+53,top+31,21,ink,700,'display');
    text('02',x2+20,top+30,13,gold,600);text(T('png.family','Chuyện nhà mình'),x2+53,top+31,21,ink,700,'display');
    const explored=[...new Set(state.storyOpenedPlaceIds.concat(state.activityCompletedPlaceIds).map(normalizePlaceId))];
    const names=explored.slice(0,6).map(id=>CULTURAL_PLACE_MAP[id]?.short||CULTURAL_PLACE_MAP[id]?.name||id);
    const placeLines=lines(names.length?names.join('  ·  '):T('png.noStations','Chuyến đi đang chờ dấu ấn đầu tiên.'),x1+20,top+65,col-40,14,muted,2);
    const stamps=state.completedStamps.slice(0,5);
    let y=top+80+placeLines*21;
    if(!stamps.length){
      g.setLineDash([3,5]);g.strokeStyle='#c9b789';g.beginPath();g.moveTo(x1+26,y+35);g.lineTo(x1+col-26,y+35);g.stroke();g.setLineDash([]);
      for(let i=0;i<4;i++){g.beginPath();g.arc(x1+32+i*(col-64)/3,y+35,5,0,Math.PI*2);g.fillStyle='#fff9ec';g.fill();g.stroke();}
      text(T('png.emptyTitle','Mỗi ga dừng, một miền thương nhớ.'),x1+22,y+90,18,ink,400,'display');
      lines(T('png.emptyHint','Chơi thẻ hoặc đọc sách để lưu dấu hành trình.'),x1+22,y+122,col-44,14,muted,3);
    }else for(const [i,stamp] of stamps.entries()){
      text(String(i+1).padStart(2,'0'),x1+20,y,12,gold,600);
      g.font=canvasFont(14,600);g.fillStyle=ink;drawPostcardTextLines(g,`${stamp.placeName} · ${stamp.player}`,x1+48,y,col-68,20,1);
      lines(stamp.activity||stamp.topic||'',x1+48,y+21,col-68,12,muted,1);y+=48;
    }
    const memories=state.mentionedPlaces.filter(m=>m.includeInPostcard).slice(0,5);
    if(!memories.length){
      text(T('png.memoryTitle1','Một điều đáng nhớ,'),x2+22,top+104,24,ink,400,'display');
      text(T('png.memoryTitle2','một câu chuyện để dành.'),x2+22,top+137,24,ink,400,'display');
      lines(T('png.memoryHint','Chọn kỷ niệm ở phần lưu bút để đưa vào bưu thiếp.'),x2+22,top+181,col-44,14,muted,2);
      g.strokeStyle='#d5c29a';for(let i=0;i<3;i++){g.beginPath();g.moveTo(x2+22,top+253+i*28);g.lineTo(x2+col-22,top+253+i*28);g.stroke();}
    }else{
      let y=top+69;
      for(const memory of memories){
        g.font=canvasFont(15,600);g.fillStyle=red;drawPostcardTextLines(g,`${memory.name} · ${memory.player}`,x2+20,y,col-40,21,1);
        lines(`“${memory.note||''}”`,x2+20,y+23,col-40,13,muted,2);y+=64;
      }
    }
    // Restrained wave strokes tie the export to the map's jade and gold palette.
    g.strokeStyle='#b7c9ad';g.lineWidth=1.2;g.beginPath();g.moveTo(42,H-53);g.bezierCurveTo(185,H-93,246,H-22,376,H-54);g.bezierCurveTo(555,H-92,658,H-19,800,H-54);g.bezierCurveTo(884,H-76,961,H-76,W-42,H-54);g.stroke();
    text(T('png.footer','Cùng đi qua những miền đất. Cùng giữ lại những điều thương.'),58,H-65,15,ink,400,'display');
    text(T('png.note','Hành trình văn hóa minh họa · Kỷ niệm do gia đình chọn lưu'),58,H-38,10,muted);
  }
  window.GoiVietPostcardDesign=Object.freeze({paint});
})();
