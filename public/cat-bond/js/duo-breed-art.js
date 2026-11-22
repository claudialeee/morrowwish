/* Cat Bond premium paint: make the ACTUAL two painted cats match the
 * player's selected breeds/coats. Do not paste yard cats or tiny portraits.
 * 32 hand-tuned fur profiles, 63 non-destructive watercolor figure zones.
 * Each actor is recolored in its own original high-resolution tableau.
 */
(function(){'use strict';
const root=window;
const SP={
 tangyuan:['#dc9457','#fae1b4','#a75d34','tabby'],
 doudou:['#987353','#eed2a8','#584333','tabby'],
 xiaohui:['#c1cad9','#f3f6fc','#70849b','silver'],
 moqiu:['#333342','#77778c','#1c1b28','solid'],
 nainai:['#f4f1ec','#fffefa','#c1bccc','solid'],
 nietu:['#f0d7a9','#fff6d9','#bc9c71','solid'],
 niuniu:['#323542','#fff7ed','#181b28','tuxedo'],
 sanhua:['#f7e7d0','#fffaf2','#8e6959','calico'],
 lixiao:['#36353e','#fff5eb','#181720','tuxedo'],
 lanbao:['#91a4bb','#d7e2ee','#536b81','solid'],
 dundun:['#d1d1ca','#fffdf4','#969989','silver'],
 yunduo:['#f0e4d8','#fffaf2','#998578','pointed'],
 zherdd:['#ecc69e','#faf0d3','#b28c73','solid'],
 qisi:['#e5a46b','#fff0dd','#b6774d','bicolor'],
 duanduan:['#e5b97b','#fff0d4','#b98b50','tabby'],
 jinjc:['#d6b66a','#faf0bf','#aa864b','silver'],
 xianluo:['#ebdbb8','#fff8e6','#55433b','pointed'],
 yinghua:['#f5dfe3','#fff7f1','#c7a5b3','bicolor'],
 senlin:['#a28163','#eee0c2','#644c3d','tabby'],
 youling:['#81759e','#ded6ed','#554569','solid'],
 nuowei:['#ad988b','#efdfd0','#74635e','tabby'],
 baomao:['#d4a365','#f8ddb0','#82513b','spotted'],
 jinwu:['#e7a55c','#fff0b7','#b66c3d','tabby'],
 yuelian:['#d8e2f1','#fffafd','#889bb7','bicolor'],
 xingchen:['#4c466f','#c8b8e2','#282a4c','spotted'],
 abi:['#cba06d','#f6d2a5','#9b7051','ticked'],
 meidu:['#b8bfcd','#e9edf5','#6e7e98','silver'],
 xuewa:['#e7dbca','#fff9ee','#75636c','snowshoe'],
 mengmai:['#292833','#70717e','#11121c','solid'],
 fanmao:['#f3e9da','#fffefd','#d09c79','van'],
 bosi:['#ebd5b8','#fff8e7','#bfa08b','solid'],
 wumao:['#dfa99c','#f7d2be','#b47c78','skin']
};
const BASE=[
 [[[105,103,125,83],[167,176,165,84],[68,68,59,65]],[[366,98,122,82],[374,190,146,83]]],
 [[[167,92,126,85],[112,178,163,73]],[[396,142,112,91],[384,212,124,68]]],
 [[[167,91,120,78],[113,171,155,78]],[[396,145,112,89],[389,212,122,66]]],
 [[[187,105,110,87],[106,166,151,85]],[[395,151,103,89],[386,210,120,63]]],
 [[[129,144,114,89],[121,216,137,72]],[[366,114,129,84],[372,196,122,80]]],
 [[[179,116,121,105],[128,195,140,78]],[[377,171,118,88],[373,229,137,60]]],
 [[[133,118,113,86],[121,203,153,74]],[[397,137,100,93],[402,220,110,60]]],
 [[[146,115,112,91],[119,190,146,82]],[[398,132,112,97],[402,218,105,65]]],
 [[[147,144,110,94],[113,218,149,69]],[[390,104,111,87],[390,181,122,83]]],
 [[[148,131,116,102],[142,210,145,75]],[[386,136,113,96],[379,219,128,62]]],
 [[[133,106,120,90],[133,189,148,83]],[[407,174,103,86],[410,237,125,50]]],
 [[[170,137,97,82],[138,214,148,66]],[[385,157,103,92],[402,225,112,61]]],
 [[[75,126,111,107],[127,225,148,74]],[[331,135,121,111],[377,219,142,69]]],
 [[[155,141,112,95],[145,219,144,65]],[[376,156,106,103],[398,236,116,53]]]
];
const SPECIAL=[
 [[[126,152,126,107],[108,219,146,65]],[[393,166,121,106],[401,232,129,58]]],
 [[[157,100,108,105],[133,153,140,89]],[[402,176,110,91],[406,227,127,66]]],
 [[[134,132,104,106],[145,222,140,61]],[[402,163,111,103],[417,241,127,46]]],
 [[[175,190,157,84],[215,133,86,78]],[[410,90,116,93],[392,160,129,86]]],
 [[[183,195,163,78],[210,147,88,75]],[[391,104,123,93],[383,180,118,89]]],
 [[[165,199,160,83],[211,152,83,80]],[[401,101,110,102],[393,177,123,82]]],
 [[[148,172,118,106],[141,220,157,66]],[[388,120,123,118],[403,202,129,73]]],
 [[[147,154,124,102],[145,213,162,70]],[[410,173,101,90],[399,226,133,56]]],
 [[[139,173,125,103],[158,224,148,63]],[[385,133,121,103],[400,215,124,65]]]
];
const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
for(const [id,p] of Object.entries(SP)){p[0]=rgb(p[0]);p[1]=rgb(p[1]);p[2]=rgb(p[2]);}
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=(a,b,x)=>{const v=clamp((x-a)/(b-a));return v*v*(3-2*v)};
function species(cat){
 const raw=typeof cat?.species==='string'?cat.species:cat?.species?.id||cat?.id;
 return raw&&Object.hasOwn(SP,raw)?raw:null;
}
function coat(cat){const id=species(cat);return id?{id,base:SP[id][0],light:SP[id][1],dark:SP[id][2],pattern:SP[id][3]}:null;}
function zonesFor(index,tier){
 const panel=Math.max(0,Math.min(20,Math.round(Number(index)||0)));
 const stage=Math.max(1,Math.min(3,Math.round(Number(tier)||1)))-1;
 return panel<3?SPECIAL[panel*3+stage]:BASE[(panel*7+stage*4+Math.floor(panel/3))%14];
}
const colorSeed=(x,y)=>Math.sin(x*12.9898+y*78.233)*43758.5453;
function zoneMask(z,x,y){
 let mask=0;
 for(const e of z){
  const dx=(x-e[0])/e[2],dy=(y-e[1])/e[3],d=dx*dx+dy*dy;
  const w=1-smooth(.39,1.08,d);
  if(w>mask)mask=w;
 }
 return mask;
}
function toneFor(profile,x,y,side){
 const kind=profile.pattern;
 const base=profile.base,light=profile.light,dark=profile.dark;
 let ink=base;
 // Illustrative coat markings live INSIDE the existing painted fur:
 // they are not pasted stickers or extra characters on top of the scene.
 const wave=Math.sin(x*.10+Math.sin(y*.037)*1.5)+Math.sin(y*.14+x*.026)*.30;
 if(kind==='tabby'||kind==='silver')ink=wave>1.0?dark:base;
 else if(kind==='spotted'){
  const n=Math.sin(x*.135+Math.sin(y*.063)*2.7)*Math.cos(y*.13);
  ink=n>.67?dark:base;
 }else if(kind==='ticked'){
  ink=(Math.sin(x*.30+y*.45)>.67)?dark:base;
 }else if(kind==='calico'){
  const noise=Math.sin(x*.053+y*.021)+Math.cos(y*.047-x*.041);
  ink=noise>.80?dark:noise<-.32?[214,143,96]:light;
 }else if(kind==='tuxedo'){
  // White bib and belly: still preserve the complete painterly cat.
  const center=side===0?165:368;
  const bib=clamp(1-Math.abs(x-center)/125)*smooth(150,215,y);
  if(bib>.48)ink=light;
 }else if(kind==='van'){
  ink=y>122?light:base;
 }else if(kind==='snowshoe'){
  ink=y>189?light:base;
 }else if(kind==='bicolor'){
  const noise=Math.sin(x*.046)+Math.cos(y*.048);
  ink=noise<.60?light:base;
 }else if(kind==='pointed'){
  // Darker face/ear points on an otherwise pale Siamese/Ragdoll coat.
  const cx=side===0?150:379;
  const face=Math.hypot((x-cx)/100,(y-105)/76);
  ink=face<.62?dark:base;
 }else if(kind==='skin'){
  ink=base; // Peach skin, without artificial black stripes.
 }
 return ink;
}
function paint(ctx,key,tier,a,b,keys){
 const coatA=coat(a),coatB=coat(b);
 if(!coatA&&!coatB)return false;
 const index=keys.indexOf(key);
 if(index<0)return false;
 const img=ctx.getImageData(0,0,512,288),data=img.data;
 const zones=zonesFor(index,tier);
 const profiles=[coatA,coatB];
 const means=[0,0],weights=[0,0];
 // Normalize fur shading separately for each painted animal. A dark source
 // kitten can become cream and a white original can become glossy black,
 // without crushing fur grain or applying a gray-background wash.
 for(let y=0;y<288;y+=3)for(let x=0;x<512;x+=3){
  const k=(y*512+x)*4,lum=data[k]*.299+data[k+1]*.587+data[k+2]*.114;
  for(let n=0;n<2;n++){
   if(!profiles[n])continue;
   let w=zoneMask(zones[n],x,y);
   if(n===0)w*=1-smooth(225,330,x);else w*=smooth(174,285,x);
   weights[n]+=w;means[n]+=w*lum;
  }
 }
 for(let n=0;n<2;n++)means[n]/=Math.max(weights[n],1);
 for(let y=0;y<288;y++)for(let x=0;x<512;x++){
  const i=(y*512+x)*4;const src=[data[i],data[i+1],data[i+2]];
  const lum=src[0]*.299+src[1]*.587+src[2]*.114;
  const max=Math.max(...src),min=Math.min(...src);
  // Preserve saturated accessories, magical ribbons, flowers and glowing
  // eye/pendant details instead of repainting them as fur.
  const saturation=(max-min)/Math.max(1,max);
  const violet=src[0]>src[1]*1.24&&src[2]>src[1]*1.25;
  const blue=src[2]>src[0]*1.18&&src[2]>src[1]*1.15;
  const magic=lum>208&&saturation>.38;
  const nonfur=(violet||blue||magic)?0.25:saturation>.68?.45:1;
  for(let n=0;n<2;n++){
   const prof=profiles[n];if(!prof)continue;
   let w=zoneMask(zones[n],x,y);
   if(n===0)w*=1-smooth(225,330,x);else w*=smooth(174,285,x);
   if(w<.035)continue;
   // No double-color staining in the overlap between the two cats.
   const other=profiles[1-n]?zoneMask(zones[1-n],x,y):0;
   w*=1-.78*other*(n===0?smooth(170,290,x):1-smooth(170,290,x));
   const k=clamp(w*.89*nonfur);
   if(k<.012)continue;
   const ink=toneFor(prof,x,y,n);
   const relief=clamp(.86+(lum-means[n])*.007);
   const factor=.72+relief*.35;
   for(let c=0;c<3;c++){
    const val=ink[c]*factor+(src[c]-lum)*.17;
    data[i+c]=Math.round(Math.max(0,Math.min(255,data[i+c]*(1-k)+val*k)));
   }
  }
 }
 ctx.putImageData(img,0,0);
 return true;
}
root.CatBondDuoBreedArt={paint,coat,species,zonesFor,breedCount:Object.keys(SP).length,
 get sourceProfiles(){return Object.keys(SP)},version:'32-paint-matched-breeds-v1'};
})();
