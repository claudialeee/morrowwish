/* Deterministic effect-only QA stage. All effects use the shipped renderer;
   coordinates/actors are fixtures, not a live gameplay or damage test. */
(()=>{'use strict';
const W=600,H=300,PI=Math.PI,T=PI*2;
const P={fire:'#d59256',water:'#95bacb',grass:'#90ac78',elec:'#cfb971',dark:'#9990b8',light:'#dfd0ac',neutral:'#c9a882'};
const names={tangyuan:'汤圆',dundun:'团团',lanbao:'蓝莓',senlin:'松松',abi:'杏仁',wumao:'桃桃',moqiu:'墨球',niuniu:'奥利奥',meidu:'圈圈',duanduan:'跳跳',yunduo:'云朵',bosi:'绒绒',nietu:'奶酥',jiafei:'圆宝',qisi:'芝士',jinwu:'焰焰',nuowei:'枫枫',lixiao:'绅绅',sanhua:'花花',xiaohui:'小雾',xianluo:'露露',youling:'幽幽',yuelian:'月月',doudou:'豆豆',baomao:'斑斑',xingchen:'星星',fanmao:'奶糖',mengmai:'夜夜',yinghua:'樱桃',xuewa:'雪袜',zherdd:'布丁',jinjc:'金豆',nainai:'雪团'};
const effects=['light','heavy','slash','smash','fire','water','ice','elec','dark','grass','vine','heal','cleanse','guard','barrier','reflect','wardFade','shieldBreak','stagger','kill','crit'];
const labels=['普通命中','重击','斩击','重砸','火焰命中','水流命中','冰晶命中','电击命中','暗影命中','草系命中','藤蔓撕击','治疗','净化','守护','护盾','反弹','护盾消退','护盾破裂','韧性击破','终结','暴击'];
const tags=['burn','soak','shock','oil','chill','dizzy','bleed','blind','bind','expose','weaken','rust','rewind'];
const elements=['fire','water','grass','elec','dark','light'];
function getCases(){const sk=window.Skills.SKILLS.filter(s=>!s.legacy);
 return [...sk.map(s=>({id:s.id,name:s.name,group:s.ultCost?'ult':s.element,kind:s.id==='magneticField'?'magnetic':s.ultCost?'ult':'skill',sk:s})),...window.CatBondTraitFX.ids.map(id=>({id,name:names[id]||id,group:'passive',kind:'passive'})),...effects.map((id,i)=>({id,name:labels[i],group:'contact',kind:'contact'})),...tags.map(id=>({id,name:id,group:'status',kind:'status'})),...elements.flatMap((a,i)=>elements.slice(i).map(b=>({id:[a,b].sort().join('+'),name:a+' + '+b,group:'duo',kind:'duo'})))];}
function oval(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,T);c.fill();}
function cat(c,x,y,col,face=1){c.save();c.translate(x,y);oval(c,0,15,23,7,'#3c5044');c.scale(face,1);c.lineWidth=2;c.strokeStyle='#4c5047';c.fillStyle=col;c.beginPath();c.moveTo(-18,0);c.bezierCurveTo(-26,-10,-28,-27,-15,-21);c.lineTo(-6,-14);c.lineTo(9,-15);c.lineTo(20,-26);c.lineTo(23,-6);c.bezierCurveTo(29,14,10,20,-5,17);c.bezierCurveTo(-20,18,-25,9,-18,0);c.closePath();c.fill();c.stroke();oval(c,5,-3,1.8,2.2,'#393c36');oval(c,15,-3,1.8,2.2,'#393c36');oval(c,10,3,2.5,1.4,'#9e7469');c.restore();}
function stage(c){c.fillStyle='#435a48';c.fillRect(0,0,W,H);c.fillStyle='#536b50';c.fillRect(12,12,W-24,H-24);c.strokeStyle='#61765a';c.lineWidth=.8;for(let i=24;i<W;i+=42){c.beginPath();c.moveTo(i,15);c.lineTo(i,H-15);c.stroke();}for(let i=24;i<H;i+=42){c.beginPath();c.moveTo(15,i);c.lineTo(W-15,i);c.stroke();}c.strokeStyle='#849378';c.lineWidth=1;c.strokeRect(12,12,W-24,H-24);}
function render(c,item,phase=0,t=.25){
 const F=window.CatBondSkillFX,U=window.CatBondUltVFX,M=window.CatBondMoonFX,C=window.CatBondContactFX,A=window.CatBondTraitFX;
 const sk=item.sk,el=sk?.element||'light',x=125,y=165,ex=['waterJet','shadowTendrils'].includes(sk?.id)?286:440,ey=165,time=.8+t,contact=(style,tier='heavy',px=ex,py=ey)=>C.draw(c,{style,tier,element:el,skillId:item.kind==='skill'?sk?.id:null,x:px,y:py,angle:0,life:1-t,max:1},time);
 stage(c);const melee=sk?.kind==='melee',close=melee?ex-52:x,ally=['heal','buff'].includes(sk?.kind)||['heal','cleanse','guard','barrier','wardFade','shieldBreak'].includes(item.id);
 if(item.kind==='skill'){
   const v={kind:phase?'signatureHit':'signatureCast',skillId:sk.id,x:phase?ex:close,y,angle:0,heavy:!!sk.heavy,life:1-t,max:1};
   if(sk.id==='arcanePulse'){
     const offsets=[0,24,-24];
     if(phase){for(let j=0;j<3;j++)F.draw(c,{...v,umbralGround:true,r:sk.lobRadius,index:j,x:ex-20*j,y:ey+offsets[j],life:Math.max(.04,.62-(.12+j*.09+t*.15)),max:.62},time);}
     else for(let j=0;j<3;j++)F.drawUmbralLob(c,{sx:x+16,sy:y,tx:ex-20*j,ty:ey+offsets[j],r:sk.lobRadius,index:j,height:106,flight:.76,age:.76*(.79-j*.30)},time);
   }else if(sk.id==='meteor'){if(phase){F.draw(c,{...v,meteorGround:true,r:86,life:1-t,max:1},time);}else F.drawMeteorFlight(c,{burst:{tx:ex,ty:ey,r:86,skill:sk},life:.42},time);}
   else if(sk.kind==='aoe'&&sk.field){if(phase)F.drawMaterialField(c,{element:sk.field.element||el,r:82,x:ex,y:ey,t:4},time);}
   if(sk.kind==='buff'&&sk.id==='mirrorWall')window.CatBondWardArt?.drawFlatWall(c,{x:ex,y:ey,angle:0,halfLength:110,age:.4,remaining:4,hitAge:phase?.18:0},time);
   if(sk.kind==='beam'){F.drawCombatBeam(c,{sk,_ox:['waterJet','shadowTendrils'].includes(sk.id)?x+22:x,_oy:y,width:sk.width||22,max:1.4,t:.7},time,['waterJet','shadowTendrils'].includes(sk.id)?x+22+sk.reach:ex,ey);}
   else if(['waterLash','frostLance','prismBeam'].includes(sk.id)){F.drawInstantLine(c,{kind:sk.id==='waterLash'?'water':sk.id==='frostLance'?'ice':'prism',x,y,x2:ex+65,y2:ey,life:.7,max:1},time);}
   else if(sk.kind==='chain'){F.drawInstantLine(c,{kind:'lightning',x,y,x2:ex,y2:ey,life:.82,max:1},time);F.drawInstantLine(c,{kind:'lightning',x:ex,y:ey,x2:ex+58,y2:ey-73,life:.73,max:1},time);}
   else if(sk.kind==='projectile'&&!phase){
      const kind=sk.id==='crescentFan'?'crescent':sk.id==='fireballMeow'?'fireball':sk.id==='hex'?'hex':sk.id==='lightningOrb'||sk.id==='boltSwarm'?'lightningOrb':sk.id==='leafDart'||sk.id==='homingSeed'?'leaf':'orb';
      const n=sk.id==='crescentFan'?3:sk.pulseCount?2:sk.shots?Math.min(5,sk.shots):sk.id==='leafDart'?3:1;
      for(let j=0;j<n;j++){const p={kind,x:270-j*(sk.pulseCount?55:8),y:y+(j-(n-1)/2)*(sk.pulseCount?5:18),r:kind==='crescent'?14:kind==='fireball'?15:kind==='lightningOrb'?13:kind==='hex'?13:9,ang:0,vx:250,vy:0,skill:sk,owner:'me'};
        if(!M.drawProjectile(c,p,time))F.drawIdentityProjectile(c,p,time);}
   }else if(['dash','pounce','leap'].includes(sk.kind)&&!phase){F.drawTravel(c,[{x:145,y,x2:345,y2:y,element:el,start:time-.045}],time);}
   cat(c,phase&&['dash','pounce','leap'].includes(sk.kind)?ex-36:close,y,P[el]||P.neutral);cat(c,ex,ey,ally?'#c4cbb0':'#a9b1bb',-1);
   if(sk.id==='waterJet')cat(c,ex+92,ey,'#a9b1bb',-1);
   if(sk.id==='shadowTendrils')cat(c,ex+65,ey+18,'#a9b1bb',-1);
   if(sk.kind==='chain')cat(c,ex+58,ey-73,'#a9b1bb',-1);
   if(melee&&!phase){const a=new window.VFX();a.slash(close,y,0,P[el],sk.heavy?104:81,.72,{heavy:!!sk.heavy,element:el});a.update(.12);a.draw(c);}
   if(sk.kind==='heal'||sk.kind==='buff'){
     if(sk.id!=='mirrorWall')F.draw(c,{...v,kind:'signatureCast',x:phase?ex:close},time);
     if(phase)contact(sk.kind==='heal'?'heal':'barrier','light');
   }else if(phase){if(sk.id==='crescentFan')M.drawImpact(c,{x:ex,y:ey,angle:0,radius:32,life:1-t,max:1},time);
     else if(sk.id==='waterJet'){for(const px of [ex,ex+92])F.draw(c,{kind:'waterPierce',x:px,y:ey,radius:18,angle:0,life:1-t,max:1},time);}
     else if(sk.id==='shadowTendrils'){for(const [px,py] of [[ex,ey],[ex+65,ey+18]])F.draw(c,{kind:'shadowBindHit',x:px,y:py,radius:18,angle:0,life:1-t,max:1},time);}
     else if(sk.id!=='arcanePulse')contact(C.classify(sk.heavy||melee?'heavy':'light',sk),sk.heavy||melee?'heavy':'light');}
   else if(!['projectile','beam','chain','melee','dash','pounce','leap','aoe'].includes(sk.kind))F.draw(c,v,time);
 }else if(item.kind==='ult'){
   const v={kind:'ultimate',skillId:sk.id,x:185,y,angle:0,targets:[{x:ex,y:ey},{x:ex-72,y:ey-75},{x:ex-28,y:ey+64}],reach:350,width:36,life:phase?.43:.74,max:1};
   if(sk.id==='sunbloom'&&!phase){cat(c,185,y,P[el]);cat(c,ex,ey,'#a9b1bb',-1);U.drawSolarCharge(c,{x:185,y,aim:0,reach:350,width:36},.8,time);}
   else {U.draw(c,v,W,H,time,'back');cat(c,185,y,P[el]);for(const e of v.targets)cat(c,e.x,e.y,'#a9b1bb',-1);U.draw(c,v,W,H,time,'front');if(phase&&sk.kind!=='heal')contact(C.classify('heavy',sk),'heavy');}
 }else if(item.kind==='passive'){
   cat(c,x,y,P.light);cat(c,ex,ey,'#a9b1bb',-1);
   const self=['tangyuan','dundun','senlin','nietu','wumao','abi','moqiu','nuowei','zherdd','bosi'].includes(item.id);
   A.drawEvent(c,{species:item.id,phase:phase?'fire':'ready',x:(!phase&&self||item.id==='dundun')?x:ex,y:ey,ox:x,oy:y,start:0,life:1,radius:90,level:5},t);
 }else if(item.kind==='contact'){
   cat(c,x,y,P.light);cat(c,ex,ey,'#a9b1bb',-1);
   const style=item.id==='crit'?'slash':item.id,tier=item.id==='crit'?'crit':item.id==='kill'?'kill':['light','heal','cleanse','guard','barrier','reflect','wardFade'].includes(item.id)?'light':'heavy';
   contact(style,tier);
 }else if(item.kind==='status'){
   cat(c,x,y,P.light);cat(c,ex,ey,'#a9b1bb',-1);
   F.drawStatus(c,{x:ex,y:ey,alive:true,status:{[item.id]:2},tags:[item.id]},time);
 }else if(item.kind==='duo'){
   cat(c,110,165,P[item.id.split('+')[0]]);cat(c,490,165,P[item.id.split('+')[1]],-1);
   window.CatBondDuoFinale?.draw(c,W,H,phase?.58:.30,item.id,2);
 }else if(item.kind==='magnetic'){
   window.CatBondMagneticFX.draw(c,{x:305,y:99},{x:305,y:231},time,1,22);
   cat(c,x,y,P.elec);cat(c,305,ey,'#a9b1bb',-1);cat(c,390,ey,'#a9b1bb',-1);
 }
}
window.CatBondVFXAtlas={getCases,render,W,H};
})();