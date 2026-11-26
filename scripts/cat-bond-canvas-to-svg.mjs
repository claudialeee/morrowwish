// Deterministic Canvas2D subset used by the production VFX atlas. Not a
// browser screenshot: shadow blur and additive blending are approximations.
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const fmt=n=>{if(!Number.isFinite(n))throw Error('nonfinite coordinate '+n);return String(Math.round(n*1000)/1000)};
const mul=(a,b)=>[a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];
const tr=m=>'matrix('+m.map(fmt).join(' ')+')';
export class AtlasSVG {
 constructor(prefix){this.prefix=prefix;this.n=0;this.nodes=[];this.defs=[];this.stack=[];this.s={m:[1,0,0,1,0,0],fillStyle:'#000',strokeStyle:'#000',globalAlpha:1,lineWidth:1,lineCap:'butt',lineJoin:'miter',globalCompositeOperation:'source-over',font:'12px sans-serif',textAlign:'start',clip:null};this.beginPath();}
 get globalAlpha(){return this.s.globalAlpha}set globalAlpha(v){if(Number.isFinite(v)&&v>=0&&v<=1)this.s.globalAlpha=v}
 get fillStyle(){return this.s.fillStyle}set fillStyle(v){this.s.fillStyle=v}
 get strokeStyle(){return this.s.strokeStyle}set strokeStyle(v){this.s.strokeStyle=v}
 get lineWidth(){return this.s.lineWidth}set lineWidth(v){if(v>0&&Number.isFinite(v))this.s.lineWidth=v}
 get lineCap(){return this.s.lineCap}set lineCap(v){this.s.lineCap=v}
 get lineJoin(){return this.s.lineJoin}set lineJoin(v){this.s.lineJoin=v}
 get globalCompositeOperation(){return this.s.globalCompositeOperation}set globalCompositeOperation(v){this.s.globalCompositeOperation=v}
 get font(){return this.s.font}set font(v){this.s.font=v}get textAlign(){return this.s.textAlign}set textAlign(v){this.s.textAlign=v}
 save(){this.stack.push({...this.s,m:[...this.s.m]})}
 restore(){if(!this.stack.length)throw Error('restore underflow');this.s=this.stack.pop()}
 transform(...m){this.s.m=mul(this.s.m,m)}translate(x,y){this.transform(1,0,0,1,x,y)}rotate(a){this.transform(Math.cos(a),Math.sin(a),-Math.sin(a),Math.cos(a),0,0)}scale(x,y){this.transform(x,0,0,y,0,0)}
 beginPath(){this.d=[];this.current=null;this.first=null}
 moveTo(x,y){this.d.push('M'+fmt(x)+' '+fmt(y));this.current=[x,y];this.first=[x,y]}
 lineTo(x,y){if(!this.current)return this.moveTo(x,y);this.d.push('L'+fmt(x)+' '+fmt(y));this.current=[x,y]}
 quadraticCurveTo(x,y,a,b){if(!this.current)this.moveTo(x,y);this.d.push('Q'+[x,y,a,b].map(fmt).join(' '));this.current=[a,b]}
 bezierCurveTo(x,y,a,b,u,v){if(!this.current)this.moveTo(x,y);this.d.push('C'+[x,y,a,b,u,v].map(fmt).join(' '));this.current=[u,v]}
 closePath(){if(this.current){this.d.push('Z');this.current=this.first}}
 rect(x,y,w,h){this.moveTo(x,y);this.lineTo(x+w,y);this.lineTo(x+w,y+h);this.lineTo(x,y+h);this.closePath()}
 arc(x,y,r,start,end,ccw=false){this.ellipse(x,y,r,r,0,start,end,ccw)}
 ellipse(x,y,rx,ry,rot,start,end,ccw=false){
  if(rx<0||ry<0)throw Error('negative radius');
  const tau=2*Math.PI,raw=end-start;let d=raw;
  if(!ccw){if(raw>=tau)d=tau;else while(d<0)d+=tau;}
  else{if(raw<=-tau)d=-tau;else while(d>0)d-=tau;}
  if(Math.abs(d)<1e-7)return;
  const at=a=>[x+Math.cos(a)*rx*Math.cos(rot)-Math.sin(a)*ry*Math.sin(rot),y+Math.cos(a)*rx*Math.sin(rot)+Math.sin(a)*ry*Math.cos(rot)];
  const first=at(start);if(this.current)this.lineTo(...first);else this.moveTo(...first);
  const n=Math.ceil(Math.abs(d)/Math.PI);
  for(let j=1;j<=n;j++){const q=at(start+d*j/n);this.d.push('A'+[rx,ry,rot*180/Math.PI,0,d>0?1:0,...q].map(fmt).join(' '));this.current=q}
 }
 gradient(type,args){const g={id:this.prefix+'g'+(++this.n),type,args,stops:[],addColorStop(p,color){if(p<0||p>1)throw Error('gradient stop');this.stops.push([p,color])}};return g}
 createLinearGradient(...a){return this.gradient('linear',a)}createRadialGradient(...a){return this.gradient('radial',a)}
 paint(v){
   if(!v||typeof v!=='object')return esc(v||'#000');
   if(!v.emitted){v.emitted=true;let attrs=v.type==='linear'?['x1','y1','x2','y2'].map((k,i)=>k+'="'+fmt(v.args[i])+'"').join(' '):'fx="'+fmt(v.args[0])+'" fy="'+fmt(v.args[1])+'" fr="'+fmt(v.args[2])+'" cx="'+fmt(v.args[3])+'" cy="'+fmt(v.args[4])+'" r="'+fmt(Math.max(.001,v.args[5]))+'"';
    const tag=v.type+'Gradient';const stops=v.stops.map(([p,color])=>{const m=/^rgba\(([^,]+),([^,]+),([^,]+),([^\)]+)\)$/.exec(color);return '<stop offset="'+fmt(p)+'" stop-color="'+esc(m?'rgb('+m[1]+','+m[2]+','+m[3]+')':color)+'"'+(m?' stop-opacity="'+fmt(Math.max(0,Math.min(1,+m[4])))+'"':'')+'/>'}).join('');
    this.defs.push('<'+tag+' id="'+v.id+'" gradientUnits="userSpaceOnUse" '+attrs+'>'+stops+'</'+tag+'>');
   }return 'url(#'+v.id+')';
 }
 add(s){if(this.s.globalAlpha<=0)return;this.nodes.push((this.s.clip?'<g clip-path="url(#'+this.s.clip+')">':'')+s+(this.s.clip?'</g>':''))}
 drawPath(fill){if(!this.d.length)return;const color=this.paint(fill?this.s.fillStyle:this.s.strokeStyle);this.add('<path d="'+this.d.join(' ')+'" transform="'+tr(this.s.m)+'" opacity="'+fmt(this.s.globalAlpha)+'" '+(fill?'fill="'+color+'"':'fill="none" stroke="'+color+'" stroke-width="'+fmt(this.s.lineWidth)+'" stroke-linecap="'+esc(this.s.lineCap)+'" stroke-linejoin="'+esc(this.s.lineJoin)+'"')+'/>')}
 fill(){this.drawPath(true)}stroke(){this.drawPath(false)}
 clip(){const id=this.prefix+'c'+(++this.n);this.defs.push('<clipPath id="'+id+'"><path transform="'+tr(this.s.m)+'" d="'+this.d.join(' ')+'"/></clipPath>');this.s.clip=id}
 fillRect(x,y,w,h){this.add('<rect x="'+fmt(x)+'" y="'+fmt(y)+'" width="'+fmt(w)+'" height="'+fmt(h)+'" transform="'+tr(this.s.m)+'" opacity="'+fmt(this.s.globalAlpha)+'" fill="'+this.paint(this.s.fillStyle)+'"/>')}
 strokeRect(x,y,w,h){this.add('<rect x="'+fmt(x)+'" y="'+fmt(y)+'" width="'+fmt(w)+'" height="'+fmt(h)+'" transform="'+tr(this.s.m)+'" opacity="'+fmt(this.s.globalAlpha)+'" fill="none" stroke="'+this.paint(this.s.strokeStyle)+'" stroke-width="'+fmt(this.s.lineWidth)+'"/>')}
 fillText(s,x,y){const size=/([0-9.]+)px/.exec(this.s.font)?.[1]||12;this.add('<text x="'+fmt(x)+'" y="'+fmt(y)+'" transform="'+tr(this.s.m)+'" fill="'+this.paint(this.s.fillStyle)+'" opacity="'+fmt(this.s.globalAlpha)+'" font-family="sans-serif" font-size="'+size+'" text-anchor="'+(this.s.textAlign==='center'?'middle':'start')+'">'+esc(s)+'</text>')}
 strokeText(){}setLineDash(){}clearRect(){}
 finish(){if(this.stack.length)throw Error('unbalanced saves '+this.stack.length);return '<defs>'+this.defs.join('')+'</defs>'+this.nodes.join('')}
}
export function sheet(atlas,items,title,groupId){
 const width=1200,head=80,row=338,height=head+items.length*row+22;
 const out=['<svg xmlns="http://www.w3.org/2000/svg" width="'+width+'" height="'+height+'" viewBox="0 0 '+width+' '+height+'"><rect width="100%" height="100%" fill="#202f2a"/><g font-family="sans-serif" fill="#f3efdf"><text x="24" y="33" font-size="25" font-weight="bold">'+esc(title)+'</text><text x="24" y="56" font-size="13" fill="#bccbbc">Production renderer / isolated fixture / SVG conversion; not live combat. Native 600 × 300 per phase.</text></g>'];
 items.forEach((v,i)=>{const y=head+i*row;out.push('<text x="24" y="'+(y+17)+'" fill="#f3efdf" font-family="sans-serif" font-size="18" font-weight="bold">'+esc(v.name)+' · '+esc(v.id)+'</text>');
 for(let phase=0;phase<2;phase++){const c=new AtlasSVG(groupId+i+'p'+phase);atlas.render(c,v,phase,phase?.32:.20);const x=phase*600;
 out.push('<svg x="'+x+'" y="'+(y+25)+'" width="600" height="300" viewBox="0 0 600 300">'+c.finish()+'<text x="24" y="42" font-family="sans-serif" font-size="14" fill="#f3efdf">'+(phase?'CONTACT / PHASE B':'CAST / PHASE A')+'</text></svg>');}
 });out.push('</svg>');return out.join('');
}
