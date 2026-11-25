export const MULING_INTERACTIONS = [
{id:"bitter-tea",title:{zh:"苦茶",en:"Bitter Tea"},summary:{zh:"一杯总是放凉的苦茶",en:"A cup of tea that always goes cold"},lines:[
{speaker:"player",face:"neutral",text:{zh:"又是苦茶？",en:"Bitter tea again?"}},
{speaker:"muling",face:"dry",text:{zh:"甜的会让人忘了自己刚才在想什么。",en:"Sweet tea makes people forget what they were just thinking."}},
{speaker:"player",face:"warm",text:{zh:"你总是记得那么多。",en:"You remember an awful lot."}},
{speaker:"muling",face:"warm",text:{zh:"所以我才喝苦的。",en:"That's why I drink it bitter."}}
]},
{id:"broken-bells",title:{zh:"坏掉的铃铛",en:"Broken Bells"},summary:{zh:"她收藏的每一枚都有来历",en:"Every broken bell has a story"},lines:[
{speaker:"player",face:"curious",text:{zh:"为什么收集这些坏掉的铃铛？",en:"Why do you collect broken bells?"}},
{speaker:"muling",face:"neutral",text:{zh:"它们曾经有用。坏掉不等于没有价值。",en:"They were useful once. Being broken doesn't make them worthless."}},
{speaker:"player",face:"warm",text:{zh:"那你会修好吗？",en:"Will you repair them?"}},
{speaker:"muling",face:"dry",text:{zh:"能修的就修。不能的，也先留着。",en:"The ones I can, yes. The others can wait here."}}
]},
{id:"map-check",title:{zh:"第三次检查地图",en:"The Third Map Check"},summary:{zh:"地图没变，她还没放心",en:"The map hasn't changed; she still isn't reassured"},lines:[
{speaker:"player",face:"curious",text:{zh:"你刚才已经看过地图三次了。",en:"You've checked the map three times already."}},
{speaker:"muling",face:"nervous",text:{zh:"地图没有变。",en:"The map hasn't changed."}},
{speaker:"player",face:"warm",text:{zh:"那你为什么还要看？",en:"Then why keep looking?"}},
{speaker:"muling",face:"dry",text:{zh:"确认它没有变。",en:"To make sure it hasn't."}}
]},
{id:"cooking",title:{zh:"厨房里的烟",en:"Smoke in the Kitchen"},summary:{zh:"修理机关很在行，做饭却不行",en:"A gifted mechanic, a disastrous cook"},lines:[
{speaker:"player",face:"curious",text:{zh:"厨房怎么冒烟了？",en:"Why is the kitchen smoking?"}},
{speaker:"muling",face:"sheepish",text:{zh:"我严格按着图纸做的。",en:"I followed the diagram exactly."}},
{speaker:"player",face:"dry",text:{zh:"图纸上写了不要把锅烧穿吗？",en:"Did the diagram say not to burn through the pot?"}},
{speaker:"muling",face:"sheepish",text:{zh:"……别尝。",en:"...Don't taste it."}}
]},
{id:"pendant-tap",title:{zh:"铃坠的两下",en:"Two Taps on the Bell"},summary:{zh:"她紧张时总会敲两下铃坠",en:"A small habit when she's nervous"},lines:[
{speaker:"player",face:"curious",text:{zh:"你紧张的时候会敲两下铃坠。",en:"You tap your bell pendant twice when you're nervous."}},
{speaker:"muling",face:"nervous",text:{zh:"我有吗？",en:"Do I?"}},
{speaker:"player",face:"warm",text:{zh:"刚才敲了两下。",en:"You just did it twice."}},
{speaker:"muling",face:"warm",text:{zh:"那它大概比我诚实。",en:"Then perhaps it's more honest than I am."}}
]}
];
export function createMulingState(){return {version:1,trust:0,completed:[],following:true,lastRegion:null,events:[]};}
export function normalizeMulingState(value){
 const base=createMulingState(),s=value&&typeof value==="object"?JSON.parse(JSON.stringify(value)):base;
 if(s.version!==1)return base;
 s.trust=Math.max(0,Math.min(100,Number.isFinite(s.trust)?s.trust:0));
 s.completed=Array.isArray(s.completed)?[...new Set(s.completed.filter(id=>MULING_INTERACTIONS.some(x=>x.id===id)))]:[];
 s.following=typeof s.following==="boolean"?s.following:true;
 s.lastRegion=typeof s.lastRegion==="string"?s.lastRegion:null;
 s.events=Array.isArray(s.events)?s.events.filter(x=>typeof x==="string"):[];
 return s;
}
export function completeMulingInteraction(value,id){
 const s=normalizeMulingState(value);
 if(!MULING_INTERACTIONS.some(x=>x.id===id))return null;
 if(!s.completed.includes(id)){s.completed.push(id);s.trust=Math.min(100,s.trust+1);s.events.push("muling:"+id);}
 return s;
}
export function setMulingFollowing(value,following){const s=normalizeMulingState(value);s.following=!!following;return s;}
