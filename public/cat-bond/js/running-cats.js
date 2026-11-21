/* Cat Bond movement uses the ORIGINAL 25-breed painted kitten artwork.
   Do not introduce a separate vector-cartoon visual style. The real-kittens.js
   high-resolution illustrated atlas owns cat appearance in every scene.
   This adapter only maps running/gameplay poses to the original renderer;
   kitten position, world collision, gait timing and facing belong to scenes. */
(()=>{
  'use strict';
  function draw(ctx,x,y,options){
    const opts=options||{};
    if(!window.CatArt?.drawCat)return;
    const moving=opts.pose==='run'||opts.pose==='dash'||opts.pose==='pounce';
    // Keep the illustrated breed, eye/face details, proportions and coat intact.
    // Original artist-rendered paws, ears and tail must never be redrawn with
    // primitive circles or triangles. Motion is grounded by world-space paths.
    const pose=opts.pose==='run'||opts.pose==='dash'?'walk':
      opts.pose==='pounce'?'play':opts.pose||'idle';
    const motion=moving?1:opts.motion;
    window.CatArt.drawCat(ctx,x,y,{...opts,pose,motion});
  }
  window.CatMotion={draw,artStyle:'original-illustrated-25-breed'};
})();