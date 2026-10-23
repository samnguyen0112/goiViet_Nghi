// Blend the painted crest repair into the native far-right mountain only.
// Premultiplied alpha interpolation removes the old sky residue and spires,
// instead of retaining them underneath an ordinary source-over composite.
const path=require('node:path');
const sharp=require('C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
module.exports=async function repairRidge(root){
  const base=path.join(root,'assets/goi-viet');
  const {data:original,info}=await sharp(path.join(base,'homepage-layered/mountains-far-right.webp')).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const patch=await sharp(path.join(base,'homepage-balanced-3/right-ridge-painted.png')).resize(900,440,{fit:'fill'}).ensureAlpha().raw().toBuffer();
  const result=Buffer.from(original);
  for(let y=0;y<440;y++)for(let x=0;x<900;x++){
    const weight=smooth(x/100)*(1-smooth((y-260)/180));
    if(!weight)continue;
    const at=(y*info.width+x+900)*4,from=(y*900+x)*4;
    const oldA=original[at+3]*(1-weight),newA=patch[from+3]*weight,alpha=oldA+newA;
    for(let c=0;c<3;c++)result[at+c]=alpha?(original[at+c]*oldA+patch[from+c]*newA)/alpha:0;
    result[at+3]=Math.round(alpha);
  }
  const full=await sharp(result,{raw:info}).png().toBuffer();
  return {'4k':full,'2k':await sharp(full).resize(900,594).png().toBuffer()};
};
