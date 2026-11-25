// Uses the active save's existing currencies and consumables. No new inventory schema.
const row=(id,name,region,regionName,coins,fish,key,count,item)=>Object.freeze({id,name,region,regionName,coins,fish,key,count,item});
const kit=["猫猫急救包","First-aid kit"],lure=["幸运诱饵","Lucky lure"];
export const recipes=Object.freeze([
 row("field-kit",["随行急救包","Field dressing"],null,null,18,1,"medkits",1,kit),
 row("harbor-kit",["潮汐绷带","Tidewater dressing"],"harbor",["霁潮港","Misttide Harbor"],28,2,"medkits",2,kit),
 row("forest-lure",["林间诱饵","Rootsleep lure"],"forest",["眠根林","Rootsleep Forest"],12,2,"luckLure",2,lure),
 row("forge-kit",["暖炉救护包","Hearth medical supplies"],"forge",["赤炉环城","Emberforge City"],42,3,"medkits",3,kit),
 row("sky-lure",["风铃诱饵","Windchime lure"],"sky",["云脊群岛","Skyspine Isles"],22,3,"luckLure",3,lure),
 row("library-kit",["月镜救护包","Moonmirror medical supplies"],"library",["月镜书库","Moonmirror Library"],54,4,"medkits",4,kit),
 row("starfall-kit",["星铃救护包","Starbell medical supplies"],"starfall",["星坠原","Starfall Expanse"],65,5,"medkits",5,kit)
]);
export function craftSupply(State,owner,id){
 const s=State?.S,r=recipes.find(x=>x.id===id);
 if(!s||s!==owner||!r)return {ok:false,reason:"slot-or-recipe"};
 if(r.region&&!s.resonance?.sanctuaries?.includes(r.region))return {ok:false,reason:"locked"};
 if(!Number.isSafeInteger(s.coins)||!Number.isSafeInteger(s.fish)||s.coins<r.coins||s.fish<r.fish)return {ok:false,reason:"materials"};
 const old=s[r.key],value=old??0;
 if(!Number.isSafeInteger(value)||value<0||!Number.isSafeInteger(value+r.count))return {ok:false,reason:"inventory"};
 const coins=s.coins,fish=s.fish;s.coins-=r.coins;s.fish-=r.fish;s[r.key]=value+r.count;
 try{if(State.S===owner&&State.save()?.ok===true)return {ok:true,count:r.count,key:r.key}}catch{}
 s.coins=coins;s.fish=fish;if(old===undefined)delete s[r.key];else s[r.key]=old;
 return {ok:false,reason:"save-failed"}
}
