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
// Traced contours of the painted cats' ACTUAL fur, not circular color masks.
// 14 shared painterly compositions plus 9 unique early-stage paintings.
// Coordinates are compact half-resolution paths (xxyy hex pairs).
const TRACED={"B0":[["0017003611331a3a17411d55346736733d784f7a557e637d707570647659734b66395032542e53233b1627151a0d0b0e"],["ab06a50e990f8a1789319d3f97529c569f67ab70c371d36bd865d95bd656df48d93edf2fd42dd420cd14be14b208"]],"B1":[["8a207c1163135f18291b1334003b006a076a1071477254676269675e71557a3a8b2a"],["a723a2338e359641974ea0589c5ba1669f6ea87ccb82d27fda6eea6aee5ff559f54efb43ea38db3dd22fd92ad826c625c22cb82ead24"]],"B2":[["72266b26571c52144312420c3d09280e26172d1e2821252a19320a32003b006b056917752475316b4f646853674b6e416937"],["a132a745a54c9f509d6cb878d078df7ce675e66df554f54dff4aff3ff834ed2cde2cd433d02acc2ac831c32abf2ab43b"]],"B3":[["73266e215a22511d4c253c24312d003400641b6a30773d783f734c7069526a4871427535"],["be28ab39ae4aa853ac56ad5fa86aaa70c37dd379dc67dd5cd54edb4ddb45d334c628"]],"B4":[["42203c202f2b1c2f04460656005700690969127419761e8219881c8f568f5c5696258694c69435c345131"],["a511a11ea32a9339874d8f6e987a98809e83a089a88bb685cb84d36dda73e070e375ec75f56af563ed5ef64df434ec22e822e119ca18c513"]],"B5":[["471245213227313220431e4d26571c5c1d682878307c5e6379727a7775776a7c647e4d7a437f367a3061245c1b"],["ff65ed54e354db46d33fcb3ec535bf35a4459343933d8c3b853d7e4e7f64766c7578948fdc8fdd89e484ff7e"]],"B6":[["5b125612452741282a1b1f211b2b13300f3f004900721e6f3978497650796773696b775b78516b4e68436c376a24"],["e12ad829c930bb2db439a738a83fa441a446ab53a766ae6caf78ce7ee076e35be94de52f"]],"B7":[["5b22571f4c203f173a1730241c21112b0f3c0842004200650d67146e26763476526c5a64564d613f"],["b81aa923a4349e3b9d44a2489f69b270c27cd37cde74df64e360f560fe58ff31f42eec24d81d"]],"B8":[["5b2a4e264a2c342d34341b450c550453005700700b710c7d1482198f578f588866806873606970586c4d61456030"],["f12fe42ddc24d225c91eb3239d2f9a419c4d975591578c6495669b72b67ede7bea72fe6eff49"]],"B9":[["1c1d132612391c47104a0f58165b19652873257a327e3e7d4b8462826d7c6c6374546d4b6e436a3a6137592f5a284c2b482440203020231b"],["ef33e532de2acf29cc25c425b62da12c9c30973f9e6fb47ddc7add74e371e258ed48"]],"B10":[["0d23052c0546004700750c7f23883e8a43845283645b634e5c465c2c5622501e351c331f261e"],["af4aae56a261a267a86ca58cb38fed8ff686ff87ff50e74bda42d034cb34ba45"]],"B11":[["561b451b362b302c2437233e2a542158206425722d783c7a3f7e5b7e79728368815878466e3c662b612a"],["a03d9050905b986baa70b27bc27ed87ce076de68e25edb58dc46d037c335bb3b"]],"B12":[["0c0a071d0026008a0b8f648f66796f6b646466534c2138172d161c07"],["812f8140895282698c6f8c7ab87fd47ddd6dde64da5dde5bde4bc93ab81db01ba72d9d2d9234"]],"B13":[["203b1c4426472c4e1750145618580760067b0c841880328f518f538a6a8e708c8d708e6087588647813d7640612f4a2b2f31"],["9c2b9d3195419c5097639b669f749788a98bb887bf8bbf8fe48fe586f081ee79e975f273fa78ff6cf365f15fe75ecf68dc4eca3bca31b237a534"]],"S0":[["572b4128352c164a0d79197c1d862387278f588e5e816b857c7c84717e52764868416235"],["8c508b5e916e9773a272aa79aa80bc8fea8fff83ff44ec44e83ed93bcb3dbd33a032"]],"S1":[["35003706410d234f2a5d3a655b6760636456714981408631762274096b00"],["ff44f944e631d033bd44b93fad3f9f4c954d94529c669974a176a37dae7eaa81ac89a98fec8feb87f084fa71ff70"]],"S2":[["773672356d2d51253d292d3726382047164f18562656186c197224751d7e1e89388f578f5f7d6a736b546545763d"],["b42bab42aa53a45ca560ae62a36fa67db58ff48ef786ff83ff3bfa35e83ae135d635d430c938c037"]],"S3":[["6d314f3345373f403c3a333f386648795e836383697b7a797c7587769666975b8f598c4b7936"],["b200a60a9e0c9f1690228f34a860b360be69c070c770d57de07bff68ff10f912f80ef00fdd00"]],"S4":[["94528b4382407c33773170395d3a513f4c39353c27431b58517e6f867087699062"],["b114a31fa63292479364a367b071cf70dc66e35be354d845de2bcb1aba1a"]],"S5":[["8b447b366d3a5e364f3831492d512655235a236c4b7d537c57766278666e726876607f608b4c"],["a00ca31a9b2197299b328d468b5690609b5ea76ab868de6be565ff64ff2af526eb1aeb12e000b000"]],"S6":[["5c2f552f4c3f413536383141334b225024592d5a1b5e166316671c6b20832c8f648f6a7a73767a597148643f"],["ff2ff02bdf1fd325bc23b028aa23a122a03193379142874986558f5d8c6b907c967ca286ad87b279b973d079df79e074e573ee76f17cff7a"]],"S7":[["6d385831373b234f225f1a66207f247f348f5a8f6d846f7a696f5e6b5b6b52604f65466f41"],["ab49ab58a661a667ab6ca675b27bb88acb88cf8ce18ce786f387f77dff7bff4de854e148cc41c341ba49"]],"S8":[["885682527d476a49603a583b524132402d4d315e26691e7a1d86228b2f8b328f6d8f6f87817b836c8868"],["b60c942e913c944e8e5788598961946da16da174aa70bc79cb89da84df7de682fe80ff56f64df04cdf3ad226d012c50d"]]};
const tracedCache=new Map();
function actorMasks(index,tier){
 const lv=Math.max(0,Math.min(2,Math.round(Number(tier)||1)-1));
 const panel=Math.max(0,Math.min(20,Math.round(Number(index)||0)));
 const token=panel<3?'S'+(panel*3+lv):'B'+((panel*7+lv*4+Math.floor(panel/3))%14);
 if(tracedCache.has(token))return tracedCache.get(token);
 const contours=TRACED[token]||[];
 const out=[];
 for(const paths of contours){
  const cv=document.createElement('canvas');cv.width=512;cv.height=288;
  const g=cv.getContext('2d',{willReadFrequently:true});
  g.save();g.scale(2,2);g.fillStyle='#fff';g.filter='blur(1.4px)';
  for(const encoded of paths){
   g.beginPath();
   for(let z=0;z<encoded.length;z+=4){
    const x=parseInt(encoded.slice(z,z+2),16),y=parseInt(encoded.slice(z+2,z+4),16);
    if(z===0)g.moveTo(x,y);else g.lineTo(x,y);
   }
   g.closePath();g.fill();
  }
  g.restore();
  const data=g.getImageData(0,0,512,288).data;
  const alpha=new Uint8Array(512*288);
  for(let n=0;n<alpha.length;n++)alpha[n]=data[n*4+3];
  out.push(alpha);
 }
 tracedCache.set(token,out);
 return out;
}
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
 const shapes=actorMasks(index,tier);
 const profiles=[coatA,coatB];
 const means=[0,0],weights=[0,0];
 // Normalize fur shading separately for each painted animal. A dark source
 // kitten can become cream and a white original can become glossy black,
 // without crushing fur grain or applying a gray-background wash.
 for(let y=0;y<288;y+=3)for(let x=0;x<512;x+=3){
  const k=(y*512+x)*4,lum=data[k]*.299+data[k+1]*.587+data[k+2]*.114;
  for(let n=0;n<2;n++){
   if(!profiles[n])continue;
   let w=shapes[n][y*512+x]/255;
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
   let w=shapes[n][y*512+x]/255;
   if(w<.035)continue;
   // Segmented brush paths keep the background, moonlight and flower petals
   // untouched, unlike the old oval fur stains.
   const other=profiles[1-n]?shapes[1-n][y*512+x]/255:0;
   w*=1-other*.58;
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
 get sourceProfiles(){return Object.keys(SP)},maskSourceCount:23,version:'32-traced-watercolor-fur-v2'};
})();
