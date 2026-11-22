/* Cat Bond premium art: 32 actual high-resolution illustrated cat breeds.
 * Illustrated spritesheet has 8 columns x 4 rows, matching the canonical
 * order of GameData.SPECIES. Cats are whole watercolor subjects with natural
 * fur markings/ears/eyes; not procedural stickers or fur-paint masks.
 * The separate 21x3 scenic atlas has NO baked fixed cats, so there cannot be
 * ghost doubles or big black patches from unsafe texture recoloring.
 */
(function(){
'use strict';
const SPECIES=[
 'tangyuan','doudou','xiaohui','moqiu','nainai','nietu','niuniu','sanhua',
 'lixiao','lanbao','dundun','yunduo','zherdd','qisi','duanduan','jinjc',
 'xianluo','yinghua','senlin','youling','nuowei','baomao','jinwu','yuelian',
 'xingchen','abi','meidu','xuewa','mengmai','fanmao','bosi','wumao'
];
const byId=Object.fromEntries(SPECIES.map((id,i)=>[id,i]));
const urlBase=window.CatBondDuoAssetBase||'assets/';
const sprite=new Image(),scene=new Image();
sprite.decoding='async';scene.decoding='async';
let portraitReady=false,sceneReady=false,failed=false;
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const ease=x=>{x=clamp(x);return x*x*(3-2*x)};
function notify(){
 if(portraitReady&&sceneReady){
   window.dispatchEvent(new Event('cat-bond-breed-art-ready'));
 }else if(failed){
   window.dispatchEvent(new Event('cat-bond-breed-art-error'));
 }
}
sprite.onload=()=>{portraitReady=sprite.naturalWidth===1774&&sprite.naturalHeight===887;
 if(!portraitReady)failed=true;notify()};
scene.onload=()=>{sceneReady=scene.naturalWidth===3584&&scene.naturalHeight===2592;
 if(!sceneReady)failed=true;notify()};
sprite.onerror=()=>{failed=true;notify()};
scene.onerror=()=>{failed=true;notify()};
sprite.src=urlBase+'duo-watercolor-32-actors-v1.webp?v=32-original-breeds-20261122';
scene.src=urlBase+'duo-stage-clean-21x3-v2.webp?v=no-ghosts-or-legacy-titles-20261122';
function species(cat){
 const id=typeof cat?.species==='string'?cat.species:cat?.species?.id||cat?.id;
 return Object.hasOwn(byId,id||'')?id:null;
}
function sceneRect(key,tier,orderedKeys){
 const i=orderedKeys.indexOf(key);if(i<0)return null;
 const lv=clamp(Math.round(Number(tier)||1),1,3);
 return {x:i%7*512,y:(Math.floor(i/7)*3+(lv-1))*288,w:512,h:288};
}
function paintScene(ctx,key,tier,orderedKeys){
 if(!sceneReady)return false;
 const src=sceneRect(key,tier,orderedKeys);if(!src)return false;
 ctx.drawImage(scene,src.x,src.y,src.w,src.h,0,0,512,288);
 return true;
}
function drawActor(g,sp,x,y,height,rotation,flip,opacity=1){
 if(!portraitReady)return false;
 const idx=byId[sp];if(idx===undefined)return false;
 const cw=sprite.naturalWidth/8,ch=sprite.naturalHeight/4;
 const sx=idx%8*cw,sy=Math.floor(idx/8)*ch;
 const side=height*cw/ch;
 g.save();g.globalAlpha*=opacity;
 g.translate(x,y);g.rotate(rotation);
 // Small transparent ambient shadow anchors real illustrated cats in
 // their scene. No solid panel or grey silhouette is ever inserted.
 g.save();g.globalAlpha*=.15;g.fillStyle='#69536b';
 g.beginPath();g.ellipse(0,-4,side*.34,height*.035,0,0,Math.PI*2);g.fill();g.restore();
 g.scale(flip?-1:1,1);g.imageSmoothingEnabled=true;
 g.imageSmoothingQuality='high';
 // One intact transparent cat including its ears, paws and tail.
 g.drawImage(sprite,sx+1.4,sy+1.4,cw-2.8,ch-2.8,
   -side*.5,-height,side,height);
 g.restore();
 return true;
}
function draw(g,W,H,cats,key,p,tier=1){
 if(!portraitReady)return false;
 const a=species(cats?.[0]),b=species(cats?.[1]);
 // Never substitute a random or fixed breed. The game must supply the
 // two actual player cats; the gallery supplies its two chosen species.
 if(!a||!b)return false;
 const lv=clamp(Math.round(Number(tier)||1),1,3);
 const t=clamp(p),pulse=Math.sin(Math.PI*clamp(t));
 const poses=[];
 for(let n=0;n<2;n++){
   const side=n===0?-1:1;
   let x=W*(n===0?.31:.69),y=H*.90,height=H*.76;
   let angle=side*.035,flip=n===1;
   if(lv===1){
     const approach=ease((t-.06)/.28);
     x+=-side*(1-approach)*W*.10;
     y-=H*.035*pulse;
     angle+=side*.045*pulse;
   }else if(lv===2){
     // Two separate diagonal strikes: A rushes across first, B answers.
     const first=ease((t-.10)/.26),second=ease((t-.39)/.25);
     x+=n===0?W*.095*first:-W*.085*second;
     y-=H*(n===0?.12*Math.sin(Math.PI*first):
       .13*Math.sin(Math.PI*second));
     angle+=side*(.19*Math.sin(Math.PI*(n===0?first:second)));
     height*=n===0?1.01:1.03;
   }else{
     // Visible partnership: guard, vault, then converge for finisher.
     const shield=ease((t-.06)/.22);
     const vault=ease((t-.26)/.34);
     const finish=ease((t-.58)/.26);
     x+=n===0?W*.035*shield+W*.025*finish:
       -W*.052*vault-W*.016*finish;
     y-=H*(n===0?.045*Math.sin(Math.PI*shield):
       .19*Math.sin(Math.PI*vault));
     height*=n===0?.86:1.10;
     angle+=side*(n===0?.055*shield:.23*Math.sin(Math.PI*vault));
   }
   // Keep every ear, paw and tail in bounds after battle camera rotation.
   const half=height*.52;
   x=clamp(x,half+W*.015,W-half-W*.015);
   y=clamp(y,height*.99,H*.95);
   poses.push({species:n===0?a:b,x,y,height,angle,flip});
 }
 // Guarding partner appears behind the striking partner in tier 90.
 for(const pose of poses)
   drawActor(g,pose.species,pose.x,pose.y,pose.height,pose.angle,pose.flip);
 return true;
}
window.CatBondDuoBreedActors={
 draw,paintScene,sceneRect,species,breedIds:SPECIES,breedCount:SPECIES.length,
 get ready(){return portraitReady&&sceneReady},
 get failed(){return failed},
 get catSheetReady(){return portraitReady},
 get cleanSceneReady(){return sceneReady},
 get catSource(){return sprite.src},
 get sceneSource(){return scene.src},
 version:'true-watercolor-32-breeds-no-overlay-v1'
};
})();