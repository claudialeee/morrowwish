import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

// Share cards use the same current illustrations as the live homepage, not legacy ruckus-button assets.
const VERSION='20261120', WIDTH=1200, HEIGHT=630;
const entries=[
 {slug:'morrow-wish',art:'art/cat-bond-home.webp',title:['Morrow Wish','Games'],note:'Little games. Big surprises.',bg:'#fff3e8',fg:'#4d364f',accent:'#df809e'},
 {slug:'cat-bond',art:'art/cat-bond-home.webp',title:['Cat Bond'],note:'A yard of cats. A world of adventures.',bg:'#fff1e9',fg:'#503f5f',accent:'#e98cab'},
 {slug:'pawsibly-innocent',art:'art/pawsibly-hatted-muted.avif',title:['Pawsibly','Innocent!'],note:'Three fish to steal. One human to fool.',bg:'#fff0e4',fg:'#553d51',accent:'#e9858d'},
 {slug:'tiny-town',art:'art/tiny-town-scene.svg',title:['No More Mondays:','Tiny Town'],note:'AI does the work. You make the wishes.',bg:'#ecf6ed',fg:'#3c584b',accent:'#72a78a'},
 {slug:'elsewhere',art:'art/elsewhere-scene.svg',title:['Elsewhere'],note:'What if you lived another life?',bg:'#f1ecfb',fg:'#493c66',accent:'#a691ce'},
 {slug:'flip-dash',art:'art/flip-dash-watercolor.svg',title:['Flip Dash'],note:'Flip gravity. Dodge spikes. Beat your best.',bg:'#f5efff',fg:'#443c63',accent:'#a28bdd'},
 {slug:'parcel-panic',art:'art/parcel-panic-watercolor.svg',title:['Parcel Panic'],note:'Three lanes. One click. Keep the streak.',bg:'#fff3e9',fg:'#655042',accent:'#eba16a'},
 {slug:'pocket-aquarium',art:'art/pocket-aquarium-watercolor.svg',title:['Pocket','Aquarium'],note:'Feed the fish. Keep the water clear.',bg:'#ebf8f4',fg:'#345c59',accent:'#67b5a6'}
];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));

export async function generateSocialCards(output,source=path.join(process.cwd(),'public')){
 const folder=path.join(output,'social','share-'+VERSION); fs.mkdirSync(folder,{recursive:true});
 for(const item of entries){
  const artwork=path.join(source,item.art);
  if(!fs.existsSync(artwork)) throw Error('Missing homepage illustration: '+artwork);
  const resized=await sharp(artwork).resize(635,474,{fit:'cover',position:'attention'}).png().toBuffer();
  const mask=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="635" height="474"><rect width="635" height="474" rx="30" fill="#fff"/></svg>');
  const rounded=await sharp(resized).composite([{input:mask,blend:'dest-in'}]).png().toBuffer();
  const fontSize=item.title.length>1?57:75;
  const title=item.title.map((line,i)=>'<text x="65" y="'+(269+i*82)+'" font-size="'+(line.length>14?42:fontSize)+'" font-weight="850" letter-spacing="-2" fill="'+item.fg+'">'+esc(line)+'</text>').join('');
  const parts=[];let part='';
  for(const word of item.note.split(' ')){const next=part?part+' '+word:word;if(next.length>29&&part){parts.push(part);part=word;}else part=next;}
  if(part)parts.push(part);
  const sub=parts.map((line,i)=>'<text x="65" y="'+(448+i*27)+'" font-size="18" font-weight="600" fill="'+item.fg+'">'+esc(line)+'</text>').join('');
  const svg=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">'
   +'<rect width="1200" height="630" fill="'+item.bg+'"/>'
   +'<circle cx="1112" cy="42" r="200" fill="'+item.accent+'" opacity=".14"/><circle cx="38" cy="604" r="155" fill="'+item.accent+'" opacity=".10"/>'
   +'<rect x="483" y="58" width="677" height="512" rx="42" fill="#fff" opacity=".89"/>'
   +'<rect x="504" y="77" width="635" height="474" rx="30" fill="'+item.accent+'" opacity=".22"/>'
   +'<g font-family="DejaVu Sans,Liberation Sans,Arial,sans-serif">'
   +'<text x="65" y="93" font-size="21" font-weight="800" letter-spacing="3" fill="'+item.fg+'">MORROW WISH</text>'
   +'<rect x="65" y="115" width="138" height="6" rx="3" fill="'+item.accent+'"/>'
   +'<text x="65" y="182" font-size="16" font-weight="800" letter-spacing="2" fill="'+item.fg+'" opacity=".65">FREE BROWSER GAME</text>'
   +title+sub
   +'<rect x="65" y="500" width="225" height="47" rx="23" fill="'+item.fg+'"/>'
   +'<text x="89" y="529" font-size="17" font-weight="800" fill="white">PLAY FREE ONLINE</text>'
   +'<text x="65" y="598" font-size="16" font-weight="600" fill="'+item.fg+'" opacity=".72">morrowwish.vercel.app</text>'
   +'</g></svg>');
  const dest=path.join(folder,item.slug+'.png');
  await sharp(svg).composite([{input:rounded,left:504,top:77}]).png({compressionLevel:9}).toFile(dest);
  const {width,height,format}=await sharp(dest).metadata();
  if(width!==WIDTH||height!==HEIGHT||format!=='png') throw Error('Bad share image '+item.slug);
  console.log('Generated 1200x630 social share card: '+item.slug);
 }
}
