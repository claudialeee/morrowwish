/* Cat Bond — physical, four-legged world character animation.
   Static 25-breed portraits remain in CatArt for the codex and UI.
   All moving-world characters use this grounded, side-profile actor renderer:
   articulated legs, planted paws, eye/ear facing, tail motion, collision
   contact shadow and distinct coats for every species. No floating cat heads. */
(()=>{
  'use strict';
  function ellipse(ctx,x,y,rx,ry,fill){
    ctx.beginPath();ctx.ellipse(x,y,Math.max(.2,rx),Math.max(.2,ry),0,0,Math.PI*2);
    if(fill){ctx.fillStyle=fill;ctx.fill();}
  }
  function mixColor(hex,white,ratio){
    if(!hex||hex[0]!=='#'||hex.length!==7)return hex||'#d4ac82';
    const n=hex.slice(1);const c=[0,2,4].map(i=>parseInt(n.slice(i,i+2),16));
    const w=white?[255,255,255]:[37,31,41];
    return '#'+c.map((v,i)=>Math.round(v*(1-ratio)+w[i]*ratio).toString(16).padStart(2,'0')).join('');
  }
  function foot(ctx,rootX,phase,pace,body,shade){
    const s=Math.sin(phase),bend=Math.max(0,-Math.cos(phase));
    const dx=s*13*pace,up=bend*10*pace;
    ctx.save();
    ctx.lineJoin='round';ctx.lineCap='round';
    ctx.strokeStyle=shade;ctx.lineWidth=10;
    ctx.beginPath();ctx.moveTo(rootX,-21);
    ctx.quadraticCurveTo(rootX+dx*.35,-9,rootX+dx*.77,-7-up*.45);
    ctx.lineTo(rootX+dx,-2-up);ctx.stroke();
    ctx.strokeStyle=body;ctx.lineWidth=7.2;ctx.stroke();
    ellipse(ctx,rootX+dx+3,-1-up,7,3.6,body);
    ctx.restore();
  }
  function draw(ctx,x,y,opts={}){
    const sp=opts.species||{},pal=window.CatArt?.CAT_PALETTES?.[opts.palette||sp.palette]||
      window.CatArt?.CAT_PALETTES?.orange||
      {body:'#dca66d',belly:'#ffe9c6',mark:'#aa764d',ear:'#edb4a9',point:'#816149'};
    const face=opts.face===-1?-1:1,pose=opts.pose||'idle',mood=opts.mood||'neutral';
    const walking=pose==='walk'||pose==='run'||pose==='dash'||pose==='play'||pose==='pounce';
    const speed=Math.max(0,Math.min(1,opts.motion??(walking?.85:0)));
    const t=opts.t||0,phase=opts.stride!==undefined?opts.stride:t*14;
    const runPace=walking?Math.max(.44,speed):0;
    const hop=(pose==='play'||pose==='pounce')?Math.max(0,Math.sin(t*10))*8:0;
    const bob=walking?(Math.abs(Math.sin(phase))*(1.3+runPace*1.7)):Math.sin(t*1.6)*.5;
    const short=sp.short||opts.short,fluffy=!!(sp.fluffy||opts.fluffy);
    const fold=(sp.ears||opts.ears)==='fold';
    const tuft=(sp.ears||opts.ears)==='tufted';
    const pattern=sp.pattern||opts.pattern||'solid';
    const shade=mixColor(pal.body,false,.19),light=mixColor(pal.body,true,.22);
    const belly=pal.belly||light,mark=pal.mark||shade,point=sp.point||opts.point||pal.point||shade;
    const legShort=short?5:0;
    const sc=(opts.scale||1)*(opts.growth?.scale||1);
    ctx.save();ctx.translate(x,y);ctx.scale(face*sc,sc);
    // The contact shadow is planted on the ground (does not bob with the cat).
    ellipse(ctx,0,3,35,6,'rgba(37,38,37,.17)');
    if(walking&&runPace>.65){
      ctx.save();ctx.globalAlpha=.19;
      for(let i=1;i<=3;i++)ellipse(ctx,-38-i*8,3,i*3.2,2.2,'#e8e2cf');
      ctx.restore();
    }
    ctx.translate(0,-bob-hop);
    if(opts.growth?.aura){
      ctx.globalAlpha=.14;
      ellipse(ctx,0,-27,53,42,opts.growth.aura);
      ctx.globalAlpha=1;
    }
    // Long, tapering tail with its tip behind the body. Never a detached emoji.
    const tailWag=Math.sin(t*(walking?7:2.4))*(walking?6:10);
    ctx.lineCap='round';ctx.lineJoin='round';
    ctx.strokeStyle=shade;ctx.lineWidth=13;
    ctx.beginPath();ctx.moveTo(-29,-33);
    ctx.bezierCurveTo(-49,-43,-53,-53+tailWag,-61,-51+tailWag);
    ctx.stroke();ctx.strokeStyle=pal.body;ctx.lineWidth=9;ctx.stroke();
    ctx.strokeStyle=light;ctx.lineWidth=3;ctx.stroke();
    // Far pair of paws: shaded to establish depth, swing opposite the near paws.
    ctx.save();ctx.globalAlpha=.8;
    foot(ctx,-23,phase+Math.PI,runPace,mixColor(pal.body,false,.13),shade);
    foot(ctx,17,phase,runPace,mixColor(pal.body,false,.12),shade);
    ctx.restore();
    // Four-legged torso, broad ribcage, tapered rump.
    const body=ctx.createLinearGradient(-18,-46,9,-14);
    body.addColorStop(0,light);body.addColorStop(.6,pal.body);body.addColorStop(1,shade);
    ellipse(ctx,-8,-30,32+(fluffy?3:0),19+(fluffy?3:0),shade);
    ellipse(ctx,-8,-31,31+(fluffy?3:0),18+(fluffy?3:0),body);
    ellipse(ctx,-2,-21,20,8,belly);
    // Full-world coat variation; not all 25 cats share a skin or silhouette.
    ctx.save();ctx.beginPath();ctx.ellipse(-8,-31,31+(fluffy?3:0),18+(fluffy?3:0),0,0,Math.PI*2);ctx.clip();
    if(pattern==='tabby'||pattern==='silver'){
      ctx.strokeStyle=mark;ctx.lineWidth=3;ctx.globalAlpha=.48;
      for(let i=0;i<4;i++){
        const u=-30+i*12;
        ctx.beginPath();ctx.moveTo(u,-50);ctx.quadraticCurveTo(u+10,-36,u+4,-25);ctx.stroke();
      }
    }else if(pattern==='spotted'){
      ctx.fillStyle=mark;ctx.globalAlpha=.57;
      for(const [sx,sy] of [[-29,-36],[-14,-42],[2,-32],[-19,-25],[10,-40],[-35,-29]])
        ellipse(ctx,sx,sy,4.2,2.8,mark);
    }else if(pattern==='calico'){
      ellipse(ctx,-24,-38,15,9,mark);
      ellipse(ctx,5,-32,11,8,'#a58f7f');
    }else if(pattern==='bicolor'||pattern==='tuxedo'){
      ellipse(ctx,6,-21,16,9,belly);
      if(pattern==='bicolor')ellipse(ctx,-24,-29,10,9,belly);
    }else if(pattern==='pointed'){
      ellipse(ctx,-29,-29,12,17,point);
    }
    ctx.restore();
    // Near limbs. Their alternate plant/lift positions make running unmistakable.
    ctx.save();ctx.translate(0,legShort);
    foot(ctx,-25,phase,runPace,pal.body,shade);
    foot(ctx,17,phase+Math.PI,runPace,pal.body,shade);
    ctx.restore();
    // Neck ruff and shoulders blend physically into the head.
    ellipse(ctx,15,-36,15,17,fluffy?belly:pal.body);
    const headTilt=walking?Math.sin(phase)*.055:Math.sin(t*1.8)*.035;
    ctx.save();ctx.translate(27,-43);ctx.rotate(headTilt);
    // Triangle ears behind the forehead (folded ears flatten to small rounded tips).
    for(const ex of [-7,10]){
      ctx.fillStyle=shade;ctx.beginPath();
      ctx.moveTo(ex-6,-9);ctx.lineTo(ex+(fold?0:1),fold?-15:-26+(tuft?-4:0));
      ctx.lineTo(ex+8,-10);ctx.closePath();ctx.fill();
      ctx.fillStyle=pal.ear||'#ecb6a9';ctx.beginPath();
      ctx.moveTo(ex-2,-12);ctx.lineTo(ex+(fold?0:1),fold?-14:-22);
      ctx.lineTo(ex+4,-12);ctx.closePath();ctx.fill();
    }
    const faceGrad=ctx.createRadialGradient(-6,-10,2,2,1,23);
    faceGrad.addColorStop(0,mixColor(pal.body,true,.38));
    faceGrad.addColorStop(.7,pal.body);faceGrad.addColorStop(1,shade);
    ellipse(ctx,0,0,18+(fluffy?2:0),17+(fluffy?2:0),faceGrad);
    // Distinct pointed markings / cheek fluff; one visible side eye for a side profile.
    if(pattern==='pointed')ellipse(ctx,8,2,11,10,point);
    ellipse(ctx,9,9,10,6,belly);
    if(fluffy){
      ctx.fillStyle=pal.body;ctx.beginPath();
      ctx.moveTo(-13,6);ctx.lineTo(-23,9);ctx.lineTo(-10,13);ctx.closePath();ctx.fill();
    }
    if(mood==='sleepy'){
      ctx.strokeStyle=shade;ctx.lineWidth=2.2;ctx.beginPath();ctx.arc(5,0,4,.15,Math.PI-.2);ctx.stroke();
    }else{
      ellipse(ctx,5,0,4.7,5.5,'#fefbf1');
      ellipse(ctx,7,0,2.1,4,sp.eyeColor||'#647a56');
      ellipse(ctx,7.7,-1.5,.85,1.5,'#fff');
      if(mood==='sulky'){
        ctx.strokeStyle=shade;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(1,-7);ctx.lineTo(11,-5);ctx.stroke();
      }
    }
    ctx.fillStyle='#b47781';ctx.beginPath();
    ctx.moveTo(15,7);ctx.lineTo(20,8);ctx.lineTo(16,11);ctx.closePath();ctx.fill();
    ctx.strokeStyle=mixColor(pal.body,false,.42);ctx.lineWidth=1;
    for(let i=-1;i<=1;i++){
      ctx.beginPath();ctx.moveTo(12,10+i*.9);
      ctx.quadraticCurveTo(20,9+i*4,26,9+i*6);ctx.stroke();
    }
    ctx.restore();
    // A small collar is physically attached to the neck; not a floating star icon.
    if(opts.growth?.gem){
      ellipse(ctx,17,-31,4,4,opts.growth.gemColor||'#e4b969');
      ellipse(ctx,16,-32,1.3,1.3,'#fff9d9');
    }
    ctx.restore();
  }
  window.CatMotion={draw};
})();