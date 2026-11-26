// Canon 2.2 artwork: lazy loading, alpha-aware placement, no changes to gameplay proof.
const cache=new Map(),bounds=new WeakMap();
export function canonArt(name){
 if(typeof globalThis.Image!=="function")return null;
 if(!cache.has(name)){const im=new Image();im.decoding="async";im.src=new URL("../../assets/canon22-final-art/"+name+".webp",import.meta.url).href;cache.set(name,im);}
 const im=cache.get(name);return im.complete&&im.naturalWidth?im:null;
}
export function visibleBounds(im){
 if(bounds.has(im))return bounds.get(im);
 let b=[0,0,im.naturalWidth,im.naturalHeight];
 try{const cv=document.createElement("canvas"),k=Math.min(1,256/Math.max(b[2],b[3]));cv.width=Math.max(1,Math.round(b[2]*k));cv.height=Math.max(1,Math.round(b[3]*k));const c=cv.getContext("2d",{willReadFrequently:true});c.drawImage(im,0,0,cv.width,cv.height);const data=c.getImageData(0,0,cv.width,cv.height).data;let l=cv.width,t=cv.height,r=-1,d=-1;for(let y=0;y<cv.height;y++)for(let x=0;x<cv.width;x++)if(data[(y*cv.width+x)*4+3]>24){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);d=Math.max(d,y);}if(r>=l){l=Math.max(0,l-2);t=Math.max(0,t-2);r=Math.min(cv.width-1,r+2);d=Math.min(cv.height-1,d+2);const sx=b[2]/cv.width,sy=b[3]/cv.height;b=[l*sx,t*sy,(r-l+1)*sx,(d-t+1)*sy];}}catch{/* fallback for unavailable pixel reads */}
 bounds.set(im,b);return b;
}
export function paintArt(c,name,x,y,w,h,ax=.5,ay=.5,angle=0){
 const im=canonArt(name);if(!im)return false;const b=visibleBounds(im),scale=Math.min(w/b[2],h/b[3]),dw=b[2]*scale,dh=b[3]*scale;
 c.save();c.translate(x,y);c.rotate(angle);c.drawImage(im,...b,-dw*ax,-dh*ay,dw,dh);c.restore();return true;
}
export function paintPlate(c,name,W,H,fx=.5,fy=.5){
 const im=canonArt(name);if(!im)return false;const k=Math.max(W/im.naturalWidth,H/im.naturalHeight),w=im.naturalWidth*k,h=im.naturalHeight*k;c.drawImage(im,(W-w)*fx,(H-h)*fy,w,h);return true;
}
export function paintBridge(c,name,a,b,W,H,height){
 const im=canonArt(name);if(!im)return false;const src=visibleBounds(im),dx=(b[0]-a[0])*W,dy=(b[1]-a[1])*H,len=Math.hypot(dx,dy);
 c.save();c.translate(a[0]*W,a[1]*H);c.rotate(Math.atan2(dy,dx));c.drawImage(im,...src,-6,-height*.45,len+12,height);c.restore();return true;
}
