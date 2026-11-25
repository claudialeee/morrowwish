// Local acceptance host. Uses the production cloud handler and real SQLite,
// without accessing any Cloudflare production credentials or database.
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../public/',import.meta.url));
const source=await fs.readFile(new URL('../src/cat-bond-cloud-save.js',import.meta.url),'utf8');
const {catBondCloudSave}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const sql=new DatabaseSync(':memory:');
const DB={prepare(query){
 let args=[];
 return {bind(...params){args=params;return this;},
  async run(){const r=sql.prepare(query).run(...args);return {success:true,meta:{changes:Number(r.changes)}};},
  async first(){return sql.prepare(query).get(...args)||null;}};
}};
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.mp3':'audio/mpeg','.ogg':'audio/ogg','.woff2':'font/woff2'};
const server=http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://127.0.0.1:8765');
  if(url.pathname==='/api/cat-bond-cloud-save'){
   let body; if(req.method==='PUT'){const chunks=[];let length=0;for await(const c of req){length+=c.length;if(length>710000){res.writeHead(413).end();return;}chunks.push(c);}body=Buffer.concat(chunks);}
   const result=await catBondCloudSave(new Request(url,{method:req.method,headers:req.headers,...(body?{body}:{} )}),{DB});
   res.writeHead(result.status,Object.fromEntries(result.headers));res.end(Buffer.from(await result.arrayBuffer()));return;
  }
  if(url.pathname.startsWith('/api/')){res.writeHead(200,{'content-type':'application/json'}).end('{}');return;}
  let target=path.resolve(root,'.'+decodeURIComponent(url.pathname));
  const relative=path.relative(root,target);
  if(relative==='..'||relative.startsWith('..'+path.sep)||path.isAbsolute(relative)){res.writeHead(403).end();return;}
  if((await fs.stat(target)).isDirectory())target=path.join(target,'index.html');
  const content=await fs.readFile(target);
  res.writeHead(200,{'content-type':types[path.extname(target)]||'application/octet-stream','cache-control':'no-store'});res.end(content);
 }catch(e){res.writeHead(404).end('Not found');}
});
server.listen(8765,'127.0.0.1',()=>console.log('Local Cat Bond acceptance server on 8765 (ephemeral SQLite)'));
