import {api} from "./analytics.js";
export default {async fetch(request,env,ctx){
  const p=new URL(request.url).pathname;
  // Stable, short, first-party links for social profiles and individual game posts.
  // Do not record an unverified "click" on the redirect: preview bots may follow
  // redirects. The actual landing-page visit and game events are tracked by
  // telemetry.js, with these UTM parameters preserved across internal navigation.
  if(p.startsWith("/go/")){
    const parts=p.split("/").filter(Boolean);
    const sources=new Set(["youtube","tiktok","instagram","bluesky","reddit","itch","facebook"]);
    const games=new Set(["pawsibly-innocent","cat-bond","tiny-town","elsewhere","flip-dash","parcel-panic","pocket-aquarium"]);
    const source=parts[1],game=parts[2];
    if(parts[0]!=="go"||parts.length>3||!sources.has(source)||(game&&!games.has(game)))
      return new Response("Not found",{status:404,headers:{"cache-control":"no-store"}});
    if(request.method!=="GET"&&request.method!=="HEAD")
      return new Response("Method not allowed",{status:405,headers:{Allow:"GET, HEAD"}});
    const target=new URL(game?"/"+game+"/":"/","https://morrowwish.vercel.app");
    target.searchParams.set("utm_source",source);
    target.searchParams.set("utm_medium",game?"post":"profile");
    target.searchParams.set("utm_campaign",game||"studio");
    return new Response(null,{status:302,headers:{
      Location:target.toString(),"Cache-Control":"no-store, max-age=0",
      "X-Robots-Tag":"noindex, nofollow"
    }});
  }
  if(p.startsWith("/api/"))return api(request,env,ctx);
  if(p==="/_vercel/insights/script.js")return new Response("",{headers:{"content-type":"application/javascript"}});
  return env.ASSETS.fetch(request);
}};