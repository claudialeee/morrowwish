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
    // The original 25 painted breeds are now cut out into real animated
    // front paws and a grounded torso, not rendered as a moving flat sticker.
    const motion=moving?1:opts.motion;
    const gait=moving?'sprint':'walk';
    // The 25 original watercolor kittens must stay SMALL relative to the game.
    // Restore their earlier footprint instead of enlarging them across every
    // world scene. This applies to yard, exploration, combat and duos.
    const sourceScale=Math.max(.15,Number(opts.scale)||1);
    const actualScale=Math.min(.86,sourceScale*.70);
    // CatArt uses the feet/shadow at y+33*scale. When scaling a painted
    // character down, place its baseline lower to keep paws planted.
    const growthScale=opts.growth?.scale||1;
    const plantedY=y+33*(sourceScale-actualScale)*growthScale;
    window.CatArt.drawCat(ctx,x,plantedY,{
      ...opts,scale:actualScale,pose,motion,gait
    });
  }
  window.CatMotion={
    draw,artStyle:'original-illustrated-25-breed',
    scaleRatio:.70,maxWorldScale:.86,grounded:true
  };
})();