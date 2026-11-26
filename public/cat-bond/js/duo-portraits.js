/* Cat Bond: retired procedural cinematic cats. All character previews use canonical painted sprites. */
(function(){
 'use strict';
 function draw(g,sp,height,p,style,aura,tier=1){
   if(!sp?.storyArt&&!window.CatBondArtworkStatus?.breedsLoaded && !window.CatBondArtworkStatus?.originalLoaded && !(sp?.id==='jiafei'&&window.CatBondArtworkStatus?.jiafeiLoaded))return;
   const scale=Math.max(.2,Number(height||90)/100);
   const pose=['highfive','stars','halo'].includes(style)?'duo-highfive':['eclipse','lake','snare'].includes(style)?'duo-guard':'duo-swipe';
   window.CatArt?.drawCat(g,0,-scale*35,{species:sp,scale,pose,t:Number(p||0)*4,motion:.8,mood:'happy'});
 }
 window.CatBondDuoPortraits={draw,version:'canonical-watercolor-only',get breedCount(){return window.GameData?.SPECIES?.length||16}};
})();
