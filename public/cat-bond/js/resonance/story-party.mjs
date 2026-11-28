// Authored recruitment, part of the same transaction as scene or reunion completion.
export const recruitment = Object.freeze({
 "harbor:H-03":["muling"],"harbor:H-04":["muling"],"harbor:H-05":["qilan"],
 "forest:R-01":["yahe"],"forest:R-04":["yahe"],"forge:E-04":["xiaomao","jinpo"],
 "sky:S-05":["yuanfan","lingyu"],"library:M-05":["baikan"],
 "starfall:F-04":["xingya"]
});
export const optionalRecruitment = Object.freeze({
 "postgame:reunion-harbor":["jiedeng"],"postgame:reunion-forest":["yuchuan"],
 "postgame:reunion-library":["moye"],"postgame:reunion-starfall":["lichuan"]
});
export const companionRoles=Object.freeze({"qilan":"core","xiaomao":"core","yuanfan":"core","baikan":"core","muling":"core","yahe":"support","jinpo":"support","lingyu":"support","xingya":"support","jiedeng":"regional","yuchuan":"regional","moye":"regional","lichuan":"regional"});
const copy=x=>JSON.parse(JSON.stringify(x));
export function storyPartyPatch(root,previous,next,makeCat,decorate=()=>{}){
 const finished=next.completed.filter(id=>!previous.completed.includes(id));
 const reunions=(next.postgame||[]).filter(id=>!(previous.postgame||[]).includes(id)&&optionalRecruitment[id]);
 const restoreLuna=!!root.storyAway?.muling&&next.completed.includes("finale:B-02");
 if(!finished.some(id=>recruitment[id]||["finale:B-02","epilogue:E-03"].includes(id))&&!reunions.length&&!restoreLuna)return null;
 if(!Array.isArray(root.cats)||typeof makeCat!=="function")return null;
 let cats=[...root.cats],away={...(root.storyAway||{})};
 const duo=copy(root.duoRelations||{pairs:{},active:[]});duo.pairs||={};duo.active||=[];
 const prefs={...(root.battlePrefs||{})};
 let team=Array.isArray(prefs.teamUids)?[...prefs.teamUids]:cats.slice(0,5).map(c=>c.uid);
 const joined=[],left=[];let showcase=root.firstDuoShowcasePending;
 const player=cats.find(c=>c.species==="jinjc")||cats[0];
 const seed=(a,b)=>{if(!a||!b||a.uid===b.uid)return;const k=[a.uid,b.uid].sort().join(":");const p=duo.pairs[k]||(duo.pairs[k]={value:0,lastPlay:0});p.value=Math.max(20,p.value||0);};
 for(const scene of [...finished,...reunions,...(restoreLuna&&!finished.includes("finale:B-02")?["finale:B-02"]:[])]){
  // Leave before recruiting Ivy so the vacated active slot can be filled.
  if(scene==="library:M-05"){
   const cat=cats.find(c=>c.storyActor==="muling");
   if(cat){away.muling=cat;cats=cats.filter(c=>c.uid!==cat.uid);team=team.filter(u=>u!==cat.uid);if(duo.active.includes(cat.uid))duo.active=[];left.push("muling");}
  }
  for(const actor of recruitment[scene]||optionalRecruitment[scene]||[]){
   if(cats.some(c=>c.storyActor===actor)||away[actor])continue;
   const cat=makeCat("story_"+actor,{affinity:35});decorate(cat);cat.storyActor=actor;cat.shiny=false;
   for(const other of cats)if(other===player||other.storyActor)seed(other,cat);
   cats.push(cat);joined.push(actor);
   if(actor==="muling"&&player){team=[player.uid,cat.uid,...team.filter(u=>u!==player.uid&&u!==cat.uid)].slice(0,5);duo.active=[player.uid,cat.uid];showcase=true;}
   else if(companionRoles[actor]==="core"&&team.length<5)team.push(cat.uid);
  }
  if(["finale:B-02","epilogue:E-03"].includes(scene)&&away.muling){
   const cat=away.muling;delete away.muling;if(!cats.some(c=>c.uid===cat.uid)){for(const other of cats)if(other===player||other.storyActor)seed(other,cat);cats.push(cat);if(player){team=[player.uid,cat.uid,...team.filter(u=>u!==player.uid&&u!==cat.uid)].slice(0,5);duo.active=[player.uid,cat.uid];}else if(team.length<5)team.push(cat.uid);joined.push("muling");}
  }
 }
 const available=new Set(cats.map(c=>c.uid));team=[...new Set(team)].filter(u=>available.has(u)).slice(0,5);
 prefs.teamUids=team;
 return {fields:{cats,storyAway:away,duoRelations:duo,battlePrefs:prefs,...(showcase!==undefined?{firstDuoShowcasePending:showcase}:{})},joined,left};
}
