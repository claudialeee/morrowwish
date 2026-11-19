import {api} from "./analytics.js";
export default {async fetch(request,env,ctx){
  const p=new URL(request.url).pathname;
  if(p.startsWith("/api/"))return api(request,env,ctx);
  if(p==="/_vercel/insights/script.js")return new Response("",{headers:{"content-type":"application/javascript"}});
  return env.ASSETS.fetch(request);
}};