// Authored recruitment, part of the same transaction as scene completion.
export const recruitment = Object.freeze({
 "harbor:H-04":["muling"],"harbor:H-05":["qilan","jiedeng"],
 "forest:R-04":["yahe","yuchuan"],"forge:E-04":["xiaomao","jinpo"],
 "sky:S-05":["yuanfan","lingyu"],"library:M-05":["baikan","moye"],
 "starfall:F-04":["xingya","lichuan"]
});
const copy=x=>JSON.parse(JSON.stringify(x));
export function storyPartyPatch(root,previous,next,makeCat,decorate=()=>{}){
 const finished=next.completed.filter(id=>!previous.completed.includes(id));
 if(!finished.some(id=>recruitment[id]||id==="epilogue:E-03"))return null;
 if(!Array.isArray(root.cats)||typeof makeCat!=="function")return null;
 let cats=[...root.cats],away={...(root.storyAway||{})};
 const duo=copy(root.duoRelations||{pairs:{},active:[]});duo.pairs||={};duo.active||=[];
 const prefs={...(root.battlePrefs||{})};
 let team=Array.isArray(prefs.teamUids)?[...prefs.teamUids]:cats.slice(0,5).map(c=>c.uid);
 const joined=[],left=[];let showcase=root.firstDuoShowcasePending;
 const player=cats.find(c=>c.species==="jinjc")||cats[0];
 const seed=(a,b)=>{if(!a||!b||a.uid===b.uid)return;const k=[a.uid,b.uid].sort().join(":");const p=duo.pairs[k]||(duo.pairs[k]={value:0,lastPlay:0});p.value=Math.max(20,p.value||0);};
 for(const scene of finished){
  for(const actor of recruitment[scene]||[]){
   if(cats.some(c=>c.storyActor===actor)||away[actor])continue;
   const cat=makeCat("story_"+actor,{affinity:35});decorate(cat);cat.storyActor=actor;cat.shiny=false;
   for(const other of cats)if(other===player||other.storyActor)seed(other,cat);
   cats.push(cat);joined.push(actor);
   if(actor==="muling"&&player){team=[player.uid,cat.uid,...team.filter(u=>u!==player.uid&&u!==cat.uid)].slice(0,5);duo.active=[player.uid,cat.uid];showcase=true;}
   else if(team.length<5)team.push(cat.uid);
  }
  if(scene==="library:M-05"){
   const cat=cats.find(c=>c.storyActor==="muling");
   if(cat){away.muling=cat;cats=cats.filter(c=>c.uid!==cat.uid);team=team.filter(u=>u!==cat.uid);if(duo.active.includes(cat.uid))duo.active=[];left.push("muling");}
  }
  if(scene==="epilogue:E-03"&&away.muling){
   const cat=away.muling;delete away.muling;if(!cats.some(c=>c.uid===cat.uid)){for(const other of cats)if(other===player||other.storyActor)seed(other,cat);cats.push(cat);if(team.length<5)team.push(cat.uid);joined.push("muling");}
  }
 }
 const available=new Set(cats.map(c=>c.uid));team=[...new Set(team)].filter(u=>available.has(u)).slice(0,5);
 prefs.teamUids=team;
 return {fields:{cats,storyAway:away,duoRelations:duo,battlePrefs:prefs,...(showcase!==undefined?{firstDuoShowcasePending:showcase}:{})},joined,left};
}
