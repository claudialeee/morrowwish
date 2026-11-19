// Detect newly promoted playable games rather than re-announcing every source edit.
// GitHub Actions sets PREVIOUS_SHA to github.event.before for push events.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { publishedGames } from './discovery.mjs';
const root=process.cwd();
const before=(process.env.PREVIOUS_SHA||'').trim();
const out=path.join(root,'release-kit');
fs.mkdirSync(out,{recursive:true});
const attr=(tag,key)=>tag.match(new RegExp('(?:^|\\s)'+key+'\\s*=\\s*["\\x27]([^"\\x27]+)["\\x27]','i'))?.[1]||'';
const visible=(html)=>new Set([...html.matchAll(/<a\b[^>]*>/gi)].map(m=>m[0]).filter(tag=>/^[a-z0-9-]+$/.test(attr(tag,'data-id'))&&attr(tag,'href')==='/'+attr(tag,'data-id')+'/').map(tag=>attr(tag,'data-id')));
let newGames=[];
if(/^[0-9a-f]{40}$/.test(before)&&!/^0{40}$/.test(before)){
 try{
  const previous=execFileSync('git',['show',before+':public/index.html'],{cwd:root,encoding:'utf8'});
  const was=visible(previous);
  newGames=publishedGames().filter(g=>!was.has(g.slug));
 }catch(e){console.warn('Could not inspect previous homepage; skipping automatic launch posts:',e.message);}
}else console.log('No previous main commit (or manual run); skip new-launch notifications.');
fs.writeFileSync(path.join(out,'new-launches.json'),JSON.stringify({commit:process.env.GITHUB_SHA||'',newGames},null,2)+'\n');
console.log('New public game launches:',newGames.map(g=>g.slug).join(', ')||'none');
