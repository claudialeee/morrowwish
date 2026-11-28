import {sideKeepsakes,sideKey} from "./side-adventures.mjs?v=regional-depth-20261127";
// Region-specific optional environmental discoveries; no narrative proof or economy changes.
const raw={
  "harbor": {
    "after": "harbor:H-05",
    "souvenir": [
      "小铜风铃",
      "Little brass chime"
    ],
    "returnSouvenir": [
      "集市小旗",
      "Market pennant"
    ],
    "steps": [
      [
        "shell",
        "lantern",
        [
          0.115,
          0.7
        ],
        [
          0.082,
          -0.025
        ],
        [
          "阿婆说她家门口挂着铜风铃。找找海边的旧风铃路标，记下回家的路。",
          "Gran mentioned a brass chime at her door. Look for the old chime landmark and note the way home."
        ]
      ],
      [
        "crab",
        "spark",
        [
          0.235,
          0.56
        ],
        [
          0.045,
          0.095
        ],
        [
          "路标上的铜风铃和阿婆说的一样。栖蓝记下了这条回家的路。",
          "The brass chime matches Gran’s description. Skye notes the way home."
        ],
        [
          "shell"
        ]
      ],
      [
        "pool",
        "flag",
        [
          0.837,
          0.61
        ],
        [
          -0.06,
          -0.09
        ],
        [
          "阿婆认出了孙子，也认得回家的路了。她托栖蓝送来一面集市小旗。",
          "Gran remembers her grandson and the way home. She sends a market pennant through Skye."
        ],
        [],
        "return"
      ]
    ]
  },
  "forest": {
    "after": "forest:R-04",
    "souvenir": [
      "香草种子",
      "Herb seed"
    ],
    "returnSouvenir": [
      "新生树叶",
      "New leaf"
    ],
    "steps": [
      [
        "leaf",
        "leaf",
        [
          0.2,
          0.84
        ],
        [
          0.09,
          -0.055
        ],
        [
          "叶子有清甜的香味。找带三片圆叶的植物，别认错尖叶。",
          "A sweet scent. Look for three round leaves, not pointed ones."
        ]
      ],
      [
        "thorn",
        "thorn",
        [
          0.35,
          0.64
        ],
        [
          0.085,
          -0.025
        ],
        [
          "这株叶尖发涩，气味不对。",
          "These pointed leaves smell bitter, not sweet."
        ],
        [
          "leaf"
        ],
        "decoy"
      ],
      [
        "herb",
        "leaf",
        [
          0.39,
          0.4
        ],
        [
          0.04,
          -0.09
        ],
        [
          "找到芽禾想要的香草。带一粒种子回花园，为来访的猫准备香草茶。",
          "You find Fern’s herb. Take a seed to the garden for tea."
        ],
        [
          "leaf"
        ]
      ],
      [
        "sprout",
        "leaf",
        [
          0.77,
          0.44
        ],
        [
          -0.025,
          0.095
        ],
        [
          "水路恢复后，枯根旁冒出了新叶。",
          "Fresh leaves grow beside the roots now that water flows again."
        ],
        [],
        "return"
      ]
    ]
  },
  "forge": {
    "after": "forge:E-04",
    "souvenir": [
      "庆典小提灯",
      "Festival lantern"
    ],
    "returnSouvenir": [
      "暖光灯芯",
      "Warm lantern wick"
    ],
    "steps": [
      [
        "paper",
        "paper",
        [
          0.35,
          0.76
        ],
        [
          -0.06,
          0.09
        ],
        [
          "找到一张彩纸，还需要一段灯芯。",
          "Festival paper! A wick would complete it."
        ]
      ],
      [
        "wick",
        "spark",
        [
          0.35,
          0.5
        ],
        [
          0.09,
          0.065
        ],
        [
          "灯芯完好，可以做一盏小灯。",
          "A good wick for a little lantern."
        ]
      ],
      [
        "lantern",
        "lantern",
        [
          0.63,
          0.5
        ],
        [
          -0.03,
          0.095
        ],
        [
          "把纸和灯芯折成一盏歪歪的小提灯。",
          "Fold the paper and wick into a slightly crooked little lantern."
        ],
        [
          "paper",
          "wick"
        ]
      ],
      [
        "glow",
        "lantern",
        [
          0.74,
          0.4
        ],
        [
          0.06,
          0.095
        ],
        [
          "灯火节恢复了，小栗用你找到的彩纸和灯芯照亮歪耳猫的影子。",
          "The festival is back; Pip lights the crooked-eared cat shadow with your paper and wick."
        ],
        [],
        "return"
      ]
    ]
  },
  "sky": {
    "after": "sky:S-05",
    "souvenir": [
      "云端羽毛",
      "Cloud feather"
    ],
    "returnSouvenir": [
      "云端明信片",
      "Cloud postcard"
    ],
    "steps": [
      [
        "feather1",
        "feather",
        [
          0.1,
          0.8
        ],
        [
          0.095,
          -0.025
        ],
        [
          "风把羽毛吹向更高的石台！",
          "The breeze lifts the feather toward a higher ledge!"
        ]
      ],
      [
        "feather2",
        "feather",
        [
          0.41,
          0.51
        ],
        [
          0.035,
          0.09
        ],
        [
          "差一点！羽毛又飘向云端。",
          "Almost! The feather drifts toward the clouds."
        ],
        [
          "feather1"
        ]
      ],
      [
        "feather3",
        "feather",
        [
          0.72,
          0.43
        ],
        [
          -0.065,
          -0.065
        ],
        [
          "羽毛落在了你的鼻尖。",
          "The feather finally lands on your nose."
        ],
        [
          "feather2"
        ]
      ],
      [
        "view",
        "cloud",
        [
          0.84,
          0.3
        ],
        [
          -0.065,
          -0.075
        ],
        [
          "信使恢复了航路。远帆请你把云海明信片带回花园。",
          "The courier route is open. Finn asks you to bring a cloud postcard back to the garden."
        ],
        [],
        "return"
      ]
    ]
  },
  "library": {
    "after": "library:M-05",
    "souvenir": [
      "三叶书签",
      "Three-leaf bookmark"
    ],
    "returnSouvenir": [
      "公开阅览卡",
      "Public reading card"
    ],
    "steps": [
      [
        "stamp",
        "book",
        [
          0.17,
          0.73
        ],
        [
          -0.065,
          -0.055
        ],
        [
          "白羽整理失忆期间散落的公共资料。植物册的三叶印能帮你找回书签。",
          "Ivy is restoring scattered public records. The plant guide’s three-leaf seal identifies its bookmark."
        ]
      ],
      [
        "wrong",
        "star",
        [
          0.46,
          0.58
        ],
        [
          0.035,
          0.085
        ],
        [
          "这是星星图案，不是三叶印。",
          "A star, not the three-leaf stamp."
        ],
        [
          "stamp"
        ],
        "decoy"
      ],
      [
        "match",
        "leaf",
        [
          0.29,
          0.6
        ],
        [
          -0.035,
          -0.09
        ],
        [
          "图案相同！找到植物册的书签了。",
          "A match! You found the plant guide's bookmark."
        ],
        [
          "stamp"
        ]
      ],
      [
        "card",
        "book",
        [
          0.76,
          0.4
        ],
        [
          0.04,
          0.095
        ],
        [
          "公开阅览角重新开放，你领到一张阅览卡。",
          "The public reading corner reopens; you receive a reading card."
        ],
        [],
        "return"
      ]
    ]
  },
  "starfall": {
    "after": "starfall:F-04",
    "souvenir": [
      "星纹石片",
      "Star-pattern stone"
    ],
    "returnSouvenir": [
      "商队徽章",
      "Caravan badge"
    ],
    "steps": [
      [
        "stone",
        "stone",
        [
          0.1,
          0.9
        ],
        [
          0.095,
          -0.09
        ],
        [
          "石片刻着三角星纹。找相同纹样，不用碰古代机关。",
          "A triangular pattern. Look for a match without touching ancient mechanisms."
        ]
      ],
      [
        "wrong",
        "star",
        [
          0.34,
          0.68
        ],
        [
          0.09,
          0.065
        ],
        [
          "这是四角星，和石片不一样。",
          "Four points, unlike the triangle on your stone."
        ],
        [
          "stone"
        ],
        "decoy"
      ],
      [
        "match",
        "stone",
        [
          0.51,
          0.58
        ],
        [
          0.07,
          0.09
        ],
        [
          "相同纹样！这是旧商队留下的路边刻痕。",
          "A match! An old caravan left this roadside carving."
        ],
        [
          "stone"
        ]
      ],
      [
        "badge",
        "flag",
        [
          0.78,
          0.48
        ],
        [
          0.06,
          0.085
        ],
        [
          "灾难结束后，商队重新出发。星芽说这些旧刻痕连起来像小猫座。",
          "After the disaster, the caravan sets off. Nova sees a kitten constellation in the old markings."
        ],
        [],
        "return"
      ]
    ]
  }
};
export const discoveries=Object.fromEntries(Object.entries(raw).map(([region,d])=>[region,{...d,steps:d.steps.map(([id,kind,at,offset,message,requires=[],mode])=>({id,kind,at,point:[at[0]+offset[0],at[1]+offset[1]],message,requires,mode}))}]));
const key=(region,id)=>"discovery:"+region+":"+id;
export function progress(region,interactions={}){
 const d=discoveries[region];if(!d)return {done:[],complete:false,returned:false};
 const done=d.steps.filter(s=>s.mode!=="decoy"&&interactions[key(region,s.id)]).map(s=>s.id);
 return {done,complete:d.steps.filter(s=>!s.mode).every(s=>done.includes(s.id)),returned:d.steps.some(s=>s.mode==="return"&&done.includes(s.id))};
}
export function availableDiscoveries(region,w,v){
 const d=discoveries[region];if(!d||w.location!==region||w.cargo||!v.regions?.includes(region)||region==="sky"&&w.interactions?.["sky:survey-island"])return [];
 const p=progress(region,w.interactions);
 const introduced={harbor:"harbor:H-01",forest:"forest:R-01",forge:"forge:E-01",sky:"sky:S-01",library:"library:M-01"}[region];if(introduced&&!v.completed.includes(introduced)&&!v.completed.includes(d.after))return [];
 if((region==="library"&&v.completed.includes("library:M-03")||region==="starfall")&&!v.completed.includes("epilogue:E-03"))return [];
 return d.steps.filter(s=>!p.done.includes(s.id)&&(s.mode!=="decoy"||!p.complete)&&s.requires.every(id=>p.done.includes(id))&&(s.mode!=="return"||p.complete&&v.completed.includes(d.after)));
}
export function applyDiscovery(region,id,w,v){
 const s=availableDiscoveries(region,w,v).find(x=>x.id===id),p=w.positions?.[region];
 if(!s||!p||Math.hypot(p.x-s.at[0],p.y-s.at[1])>=.072)return {ok:false,reason:"walk-to-discovery"};
 if(s.mode==="decoy")return {ok:true,decoy:true,message:s.message};
 const next={...w,interactions:{...w.interactions,[key(region,id)]:true}};
 const before=progress(region,w.interactions),after=progress(region,next.interactions),d=discoveries[region];
 const perk=after.complete&&(!before.complete||!before.returned&&after.returned)&&!next.interactions[sideKey(region)];if(perk)next.interactions[sideKey(region)]=true;
 return {ok:true,next,message:s.message,souvenir:!before.complete&&after.complete?d.souvenir:!before.returned&&after.returned?d.returnSouvenir:null,reward:perk?{coins:25,fish:2}:null,perk};
}
// Keep the props separated from interactive story anchors. Both the painter
// and hit-testing consume the identical projected points.
export function layoutDiscoveries(items,obstacles,W=960,H=540){
 const occupied=obstacles.filter(p=>Array.isArray(p)&&p.length>=2).map(p=>[p[0]*W,p[1]*H]);
 return items.map(s=>{
  const x=s.point[0]*W,y=s.point[1]*H;
  const gap=(a,b)=>occupied.length?Math.min(...occupied.map(p=>Math.hypot(a-p[0],b-p[1]))):Infinity;
  const candidates=[[0,0],[-45,0],[45,0],[0,-45],[0,45],[-45,-45],[45,-45],[-45,45],[45,45],[-85,0],[85,0],[0,-85],[0,85],[-85,-45],[85,45],[-85,45],[85,-45]];
  let best=null,bestGap=-1;
  for(const [dx,dy] of candidates){const a=Math.max(28,Math.min(W-28,x+dx)),b=Math.max(28,Math.min(H-28,y+dy)),g=gap(a,b);if(g>bestGap){best=[a,b];bestGap=g;}if(g>=52){best=[a,b];break;}}
  occupied.push(best);return {...s,point:[best[0]/W,best[1]/H]};
 });
}
export function earnedKeepsakes(interactions={}){
 return [...Object.entries(discoveries).flatMap(([region,d])=>{const p=progress(region,interactions);return [...(p.complete?[{region,name:d.souvenir}]:[]),...(p.returned?[{region,name:d.returnSouvenir}]:[])];}),...sideKeepsakes(interactions)];
}
export function paintDiscovery(ctx,s,W,H,t){
 const bob=["feather","crab"].includes(s.kind)?Math.sin(t*4)*2:Math.sin(t*2)*.6;
 ctx.save();ctx.translate(s.point[0]*W,s.point[1]*H+bob);ctx.lineJoin="round";ctx.lineCap="round";ctx.lineWidth=1.5;ctx.strokeStyle="#755d45";ctx.shadowColor="#302b2850";ctx.shadowBlur=3;
 const fill=(color,path)=>{ctx.fillStyle=color;ctx.beginPath();path();ctx.fill();ctx.stroke();};
 const ellipse=(x,y,a,b,rot=0)=>ctx.ellipse(x,y,a,b,rot,0,Math.PI*2);
 if(s.kind==="shell"){fill("#e5b997",()=>{ctx.moveTo(-11,8);ctx.bezierCurveTo(-21,-12,19,-17,13,8);ctx.closePath()});ctx.beginPath();for(let i=-8;i<=8;i+=4){ctx.moveTo(0,8);ctx.lineTo(i,-8+Math.abs(i)*.3)}ctx.stroke();}
 else if(s.kind==="crab"){fill("#d58966",()=>ellipse(0,1,11,7));ctx.beginPath();for(const q of [-1,1]){for(let i=0;i<3;i++){ctx.moveTo(q*7,3+i);ctx.lineTo(q*(13+i*2),8-i*3)}ctx.moveTo(q*8,-2);ctx.lineTo(q*14,-10);ctx.arc(q*14,-10,4,0,Math.PI*1.6)}ctx.stroke();}
 else if(s.kind==="leaf"||s.kind==="thorn"){ctx.beginPath();ctx.moveTo(0,11);ctx.lineTo(0,-9);ctx.stroke();for(const [dx,dy,a] of [[-6,-2,-.65],[6,-2,.65],[0,-8,0]]){fill(s.kind==="thorn"?"#8a9d73":"#9bb778",()=>{if(s.kind==="thorn"){ctx.moveTo(dx,dy+6);ctx.lineTo(dx-4,dy-2);ctx.lineTo(dx,dy-11);ctx.lineTo(dx+4,dy-2);ctx.closePath()}else ellipse(dx,dy,5,8,a);});}}
 else if(s.kind==="lantern"||s.kind==="spark"){ctx.shadowColor="#ffdd8f";ctx.shadowBlur=9;fill("#f2bc72",()=>{ctx.roundRect(-9,-11,18,21,4)});ctx.beginPath();ctx.moveTo(-8,-6);ctx.lineTo(8,-6);ctx.moveTo(-8,5);ctx.lineTo(8,5);ctx.stroke();}
 else if(s.kind==="feather"){ctx.rotate(-.55+Math.sin(t*3)*.15);fill("#f3e8d0",()=>{ctx.moveTo(0,12);ctx.bezierCurveTo(-14,-3,-4,-20,7,-15);ctx.bezierCurveTo(14,-1,5,9,0,12)});ctx.beginPath();ctx.moveTo(-3,15);ctx.lineTo(5,-11);ctx.stroke();}
 else if(s.kind==="cloud"){fill("#e6e9e3",()=>{ellipse(-7,1,9,7);ellipse(1,-4,10,9);ellipse(9,2,8,6)});}
 else if(s.kind==="book"||s.kind==="paper"){fill("#f2dfb4",()=>{ctx.roundRect(-11,-10,22,20,2)});ctx.beginPath();ctx.moveTo(0,-9);ctx.lineTo(0,9);ctx.moveTo(-8,-4);ctx.lineTo(-3,-4);ctx.moveTo(3,0);ctx.lineTo(8,0);ctx.stroke();}
 else if(s.kind==="flag"){fill("#d3a06f",()=>{ctx.moveTo(-8,-12);ctx.lineTo(11,-7);ctx.lineTo(-8,1);ctx.closePath()});ctx.beginPath();ctx.moveTo(-8,-12);ctx.lineTo(-8,13);ctx.stroke();}
 else{fill("#b0b2ba",()=>{ctx.moveTo(-12,5);ctx.lineTo(-9,-7);ctx.lineTo(3,-11);ctx.lineTo(12,-2);ctx.lineTo(8,9);ctx.lineTo(-3,11);ctx.closePath()});ctx.strokeStyle="#ffe2a4";ctx.beginPath();if(s.kind==="star"){ctx.moveTo(0,-8);ctx.lineTo(3,-2);ctx.lineTo(9,0);ctx.lineTo(3,2);ctx.lineTo(0,8);ctx.lineTo(-3,2);ctx.lineTo(-9,0);ctx.lineTo(-3,-2);}else{ctx.moveTo(0,-6);ctx.lineTo(5,4);ctx.lineTo(-5,4);}ctx.closePath();ctx.stroke();}
 ctx.shadowBlur=0;ctx.strokeStyle="#fff2c9";ctx.globalAlpha=.5+.35*Math.sin(t*3);ctx.beginPath();ctx.moveTo(15,-13);ctx.lineTo(15,-5);ctx.moveTo(11,-9);ctx.lineTo(19,-9);ctx.stroke();ctx.restore();
}
