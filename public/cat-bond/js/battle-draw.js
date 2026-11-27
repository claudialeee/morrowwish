// Auto-extracted from battle.js (Code-split Phase, 2026-11-27 owner directive).
// Method bodies unchanged; attached to CaptureBattle.prototype at script load.
// index.html loads this AFTER battle.js so the prototype exists.
(function(){
  if (!window.Battle || !window.Battle.CaptureBattle) {
    console.error('battle-draw.js: CaptureBattle not loaded first'); return;
  }
  const P = window.Battle.CaptureBattle.prototype;

P.drawDuoField = function(ctx){
    const v=this.duoField;if(!v||v.remaining<=0)return;
    const opacity=Math.min(1,v.age/.45,v.remaining/.8)*.5;
    const rad=v.radius+4*Math.sin(v.age*2.3);
    ctx.save();ctx.translate(v.x,v.y);ctx.globalAlpha=opacity;
    for(let side=0;side<2;side++){
      const c=side?v.second:v.first;
      const a=side?.19:-.24;
      ctx.save();ctx.rotate(v.age*a);
      ctx.strokeStyle=c;ctx.lineWidth=side?2.4:3.3;ctx.setLineDash(side?[6,12]:[16,12]);
      ctx.beginPath();ctx.ellipse(0,0,rad-side*17,(rad-side*17)*.64,0,0,Math.PI*2);ctx.stroke();ctx.restore();
      ctx.setLineDash([]);
      for(let i=0;i<6;i++){
        const ang=i*Math.PI/3+v.age*(side?.38:-.32);
        const rr=rad*(side?.7:.94);
        ctx.save();ctx.translate(Math.cos(ang)*rr,Math.sin(ang)*rr*.64);ctx.rotate(ang);
        ctx.strokeStyle=c;ctx.fillStyle=c;ctx.lineWidth=2;ctx.beginPath();
        const el=v.elements[side];
        if(el==='grass'){ctx.ellipse(0,0,9,3.5,Math.PI/4,0,Math.PI*2);ctx.stroke();}
        else if(el==='water'){ctx.moveTo(-10,2);ctx.bezierCurveTo(-5,-7,0,8,10,-2);ctx.stroke();}
        else if(el==='elec'){ctx.moveTo(-5,-9);ctx.lineTo(2,-2);ctx.lineTo(-2,3);ctx.lineTo(6,8);ctx.stroke();}
        else if(el==='fire'){ctx.moveTo(-5,6);ctx.quadraticCurveTo(-9,-3,2,-10);ctx.quadraticCurveTo(1,-2,7,5);ctx.stroke();}
        else if(el==='dark'){ctx.arc(0,0,7,-1.2,1.2);ctx.stroke();}
        else{ctx.moveTo(0,-9);ctx.lineTo(3,0);ctx.lineTo(0,9);ctx.lineTo(-3,0);ctx.closePath();ctx.stroke();}
        ctx.restore();
      }
    }
    ctx.globalAlpha=opacity*.65;ctx.strokeStyle='#fff4d1';ctx.lineWidth=2;
    ctx.beginPath();ctx.ellipse(0,0,rad+6,(rad+6)*.64,0,-Math.PI/2,
      -Math.PI/2+2*Math.PI*v.remaining/v.duration);ctx.stroke();
    ctx.restore();
    // Readable battlefield HUD for what the field actually DOES. This stays
    // anchored to the moving resonance, below the ground-ring silhouette.
    const zh=window.MorrowwishI18n?.get?.()==='zh';
    const statusNames={burn:'灼烧',soak:'湿润',shock:'感电',oil:'浸油',
      chill:'冰冻',dizzy:'眩晕',bleed:'流血',blind:'致盲',bind:'束缚',
      expose:'破绽',weaken:'削弱',rust:'破甲'};
    const enStatus={burn:'Burn',soak:'Soak',shock:'Shock',oil:'Oil',
      chill:'Chill',dizzy:'Dizzy',bleed:'Bleed',blind:'Blind',bind:'Bind',
      expose:'Expose',weaken:'Weaken',rust:'Armor break'};
    const effect=zh?{
      heal:'治疗',regen:'持续治疗',shield:'护盾',boost:'增伤',
      haste:'冷却加速',evade:'闪避',protect:'格挡',charge:'必杀充能',
      summon:'召唤队友'
    }:{
      heal:'Heal',regen:'Regeneration',shield:'Shield',boost:'Attack up',
      haste:'Cooldown',evade:'Evade',protect:'Guard',charge:'Ult charge',
      summon:'Summon ally'
    };
    const name=zh?(statusNames[v.status]||'异常'):(enStatus[v.status]||'Status');
    const assist=effect[v.support]||v.support;
    const summary=zh?('脉冲伤害 · '+name+' · '+assist):('Pulse damage · '+name+' · '+assist);
    const by=Math.min(this.H-this.bottomMargin-8,Math.max(this.topMargin+12,v.y+rad*.64+18));
    ctx.save();
    ctx.globalAlpha=Math.min(1,v.age/.35,v.remaining/.6);
    ctx.font='700 10px system-ui,sans-serif';
    ctx.textAlign='center';ctx.textBaseline='middle';
    const label=summary+'  '+Math.ceil(v.remaining)+'s';
    const width=Math.min(this.W-18,ctx.measureText(label).width+18);
    const bx=clamp(v.x,width/2+5,this.W-width/2-5);
    ctx.fillStyle='rgba(32,42,55,.82)';
    rr(ctx,bx-width/2,by-10,width,20,9);ctx.fill();
    ctx.fillStyle='#fff5dd';ctx.fillText(label,bx,by,width-12);
    ctx.restore();
  };


P.drawDeathRay = function(ctx){
    const r=this.deathRay; if(!r)return;
    const fr=this._deathRayFrame(); if(!fr)return;
    const { W, H }=this, hue=_hex(r.color), light=mix(r.color,'#ffffff',0.5);
    const rgb=`${hue[0]},${hue[1]},${hue[2]}`;
    const ox=r.ox, oy=r.oy;

    // ---- 1) lingering SCORCH ARC on a persistent accumulation canvas ----
    if(typeof document!=='undefined'&&document.createElement){
      if(!r.scorch){ try{ const c=document.createElement('canvas'); c.width=W; c.height=H; r.scorch=c; r.sctx=c.getContext('2d'); }catch(e){ r.scorch=null; } }
      if(r.sctx){
        const s=r.sctx;
        s.globalCompositeOperation='destination-out';       // slow fade of old wedges
        s.fillStyle='rgba(0,0,0,0.035)'; s.fillRect(0,0,W,H);
        if(fr.firing){                                       // ONE wedge per frame at current angle
          s.globalCompositeOperation='source-over';
          s.fillStyle='rgba(34,10,46,0.5)';
          s.beginPath(); s.moveTo(ox,oy);
          s.arc(ox,oy,fr.L,fr.ang-0.05,fr.ang+0.05); s.closePath(); s.fill();
        }
        s.globalCompositeOperation='source-over';
        ctx.save(); ctx.globalAlpha=0.55; ctx.drawImage(r.scorch,0,0); ctx.restore();
      }
    }

    ctx.save();
    ctx.translate(ox,oy); ctx.rotate(fr.ang);
    const L=fr.L, w0=fr.w0, w1=fr.w1;
    const quad=(a,b)=>{ ctx.beginPath(); ctx.moveTo(0,-a); ctx.lineTo(L,-b); ctx.lineTo(L,b); ctx.lineTo(0,a); ctx.closePath(); ctx.fill(); };
    // cross gradient across local Y: transparent edge → bright spine → transparent edge
    const crossGrad=(span,edge,spine)=>{ const g=ctx.createLinearGradient(0,-span,0,span); g.addColorStop(0,edge); g.addColorStop(0.5,spine); g.addColorStop(1,edge); return g; };
    ctx.globalCompositeOperation='lighter';
    // ---- 2a) outer aura (~1.6× wide, hue, low alpha) ----
    ctx.globalAlpha=0.2*fr.intensity;
    ctx.fillStyle=crossGrad(w1*1.6+4,`rgba(${rgb},0)`,`rgba(${rgb},0.55)`);
    quad(w0*1.6+3,w1*1.6+4);
    // ---- 2b) body glow (~1.2× wide, lighter hue) ----
    ctx.globalAlpha=0.5*fr.intensity;
    ctx.fillStyle=crossGrad(w1*1.2+2,`rgba(${rgb},0)`,light);
    quad(w0*1.2+2,w1*1.2+2);
    // ---- 2c) CORE: thin tapered white spine ----
    ctx.globalAlpha=fr.intensity;
    ctx.fillStyle=crossGrad(Math.max(2,w1*0.5),'rgba(223,240,255,0)','#ffffff');
    quad(Math.max(2,w0*0.5),Math.max(2,w1*0.5));
    // ---- 3) wobbling plasma edges (scrolling sin-sum noise), capped step ----
    if(fr.firing){
      const t=this.t;
      for(const sgn of [-1,1]){
        ctx.beginPath();
        for(let x=0;x<=L;x+=12){
          const p=x/Math.max(1,L);
          const hw=(w0+(w1-w0)*p);
          const wob=Math.sin(x*0.05-t*18)*2.4+Math.sin(x*0.013+t*9)*1.6;
          const y=sgn*(hw+wob);
          x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
        }
        ctx.globalAlpha=0.5*fr.intensity; ctx.strokeStyle=`rgba(${rgb},0.9)`; ctx.lineWidth=3; ctx.stroke();
        ctx.globalAlpha=0.9*fr.intensity; ctx.strokeStyle='#ffffff'; ctx.lineWidth=1.2; ctx.stroke();
      }
    }
    // ---- 4) bright moving IMPACT blob at the beam tip (L,0) ----
    const pulse=1+0.18*Math.sin(this.t*30);
    const blobR=(w1*1.7+10)*pulse*fr.intensity;
    if(blobR>1){
      const g=ctx.createRadialGradient(L,0,0,L,0,blobR);
      g.addColorStop(0,'#ffffff'); g.addColorStop(0.35,`rgba(${rgb},0.9)`); g.addColorStop(1,`rgba(${rgb},0)`);
      ctx.globalAlpha=fr.intensity; ctx.fillStyle=g;
      ctx.beginPath(); ctx.arc(L,0,blobR,0,Math.PI*2); ctx.fill();
    }
    ctx.restore();
    // origin muzzle glow
    ctx.save(); ctx.globalCompositeOperation='lighter';
    const og=ctx.createRadialGradient(ox,oy,0,ox,oy,34*fr.intensity+6);
    og.addColorStop(0,'#ffffff'); og.addColorStop(0.5,`rgba(${rgb},0.8)`); og.addColorStop(1,`rgba(${rgb},0)`);
    ctx.globalAlpha=fr.intensity; ctx.fillStyle=og;
    ctx.beginPath(); ctx.arc(ox,oy,34*fr.intensity+6,0,Math.PI*2); ctx.fill();
    ctx.restore();
    // charge-up tell: a faint aim line sweeping to the start angle before the fire snap
    if(fr.phase==='charge'){
      ctx.save(); ctx.globalAlpha=0.3*fr.intensity; ctx.strokeStyle=r.color; ctx.lineWidth=1.5; ctx.setLineDash([6,10]);
      ctx.beginPath(); ctx.moveTo(ox,oy); ctx.lineTo(ox+Math.cos(fr.ang)*fr.L,oy+Math.sin(fr.ang)*fr.L); ctx.stroke(); ctx.restore();
    }
  };


P.drawFields = function(ctx){
    for(const fld of this.fields){
      if(fld.kind==='magneticField'&&window.CatBondMagneticFX){window.CatBondMagneticFX.draw(ctx,fld.a,fld.b,this.t,Math.min(1,fld.t/.25,(fld.max-fld.t)/.2),fld.r);continue;}
      if(window.CatBondSkillFX?.drawMaterialField(ctx,fld,this.t))continue;
      const k=Math.max(0,fld.t/fld.max), pulse=0.5+0.5*Math.sin(this.t*4);
      // FIRE fields (陨石灼烧 / etc.) get a proper burning-ground look: a dark scorch base,
      // flickering ember halo, and rising additive embers — not the generic dashed ellipse.
      // Non-fire fields keep the readable dashed ellipse so soak/bind/blind stay distinct.
      if (fld.element === 'fire') {
        ctx.save();
        // 1) dark scorch base — a charred patch under the flame; fades with k but stays visible
        ctx.globalAlpha = 0.42 * k;
        ctx.fillStyle = '#2a140a';
        ctx.beginPath(); ctx.ellipse(fld.x, fld.y+8, fld.r*0.98, fld.r*0.48, 0, 0, Math.PI*2); ctx.fill();
        // 2) warm orange glow — additive so it pops against the scorch
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = (0.30 + 0.10*pulse) * k;
        const g = ctx.createRadialGradient(fld.x, fld.y+6, fld.r*0.15, fld.x, fld.y+6, fld.r);
        g.addColorStop(0, '#ffdc78');
        g.addColorStop(0.45, '#ff7a2a');
        g.addColorStop(1, 'rgba(120,32,10,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.ellipse(fld.x, fld.y+6, fld.r, fld.r*0.5, 0, 0, Math.PI*2); ctx.fill();
        // 3) flickering tongues around the rim — short vertical flame slivers
        const n = Math.max(10, Math.round(fld.r/9));
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2 + this.t * 0.4;
          const rx = fld.x + Math.cos(a) * fld.r * (0.84 + 0.1*Math.sin(this.t*7 + i));
          const ry = fld.y + 6 + Math.sin(a) * fld.r * 0.5 * (0.84 + 0.1*Math.cos(this.t*8 + i));
          const flick = 6 + 10 * (0.5 + 0.5 * Math.sin(this.t*12 + i*1.7));
          ctx.globalAlpha = (0.55 + 0.4*pulse) * k;
          const g2 = ctx.createLinearGradient(rx, ry, rx, ry - flick);
          g2.addColorStop(0, '#ff9a2a');
          g2.addColorStop(0.5, '#ffd766');
          g2.addColorStop(1, 'rgba(255,255,220,0)');
          ctx.fillStyle = g2;
          ctx.beginPath();
          ctx.moveTo(rx - 2.4, ry);
          ctx.quadraticCurveTo(rx, ry - flick*0.5, rx, ry - flick);
          ctx.quadraticCurveTo(rx, ry - flick*0.5, rx + 2.4, ry);
          ctx.closePath();
          ctx.fill();
        }
        // 4) rising ember sparks — tiny bright dots drifting up (time-seeded, deterministic)
        const m = Math.max(5, Math.round(fld.r/14));
        for (let i = 0; i < m; i++) {
          const seed = i * 1.31 + fld.x * 0.0017 + fld.y * 0.0023;
          const life = ((this.t * 0.7 + seed) % 1);                      // 0..1 per ember
          const ax = (Math.sin(seed * 13.7) + Math.cos(seed * 7.3)) * fld.r * 0.55;
          const ex = fld.x + ax;
          const ey = fld.y + 6 - life * 36;
          const er = 1.2 + 1.4 * Math.abs(Math.sin(seed * 5.1));
          ctx.globalAlpha = (1 - life) * 0.9 * k;
          ctx.fillStyle = life < 0.45 ? '#ffd27a' : '#ff6a2a';
          ctx.beginPath(); ctx.arc(ex, ey, er, 0, Math.PI*2); ctx.fill();
        }
        ctx.restore();
        continue;
      }
      ctx.save();
      ctx.globalAlpha=0.16*k+0.06*pulse*k;
      ctx.fillStyle=fld.col;
      ctx.beginPath(); ctx.ellipse(fld.x,fld.y+6,fld.r,fld.r*0.5,0,0,Math.PI*2); ctx.fill();
      ctx.globalAlpha=0.4*k; ctx.strokeStyle=fld.col; ctx.lineWidth=2;
      ctx.setLineDash([6,6]); ctx.lineDashOffset=-(this.t*30)%12;
      ctx.beginPath(); ctx.ellipse(fld.x,fld.y+6,fld.r,fld.r*0.5,0,0,Math.PI*2); ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
  };


P.drawBeams = function(ctx){
    for(const b of this.beams){
      if(b._ox==null)continue;
      // paint only up to the first enemy the stream hits (visual; damage uses b._ex/_ey)
      const _vend=this.beamVisualEnd(b), _ex0=b._ex, _ey0=b._ey;
      // Water lance and sweeping fire use full reach; other beams stop at contact. No damage mutation.
      if(window.CatBondSkillFX?.drawCombatBeam(ctx,b,this.t,
        ['flameSweep','waterJet','shadowTendrils'].includes(b.sk?.id)?_ex0:_vend.ex,['flameSweep','waterJet','shadowTendrils'].includes(b.sk?.id)?_ey0:_vend.ey))continue;
      b._ex=_vend.ex; b._ey=_vend.ey;
      const k=Math.max(0,b.t/b.max);
      if(b.sk?.id==='thunderStream'){
        ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
        for(const [w,color,a] of [[12,'#4756ae',.37],[5,'#aecbff',.86],[2,'#fff1b4',.97]]){
          ctx.lineWidth=w;ctx.strokeStyle=color;ctx.globalAlpha=a*k;ctx.beginPath();
          ctx.moveTo(b._ox,b._oy);
          const nx=b._ey-b._oy,ny=-(b._ex-b._ox),len=Math.hypot(nx,ny)||1;
          for(let j=1;j<=13;j++){
            const u=j/13,off=(Math.sin(j*31.7+Math.floor(this.t*24)*7.1))*9*(1-u*.4);
            ctx.lineTo(b._ox+(b._ex-b._ox)*u+nx/len*off,
              b._oy+(b._ey-b._oy)*u+ny/len*off);
          }
          ctx.stroke();
        }
        // Small forks peel away from the main electrical trunk; they remain
        // subordinate to the actual attack line and never cover the screen.
        const vx=b._ex-b._ox,vy=b._ey-b._oy,mag=Math.hypot(vx,vy)||1;
        const px=-vy/mag,py=vx/mag;
        ctx.strokeStyle='#fff4c2';ctx.lineWidth=1.5;ctx.globalAlpha=.66*k;
        for(let j=2;j<=9;j+=3){
          const u=j/12,sign=j%2?1:-1,
            tx=b._ox+vx*u,ty=b._oy+vy*u;
          ctx.beginPath();ctx.moveTo(tx,ty);
          ctx.lineTo(tx+px*sign*12+vx/mag*5,ty+py*sign*12+vy/mag*5);
          ctx.lineTo(tx+px*sign*21+vx/mag*10,ty+py*sign*21+vy/mag*10);
          ctx.stroke();
        }
        b._ex=_ex0; b._ey=_ey0;                      // restore full-reach for damage tick
        ctx.restore();continue;
      }
      if(b.sk?.id==='flameSweep'){
        // A true SHORT-RANGE THREE-PASS FIRE FAN. Two warm outer flames, a
        // narrower white-hot core, travelling tongues and glowing embers;
        // follow b.aim so the cat visibly sweeps its head LEFT↔RIGHT.
        // Never fill the viewport or extend beyond the real 156px hit reach.
        const angle=b.aim,dx=Math.cos(angle),dy=Math.sin(angle),
          nx=-dy,ny=dx,originX=b._ox,originY=b._oy;
        const length=Math.min(160,Math.hypot(b._ex-originX,b._ey-originY));
        ctx.save();ctx.globalCompositeOperation='source-over';ctx.lineCap='round';
        const fan=ctx.createLinearGradient(originX,originY,b._ex,b._ey);
        fan.addColorStop(0,'rgba(211,66,38,.72)');
        fan.addColorStop(.5,'rgba(255,126,56,.64)');
        fan.addColorStop(1,'rgba(255,210,115,.08)');
        // Two shifting exterior contours read as a sheet of fire, rather
        // than eleven disconnected orange coins.
        ctx.fillStyle=fan;ctx.globalAlpha=.77*k;ctx.beginPath();
        const seg=16;
        // Trace nozzle→tip on one side, tip→nozzle on the other:
        // the old forward-forward edges formed a self-intersecting fan.
        for(let side of [-1,1]){
          for(let step=0;step<=seg;step++){
            const j=side===-1?step:seg-step,u=j/seg,
              w=(5+u*24)*(1-.25*u),
              wob=Math.sin(this.t*24+u*15+side)*5*u,
              x=originX+dx*length*u+nx*side*(w+wob),
              y=originY+dy*length*u+ny*side*(w+wob);
            if(side===-1&&step===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
          }
        }
        ctx.closePath();ctx.fill();
        ctx.globalCompositeOperation='lighter';
        for(let j=0;j<18;j++){
          const u=(j+.25)/18,dist=u*length,
            sway=Math.sin(this.t*26+j*2.3)*(.8+u*12),
            x=originX+dx*dist+nx*sway,
            y=originY+dy*dist+ny*sway,r=(5+u*21)*(1+.13*Math.sin(this.t*18+j));
          ctx.globalAlpha=k*(.34+.28*(1-u));
          ctx.fillStyle=j%4===0?'#fff5bc':j%3===0?'#ffcb71':'#f87335';
          ctx.beginPath();ctx.ellipse(x,y,r*1.05,r*.43,angle,0,Math.PI*2);ctx.fill();
          if(j%3===0){
            ctx.strokeStyle='#fff3c0';ctx.lineWidth=1.5;
            const bx=x+dx*r*.7,by=y+dy*r*.7;
            ctx.globalAlpha=.52*k;ctx.beginPath();ctx.moveTo(bx,by);
            ctx.lineTo(bx+dx*(11+u*9)+nx*6,by+dy*(11+u*9)+ny*6);ctx.stroke();
          }
        }
        // White-hot throat at the muzzle; helps follow the sweeping motion.
        ctx.globalAlpha=.77*k;ctx.fillStyle='#fff0b1';
        ctx.beginPath();ctx.ellipse(originX+dx*10,originY+dy*10,10,5,angle,0,Math.PI*2);ctx.fill();
        b._ex=_ex0; b._ey=_ey0;                      // restore full-reach for damage tick
        ctx.restore();continue;
      }
      // Additive gradient stream (VFX research): overlaps sum to white, a prism
      // gradient flows along the axis, a dashed inner core streams toward the target.
      const grad=ctx.createLinearGradient(b._ox,b._oy,b._ex,b._ey);
      grad.addColorStop(0,'#ffffff'); grad.addColorStop(0.35,b.col); grad.addColorStop(1,b.col);
      const nx=-(b._ey-b._oy), ny=(b._ex-b._ox), nl=Math.hypot(nx,ny)||1;
      ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.lineCap='round';
      for(const [w,a] of [[b.width*1.9,0.14*k],[b.width*1.0,0.3*k],[b.width*0.55,0.75*k]]){
        ctx.globalAlpha=a; ctx.lineWidth=w; ctx.strokeStyle=grad;
        ctx.beginPath(); ctx.moveTo(b._ox,b._oy);
        const seg=10;
        for(let i=1;i<=seg;i++){ const tt=i/seg; const mx=b._ox+(b._ex-b._ox)*tt, my=b._oy+(b._ey-b._oy)*tt;
          const wv=Math.sin(this.t*22+i)*4*(1-tt); ctx.lineTo(mx+nx/nl*wv,my+ny/nl*wv); }
        ctx.stroke();
      }
      // streaming dashed packets
      ctx.globalAlpha=0.85*k; ctx.lineWidth=b.width*0.3; ctx.strokeStyle='#fff';
      ctx.setLineDash([14,10]); ctx.lineDashOffset=-(this.t*180)%24;
      ctx.beginPath(); ctx.moveTo(b._ox,b._oy); ctx.lineTo(b._ex,b._ey); ctx.stroke(); ctx.setLineDash([]);
      // white-hot nozzle
      ctx.globalAlpha=k; ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(b._ox,b._oy,b.width*0.4,0,Math.PI*2); ctx.fill();
      ctx.restore();
      b._ex=_ex0; b._ey=_ey0;                        // restore full-reach for damage tick
    }
  };


P.drawRegularSkillAccent = function(ctx,v,k,p){
    const scale=v.isBasic?.72:1,hit=!!v.hit;
    const color={
      fire:'#f9ad73',water:'#88d9f0',grass:'#a7d39b',
      elec:'#f4d676',dark:'#c5a8e8',light:'#ffe8a0'
    }[v.element]||'#f6d2dc';
    ctx.save();ctx.translate(v.x,v.y);if(!hit)ctx.rotate(v.angle);
    ctx.globalAlpha*=Math.min(1,k*1.6);
    const rad=(hit?10:8)+p*(hit?24:25)*scale;
    ctx.strokeStyle=color;ctx.lineWidth=(hit?3.4:2.4)*scale*k+0.5;
    ctx.beginPath();ctx.arc(0,0,rad,-.85,2.25);ctx.stroke();
    // Tiny neutral rim creates readability over any pastel map.
    ctx.strokeStyle='#fffdf5';ctx.lineWidth=1.4*scale*k;
    ctx.beginPath();ctx.arc(0,0,Math.max(3,rad-4),-.65,1.8);ctx.stroke();
    const n=v.isBasic?3:5;
    for(let i=0;i<n;i++){
      const a=i*Math.PI*2/n+p*(hit?1.15:.75);
      const dist=(hit?8:12)+p*(hit?21:24)*scale;
      ctx.save();ctx.translate(Math.cos(a)*dist,Math.sin(a)*dist);
      ctx.rotate(a+.25+p*.5);
      ctx.fillStyle=color;ctx.strokeStyle=color;ctx.lineWidth=2*scale;
      if(v.element==='fire'){
        ctx.beginPath();ctx.moveTo(0,-6*scale);
        ctx.quadraticCurveTo(6*scale,-1*scale,2*scale,4*scale);
        ctx.quadraticCurveTo(-6*scale,3*scale,0,-6*scale);ctx.fill();
        ctx.fillStyle='#fff0cb';ctx.beginPath();ctx.ellipse(0,1*scale,1.5*scale,2*scale,0,0,Math.PI*2);ctx.fill();
      }else if(v.element==='water'){
        ctx.beginPath();ctx.moveTo(0,-7*scale);
        ctx.bezierCurveTo(6*scale,-1*scale,6*scale,5*scale,0,5*scale);
        ctx.bezierCurveTo(-6*scale,5*scale,-6*scale,-1*scale,0,-7*scale);
        ctx.fill();ctx.fillStyle='#f6fdff';
        ctx.beginPath();ctx.arc(-1*scale,1*scale,1.3*scale,0,Math.PI*2);ctx.fill();
      }else if(v.element==='grass'){
        ctx.beginPath();ctx.ellipse(1*scale,-1*scale,6*scale,3.1*scale,-.65,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle='#fff7dd';ctx.lineWidth=1*scale;
        ctx.beginPath();ctx.moveTo(-3*scale,3*scale);ctx.lineTo(5*scale,-5*scale);ctx.stroke();
      }else if(v.element==='elec'){
        ctx.beginPath();ctx.moveTo(-3*scale,-6*scale);ctx.lineTo(2*scale,-2*scale);
        ctx.lineTo(-1*scale,2*scale);ctx.lineTo(4*scale,6*scale);ctx.stroke();
        ctx.strokeStyle='#fff7ce';ctx.lineWidth=1*scale;ctx.beginPath();
        ctx.moveTo(-1*scale,-5*scale);ctx.lineTo(3*scale,-2*scale);ctx.stroke();
      }else if(v.element==='dark'){
        ctx.strokeStyle=color;ctx.lineWidth=3*scale;ctx.beginPath();
        ctx.arc(0,0,5.5*scale,-1.55,1.55);ctx.stroke();
        ctx.fillStyle='#f4dfed';ctx.beginPath();ctx.arc(2*scale,-4*scale,1*scale,0,Math.PI*2);ctx.fill();
      }else{
        ctx.beginPath();ctx.moveTo(0,-7*scale);ctx.lineTo(2.2*scale,-2.2*scale);
        ctx.lineTo(7*scale,0);ctx.lineTo(2.2*scale,2.2*scale);
        ctx.lineTo(0,7*scale);ctx.lineTo(-2.2*scale,2.2*scale);
        ctx.lineTo(-7*scale,0);ctx.lineTo(-2.2*scale,-2.2*scale);ctx.closePath();ctx.fill();
        ctx.fillStyle='#fffdf2';ctx.beginPath();ctx.arc(0,0,1.6*scale,0,Math.PI*2);ctx.fill();
      }
      ctx.restore();
    }
    ctx.restore();
  };


P.drawSkillStrokes = function(ctx){
    for(const v of this.skillStrokes){
      if(window.CatBondSkillFX?.drawInstantLine(ctx,v,this.t))continue;
      const k=Math.max(0,v.life/v.max),p=1-k;
      ctx.save();ctx.globalAlpha=Math.min(1,k*.95);
      ctx.lineCap='round';ctx.lineJoin='round';
      if(v.kind==='moonImpact'){
        window.CatBondMoonFX?.drawImpact(ctx,v,this.t);
      }else if(v.kind==='moonHover'){
        window.CatBondMoonFX?.drawHover?.(ctx,v,this.t);
      }else if(v.kind==='signatureCast'||v.kind==='signatureHit'){
        window.CatBondSkillFX?.draw(ctx,v,this.t);
      }else if(v.kind==='regularAccent'){
        this.drawRegularSkillAccent(ctx,v,k,p);
      }else if(v.kind==='water'||v.kind==='ice'||v.kind==='prism'||v.kind==='lightning'){
        const dx=v.x2-v.x,dy=v.y2-v.y,len=Math.hypot(dx,dy)||1;
        const nx=-dy/len,ny=dx/len;
        const colors=v.kind==='water'?['#d4fdff','#61d3f7','#f4ffff']:
          v.kind==='ice'?['#d7f7ff','#8dcced','#f7ffff']:v.kind==='prism'?['#fef3b1','#eab1ff','#bff9ff']:['#e9d6ff','#fbecb1','#b1dfff'];
        for(let layer=0;layer<3;layer++){
          ctx.strokeStyle=colors[layer];ctx.lineWidth=(v.kind==='water'?17:9)-layer*3;
          ctx.beginPath();ctx.moveTo(v.x,v.y);
          const seg=18;
          for(let i=1;i<=seg;i++){
            const t=i/seg,x=v.x+dx*t,y=v.y+dy*t;
            const amp=v.kind==='water'?8:v.kind==='lightning'?12:3;
            const wave=Math.sin(t*(v.kind==='lightning'?53:20)+this.t*22+layer*2)*amp*k;
            ctx.lineTo(x+nx*wave,y+ny*wave);
          }ctx.stroke();
        }
      }else if(v.kind==='fireBurst'){
        ctx.strokeStyle=v.color;ctx.lineWidth=11*k;
        ctx.beginPath();ctx.arc(v.x,v.y,15+p*112,0,Math.PI*2);ctx.stroke();
        for(let i=0;i<12;i++){
          const ang=i*Math.PI/6,rad=22+p*105;
          ctx.fillStyle=i%2?'#ff7f38':'#ffe29a';
          ctx.beginPath();ctx.arc(v.x+Math.cos(ang)*rad,v.y+Math.sin(ang)*rad,5*k+1,0,Math.PI*2);ctx.fill();
        }
      }else if(v.kind==='giantSlam'){
        // 泰山压顶 — MOUNTAIN-GIANT BOULDER THROW: a huge craggy rock is hurled in
        // from above-left, spins down along an arc, and SLAMS the target with a dust
        // shock + flying debris + a cracked crater. (No translucent cat.)
        const drop=p<0.5?(p/0.5):1;                      // 0→1 descent along the throw arc
        const landed=p>=0.5;
        // arc: comes from up-and-left, lands on the target
        const sx=v.x-230, sy=v.y-300;
        const bx=sx+(v.x-sx)*drop, by=sy+(v.y-sy)*drop - Math.sin(drop*Math.PI)*40; // slight lob
        const R=46;
        // motion streak behind the incoming rock
        if(!landed){
          ctx.save();ctx.globalAlpha=k*0.5;ctx.strokeStyle='#b7a893';ctx.lineWidth=R*1.1;ctx.lineCap='round';
          ctx.beginPath();ctx.moveTo(bx-(v.x-sx)*0.12,by-(v.y-sy)*0.12);ctx.lineTo(bx,by);ctx.stroke();ctx.restore();
        }
        if(!landed){
          // the boulder: a lumpy dark-rock polygon, spinning as it falls
          ctx.save();ctx.translate(bx,by);ctx.rotate(drop*5.5);
          ctx.globalAlpha=Math.min(1,k*1.3);
          const rock=ctx.createRadialGradient(-R*0.3,-R*0.3,R*0.2,0,0,R);
          rock.addColorStop(0,'#8d8275');rock.addColorStop(1,'#4b4038');
          ctx.fillStyle=rock;ctx.strokeStyle='#2f2823';ctx.lineWidth=3;
          ctx.beginPath();
          const facets=9;
          for(let i=0;i<facets;i++){const a=i/facets*Math.PI*2;const rr=R*(0.82+0.22*Math.sin(i*2.3));
            const px=Math.cos(a)*rr,py=Math.sin(a)*rr;i?ctx.lineTo(px,py):ctx.moveTo(px,py);}
          ctx.closePath();ctx.fill();ctx.stroke();
          // a couple of cracks/facets for craggy read
          ctx.globalAlpha=k*0.5;ctx.strokeStyle='#2f2823';ctx.lineWidth=2;
          ctx.beginPath();ctx.moveTo(-R*0.4,-R*0.2);ctx.lineTo(R*0.1,R*0.1);ctx.lineTo(R*0.5,-R*0.1);ctx.stroke();
          ctx.restore();
        }else{
          // IMPACT: cracked crater + dust shock ring + flying rock debris
          const ip=(p-0.5)/0.5;                          // 0→1 after landing
          ctx.save();ctx.translate(v.x,v.y);
          // dust shock ring
          ctx.globalAlpha=k*0.9;ctx.strokeStyle='#d8c9b0';ctx.lineWidth=7*k;
          ctx.beginPath();ctx.arc(0,0,30+ip*150,0,Math.PI*2);ctx.stroke();
          ctx.globalAlpha=k*0.6;ctx.strokeStyle='#fff';ctx.lineWidth=3*k;
          ctx.beginPath();ctx.arc(0,0,20+ip*120,0,Math.PI*2);ctx.stroke();
          // cracked crater lines radiating out
          ctx.globalAlpha=k*0.7;ctx.strokeStyle='#3a322b';ctx.lineWidth=3;
          for(let i=0;i<8;i++){const a=i*Math.PI/4+0.3;const r0=12,r1=24+ip*34;
            ctx.beginPath();ctx.moveTo(Math.cos(a)*r0,Math.sin(a)*r0);ctx.lineTo(Math.cos(a)*r1,Math.sin(a)*r1);ctx.stroke();}
          // flying debris chunks
          ctx.globalAlpha=k;ctx.fillStyle='#6a5e4f';
          for(let i=0;i<10;i++){const a=i*0.63;const d=30+ip*120;const s=4*k+1.5;
            ctx.beginPath();ctx.arc(Math.cos(a)*d,Math.sin(a)*d-ip*30,s,0,Math.PI*2);ctx.fill();}
          ctx.restore();
        }
      }else if(v.kind==='duoImpact'){
        // Continue the same one-of-21 magical signature seen in the cut-in.
        // Previously every combo finished with the same three diagonal scratches.
        const key=v.elements||'fire+fire';
        ctx.save();ctx.translate(v.x,v.y);
        const radius=30+p*94;
        const glow=ctx.createRadialGradient(0,0,1,0,0,radius);
        glow.addColorStop(0,(v.firstColor||'#ffeaba')+'99');
        glow.addColorStop(1,(v.secondColor||'#bbe9ff')+'00');
        ctx.fillStyle=glow;ctx.beginPath();ctx.arc(0,0,radius,0,Math.PI*2);ctx.fill();
        if(window.CatBondDuoFinale?.draw){
          const size=Math.max(145,Math.min(215,160+p*80));
          ctx.save();ctx.translate(-size/2,-size*.37);
          ctx.globalAlpha=Math.max(.18,Math.min(.75,k*.65));
          window.CatBondDuoFinale.draw(ctx,size,size*.76,.17+.53*p,key,2);
          ctx.restore();
        }else{
          ctx.strokeStyle=v.firstColor||'#ffeabc';ctx.lineWidth=6*k;
          ctx.beginPath();ctx.arc(0,0,radius*.65,0,Math.PI*2);ctx.stroke();
        }
        ctx.restore();
      }else if(v.kind==='furStorm'){
        const spins=7;
        ctx.save();ctx.translate(v.x,v.y);ctx.rotate(p*2.4);
        // snappier expansion: ease-out so it bursts wide fast, then eases (was linear *180)
        const ease=1-(1-p)*(1-p);
        for(let i=0;i<spins;i++){
          const ang=i*Math.PI*2/spins+this.t*5,rad=24+ease*300;
          ctx.save();ctx.rotate(ang);ctx.translate(rad,0);ctx.rotate(ang);
          for(let claw=-1;claw<=1;claw++){
            ctx.strokeStyle=claw?'#d5a37d':'#fff9e4';ctx.lineWidth=(claw?3.7:5)*k;
            ctx.beginPath();ctx.moveTo(-17,-13+claw*9);
            ctx.quadraticCurveTo(0,0+claw*9,18,11+claw*9);ctx.stroke();
          }
          ctx.restore();
        }
        ctx.restore();
      }else if(v.kind==='ultimate'){
        window.CatBondUltVFX?.draw(ctx,v,this.W,this.H,this.t,'back');
      }
      ctx.restore();
    }
  };


P.drawArenaBackground = function(ctx, W, H) {
    if(window.CatBondScenery && CatBondScenery.drawBattle(ctx,W,H,this.t,this.theme))return;
    const t = this.t, horizon = H * 0.34;
    const th = this.theme || {};
    const sky1 = th.sky1 || '#271a46', sky2 = th.sky2 || '#4a3570';
    const g1 = th.ground || '#2e6b46', g2 = th.ground2 || '#1b4a32';
    const accent = th.accent || '#9d7bff';
    // night sky (themed)
    const sky = ctx.createLinearGradient(0, 0, 0, horizon + 40);
    sky.addColorStop(0, sky1); sky.addColorStop(0.6, sky2); sky.addColorStop(1, mix(sky2, g1, 0.5));
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, horizon + 40);
    // stars
    if (!this._stars) this._stars = Array.from({ length: 40 }, (_, i) => ({ x: (i * 131) % W, y: (i * 71) % horizon, r: 0.6 + (i % 3) * 0.5, ph: i }));
    ctx.fillStyle = '#fff';
    for (const s of this._stars) { ctx.globalAlpha = 0.3 + 0.5 * Math.abs(Math.sin(t * 0.8 + s.ph)); ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill(); }
    ctx.globalAlpha = 1;
    // moon with glow
    const mx = W * 0.82, my = 72;
    const mg = ctx.createRadialGradient(mx, my, 6, mx, my, 70);
    mg.addColorStop(0, 'rgba(255,245,210,0.5)'); mg.addColorStop(1, 'rgba(255,245,210,0)');
    ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(mx, my, 70, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff6da'; ctx.beginPath(); ctx.arc(mx, my, 28, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(120,100,150,0.35)'; ctx.beginPath(); ctx.arc(mx + 10, my - 6, 24, 0, Math.PI * 2); ctx.fill();
    // layered hills (themed, derived from sky/ground mix)
    ctx.fillStyle = mix(sky2, g1, 0.55); this.hillBand(ctx, W, horizon, 34, 0.7);
    ctx.fillStyle = mix(sky2, g1, 0.75); this.hillBand(ctx, W, horizon + 14, 26, 1.1);
    // ground: perspective meadow (themed)
    const grd = ctx.createLinearGradient(0, horizon, 0, H);
    grd.addColorStop(0, g1); grd.addColorStop(1, g2);
    ctx.fillStyle = grd; ctx.fillRect(0, horizon, W, H - horizon);
    // perspective floor lines converging to horizon center (depth cue)
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1;
    const cx = W / 2;
    for (let i = -6; i <= 6; i++) { ctx.beginPath(); ctx.moveTo(cx + i * 30, horizon); ctx.lineTo(cx + i * 220, H); ctx.stroke(); }
    for (let j = 1; j <= 6; j++) { const yy = horizon + (H - horizon) * (j * j) / 49; ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(W, yy); ctx.stroke(); }
    // glowing arena disc on the ground where the fight happens
    const dcx = W / 2, dcy = H * 0.66;
    ctx.save();
    const disc = ctx.createRadialGradient(dcx, dcy, 20, dcx, dcy, W * 0.42);
    disc.addColorStop(0, withAlpha(accent, 0.16)); disc.addColorStop(0.7, withAlpha(accent, 0.06)); disc.addColorStop(1, withAlpha(accent, 0));
    ctx.fillStyle = disc; ctx.beginPath(); ctx.ellipse(dcx, dcy, W * 0.42, (H - horizon) * 0.52, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(200,180,255,0.18)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(dcx, dcy, W * 0.4, (H - horizon) * 0.5, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
    // drifting ambient motes
    if (!this._motes) this._motes = Array.from({ length: 18 }, (_, i) => ({ x: (i * 97) % W, y: horizon + ((i * 53) % (H - horizon)), ph: i }));
    for (const mo of this._motes) {
      mo.y -= 8 * (1 / 60); if (mo.y < horizon) mo.y = H;
      ctx.globalAlpha = 0.25 + 0.3 * Math.abs(Math.sin(t + mo.ph));
      ctx.fillStyle = '#cbb8ff'; ctx.beginPath(); ctx.arc(mo.x + Math.sin(t + mo.ph) * 8, mo.y, 1.6, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  };


P.drawControlOverlay = function(ctx, e) {
    if (!e.status) return;
    const s = e.status, T = this.t;
    ctx.save();
    // Controls must remain obvious without painting vines/snowflakes over
    // the original watercolor cat's EYES. The previous stacked full-body
    // vines and freeze shell visibly hid the breed-specific face on phones.
    if(s.chill!=null){
      ctx.globalAlpha=.49;ctx.strokeStyle='#a9daf0';ctx.lineWidth=2;
      ctx.beginPath();ctx.ellipse(e.x,e.y+21,25,7,0,0,Math.PI*2);ctx.stroke();
      ctx.globalAlpha=.72;ctx.fillStyle='#e7f8ff';ctx.font='12px system-ui';
      ctx.textAlign='center';ctx.fillText('❄',e.x-31,e.y+13);
      ctx.fillText('❄',e.x+31,e.y+13);
    }
    if(s.bind!=null){
      // Two thin ground-level roots, never three chest/face-wrapping hoops.
      ctx.globalAlpha=.48;ctx.strokeStyle='#6abb73';ctx.lineWidth=2;
      ctx.beginPath();ctx.ellipse(e.x,e.y+21,25,8,0,0,Math.PI*2);ctx.stroke();
      ctx.beginPath();ctx.arc(e.x-26,e.y+17,8,-1.1,.6);ctx.stroke();
      ctx.beginPath();ctx.arc(e.x+26,e.y+17,8,2.5,4.4);ctx.stroke();
    }
    if (s.blind != null) {                 // Blinded: visible ground ring instead of ugly black face.
      ctx.globalAlpha = .73;ctx.strokeStyle = '#b49bdb';ctx.lineWidth = 2.2;
      ctx.beginPath();ctx.ellipse(e.x,e.y + 14,29,9,0,0,Math.PI*2);ctx.stroke();
      ctx.globalAlpha = .88;ctx.fillStyle = '#dcc9f2';ctx.font = '13px system-ui,sans-serif';
      ctx.textAlign = 'center';ctx.fillText('✧',e.x-28,e.y+7);ctx.fillText('✧',e.x+28,e.y+7);
    }
    window.CatBondSkillFX?.drawStatus(ctx,e,this.t);
    ctx.restore();
  };


P.drawAimPreview = function(ctx) {
    if (this.autoMode || this.ultCinematic) return;
    const f = this.me(); if (!f || !f.alive) return;
    const aim = this.aim || 0;
    // which off-cooldown offensive skill is the player most likely about to fire?
    const q = f.qSkill, e = f.eSkill;
    const readyLob = (sk, cd) => sk && sk.kind === 'aoe' && cd <= 0;
    const readyDir = (sk, cd) => sk && (sk.kind === 'projectile' || sk.kind === 'chain') && cd <= 0;
    // landing-zone preview for a lob AOE (prefer Q, then E)
    const lob = readyLob(q, f.cd.q) ? q : readyLob(e, f.cd.e) ? e : null;
    if (lob) {
      const col = this.elemColor(lob.element);
      let tx, ty;
      if (!this.game.isTouch) { const mo = this.game.mouse || {}; tx = mo.x; ty = mo.y; }
      else { const tgt = this.lockedEnemy() || this.nearestEnemy(f.x, f.y); if (tgt) { tx = tgt.x; ty = tgt.y; } else { tx = f.x + Math.cos(aim) * 240; ty = f.y + Math.sin(aim) * 240; } }
      ctx.save();
      // dashed arc from caster to landing point
      ctx.strokeStyle = withAlpha(col, 0.5); ctx.lineWidth = 2; ctx.setLineDash([4, 6]);
      ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(tx, ty); ctx.stroke(); ctx.setLineDash([]);
      // impact zone (radius 86 matches lobAoe R)
      const pulse = 0.35 + 0.2 * Math.abs(Math.sin(this.t * 4));
      ctx.globalAlpha = pulse; ctx.fillStyle = withAlpha(col, 0.18); ctx.beginPath(); ctx.arc(tx, ty, 86, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 0.8; ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.setLineDash([6, 5]);
      ctx.beginPath(); ctx.arc(tx, ty, 86, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      ctx.restore();
      return;
    }
    // trajectory line for a directional projectile/chain skill
    const dir = readyDir(q, f.cd.q) ? q : readyDir(e, f.cd.e) ? e : null;
    if (dir) {
      const col = this.elemColor(dir.element);
      const len = 300;
      ctx.save();
      ctx.strokeStyle = withAlpha(col, 0.45); ctx.lineWidth = 2.5; ctx.setLineDash([10, 8]);
      ctx.beginPath(); ctx.moveTo(f.x, f.y);
      ctx.lineTo(f.x + Math.cos(aim) * len, f.y + Math.sin(aim) * len); ctx.stroke();
      ctx.setLineDash([]);
      // arrowhead
      const ex = f.x + Math.cos(aim) * len, ey = f.y + Math.sin(aim) * len;
      ctx.fillStyle = withAlpha(col, 0.8); ctx.translate(ex, ey); ctx.rotate(aim);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-12, -6); ctx.lineTo(-12, 6); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
  };


P.drawCatCutin = function(ctx,W,H){
    let c=this.ultCinematic,duo=false;
    if(!c&&this.duoCinematic?.t>0){c=this.duoCinematic;duo=true;}
    if(!c&&this.spotlightCinematic&&Date.now()<this.spotlightCinematic.endsAt)
      c={...this.spotlightCinematic,t:(this.spotlightCinematic.endsAt-Date.now())/1000};
    if(!c)return;
    const progress=Math.max(0,Math.min(1,1-c.t/c.max));
    const opacity=Math.min(1,progress*7,(1-progress)*3.5);
    if(opacity<=.02)return;
    const en=window.MorrowwishI18n?.get?.()!=='zh';
    const bandY=Math.max(this.topMargin*.65,H*.18),bandH=Math.min(H*.55,290);
    const artSize=Math.min(duo?W*.32:W*.43,bandH*.83,duo?188:236);
    ctx.save();ctx.globalAlpha=opacity;
    // Soft stage lighting instead of the legacy hard-edged rectangular card.
    // The portrait and skill title can still read over the live battlefield.
    const stageCenterY=bandY+bandH*.49;
    const grad=ctx.createRadialGradient(W*.5,stageCenterY,bandH*.12,
      W*.5,stageCenterY,Math.max(W*.63,bandH*.9));
    grad.addColorStop(0,'rgba(43,52,70,.75)');
    grad.addColorStop(.55,'rgba(54,61,83,.40)');
    grad.addColorStop(1,'rgba(43,52,70,0)');
    ctx.fillStyle=grad;
    ctx.fillRect(0,0,W,H);
    const drawPortrait=(uid,x,flip=false)=>{
      const art=this.cinematicPortrait(uid);if(!art)return;
      const centerY=bandY+bandH*.43;
      ctx.save();ctx.translate(x,centerY);
      if(flip)ctx.scale(-1,1);
      const radius=artSize*.58;
      ctx.fillStyle='rgba(248,242,222,.94)';
      ctx.beginPath();ctx.ellipse(0,0,radius,radius*.90,0,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle=c.color||c.first||'#f7cfa5';ctx.lineWidth=4;
      ctx.beginPath();ctx.ellipse(0,0,radius,radius*.90,0,0,Math.PI*2);ctx.stroke();
      ctx.drawImage(art,-artSize*.5,-artSize*.48,artSize,artSize*.9);
      ctx.restore();
    };
    if(duo){
      drawPortrait(c.catUids?.[0],W*.27);
      drawPortrait(c.catUids?.[1],W*.73,true);
      // Two cats crouch, cross their paths, then pounce together.
      const leap=Math.max(0,Math.min(1,progress*2.5));
      ctx.strokeStyle=c.second||'#e7bafb';ctx.lineWidth=4;ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(W*.39,bandY+bandH*.53);
      ctx.quadraticCurveTo(W*.5,bandY+bandH*(.12+.1*leap),W*.61,bandY+bandH*.53);ctx.stroke();
      ctx.fillStyle='#fce9c6';ctx.font='900 '+Math.round(Math.min(32,W*.08))+'px system-ui';
      ctx.textAlign='center';ctx.fillText('×',W*.5,bandY+bandH*.49);
    }else{
      drawPortrait(c.uid,W*.32);
      const target=this.liveEnemies().find(e=>e.i===c.targetUid);
      const tx=W*.73,ty=bandY+bandH*.43,rad=Math.min(29,W*.08);
      ctx.strokeStyle='#ffe4a1';ctx.lineWidth=3;
      ctx.beginPath();ctx.arc(tx,ty,rad,0,Math.PI*2);ctx.stroke();
      ctx.beginPath();ctx.moveTo(tx-rad-10,ty);ctx.lineTo(tx-rad+8,ty);
      ctx.moveTo(tx+rad-8,ty);ctx.lineTo(tx+rad+10,ty);
      ctx.moveTo(tx,ty-rad-10);ctx.lineTo(tx,ty-rad+8);
      ctx.moveTo(tx,ty+rad-8);ctx.lineTo(tx,ty+rad+10);ctx.stroke();
      if(target){ctx.font='800 12px system-ui';ctx.textAlign='center';ctx.fillStyle='#fff2d4';
        ctx.fillText(en?'TARGET LOCK':'目标锁定',tx,ty+rad+22);}
    }
    const label=duo?(en?'DUO BOND · DOUBLE POUNCE':'双猫默契 · 合力飞扑')
      :(en?'ULTIMATE · PAW POWER':'必杀 · 猫爪出击');
    const title=c.name||label;
    ctx.textAlign='center';ctx.shadowColor=c.color||c.first||'#f9dba8';
    ctx.shadowBlur=12;ctx.fillStyle='#fff9ef';
    ctx.font='900 '+Math.round(Math.min(duo?22:28,W*.055))+'px system-ui';
    ctx.fillText(title,W*.5,bandY+bandH*.89,W*.82);
    ctx.shadowBlur=0;ctx.fillStyle='#edd6a5';
    ctx.font='800 '+Math.round(Math.min(13,W*.033))+'px system-ui';
    ctx.fillText(label,W*.5,bandY+bandH*.97,W*.82);
    ctx.restore();
  };


P.drawUltCinematic = function(ctx, W, H) {
    const c = this.ultCinematic; if (!c) return;
    const elapsed = c.max - c.t, k = elapsed / c.max;
    const caster = this.team.find(f => f.cat.uid === c.uid) || this.me();
    const cx = caster ? caster.x : W / 2, cy = caster ? caster.y : H / 2;
    const col = c.color, en = window.MorrowwishI18n?.get?.() !== 'zh';
    ctx.save();
    // 1) vignette darken (eases in, holds, eases out)
    const dark = Math.sin(Math.min(1, k * 1.3) * Math.PI) * 0.62;
    ctx.fillStyle = `rgba(14,8,22,${dark})`; ctx.fillRect(0, 0, W, H);
    // 2) cinematic letterbox bars
    const bar = Math.min(1, elapsed / 0.4) * (c.t < 0.5 ? c.t / 0.5 : 1) * (H * 0.09);
    ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(0, 0, W, bar); ctx.fillRect(0, H - bar, W, bar);
    // 3) speed lines rushing toward the caster during wind-up
    if (elapsed < c.impactAt) {
      const wind = elapsed / c.impactAt;
      ctx.globalAlpha = 0.5 * (1 - wind); ctx.strokeStyle = col; ctx.lineWidth = 2;
      for (let i = 0; i < 20; i++) {
        const a = (i / 20) * Math.PI * 2 + this.t * 0.8, r0 = 520 * (1 - wind) + 60, r1 = r0 - 120;
        ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
        ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); ctx.stroke();
      }
      // charging ring
      ctx.globalAlpha = 0.85; ctx.strokeStyle = col; ctx.lineWidth = 5 + 6 * wind;
      ctx.beginPath(); ctx.arc(cx, cy, 30 + 70 * wind, 0, Math.PI * 2 * wind); ctx.stroke();
    }
    // 4) detonation flash + expanding shock at the impact beat
    const sinceImpact = elapsed - c.impactAt;
    if (sinceImpact >= 0 && sinceImpact < 0.9) {
      const f = sinceImpact / 0.9;
      ctx.globalAlpha = (1 - f) * 0.85; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1 - f; ctx.strokeStyle = col; ctx.lineWidth = 14 * (1 - f) + 2;
      ctx.beginPath(); ctx.arc(cx, cy, 40 + f * Math.max(W, H), 0, Math.PI * 2); ctx.stroke();
    }
    // 5) skill name banner
    ctx.globalAlpha = Math.min(1, elapsed / 0.35) * (c.t < 0.6 ? c.t / 0.6 : 1);
    ctx.textAlign = 'center';
    ctx.font = `900 ${this.game.isTouch ? 30 : 42}px system-ui, sans-serif`;
    ctx.shadowColor = col; ctx.shadowBlur = 24;
    ctx.fillStyle = '#fff';
    ctx.fillText(c.name, W / 2, H * 0.5);
    ctx.shadowBlur = 0; ctx.globalAlpha = (ctx.globalAlpha) * 0.9;
    ctx.font = `700 ${this.game.isTouch ? 12 : 15}px system-ui, sans-serif`;
    ctx.fillStyle = col;
    ctx.fillText(en ? 'ULTIMATE' : '必 杀 技', W / 2, H * 0.5 + (this.game.isTouch ? 26 : 34));
    ctx.restore();
  };


P.drawPackMorale = function(ctx, W) {
    // The always-visible DOM HP track sits below the global utility toolbar.
    // Suppress the old world-space copy, which rendered under that toolbar
    // and gave the impression that the enemy had no HP.
    if(document.querySelector?.('#battle-ui.on .battle-enemy-track'))return;
    const live = this.liveEnemies();
    if (!live.length) return;
    let hp = 0, max = 0;
    for (const e of this.enemies) { max += e.maxhp; if (e.alive) hp += e.hp; }
    const frac = max ? Math.max(0, Math.min(1, hp / max)) : 0;
    const zh = window.MorrowwishI18n?.get?.() === 'zh';
    const bw = Math.min(360, W - 120), bx = (W - bw) / 2, by = 16, bh = 12;
    const ready = this.captureReady;
    ctx.save();
    ctx.textAlign = 'center'; ctx.font = '700 11px system-ui, sans-serif';
    ctx.fillStyle = ready ? '#ffd36b' : 'rgba(255,250,239,.95)';
    ctx.fillText(ready ? (zh ? '斗志将尽 · 收服它！' : 'Almost tamed — capture it!') : (zh ? '野猫斗志' : 'Wild morale'), W / 2, by - 3);
    // track
    ctx.fillStyle = 'rgba(20,12,30,0.55)'; rr(ctx, bx - 2, by - 2, bw + 4, bh + 4, 8); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.14)'; rr(ctx, bx, by, bw, bh, 6); ctx.fill();
    // fill (turns gold when capture-ready)
    const col = ready ? '#ffd36b' : (frac > 0.5 ? '#ff6b8a' : '#ff9db0');
    ctx.fillStyle = col; rr(ctx, bx, by, bw * frac, bh, 6); ctx.fill();
    if (ready) { ctx.globalAlpha = 0.4 + 0.4 * Math.abs(Math.sin(this.t * 8)); ctx.strokeStyle = '#ffd36b'; ctx.lineWidth = 2; rr(ctx, bx - 2, by - 2, bw + 4, bh + 4, 8); ctx.stroke(); }
    ctx.restore();
  };


})();