// Independent optional activities; no story cursor, currency, combat reward, or RNG changes.
export const sideAdventures=Object.freeze({
 harbor:{at:[.235,.56],kind:"shell",title:["退潮的贝壳","The tidepool shell"],clue:["小寄居蟹要回家。逐排选择没有被海水淹没的石头。","Help the hermit crab reach home. In each row choose a dry stepping stone."],reward:["潮汐贝壳","Tidepool shell"],actor:"qilan",after:"harbor:H-05",later:["栖蓝把贝壳挂在航图旁。每逢退潮，它会唱一小段海浪的歌。","Qilan hangs the shell beside the chart. At low tide it sings a little song of the sea."],win:["寄居蟹钻进新家，把旧贝壳留给你。","The crab slips into its new home and leaves its old shell for you."]},
 forest:{at:[.39,.4],kind:"leaf",title:["芽禾的香草茶","Yahe's herbal tea"],clue:["挑出带三片圆叶的香草，放入茶篮。选满两株后冲泡。","Pick two herbs with three rounded leaves, then brew the tea."],reward:["香草茶袋","Herbal tea pouch"],actor:"yahe",after:"forest:R-04",later:["芽禾把你配的香草茶留在花园，来访的小猫都能喝到。","Yahe keeps your herbal blend in the garden for visiting kittens."],win:["清甜香气升起，芽禾把剩下的香草装成小茶袋。","A sweet scent rises. Yahe packs the remaining herbs into a little tea pouch."]},
 forge:{at:[.63,.5],kind:"lantern",title:["歪耳猫的纸灯","The crooked-ear paper lantern"],clue:["转动镂空灯片，使猫耳朝上、歪耳在右边，再点亮灯。","Rotate the cutout until the ears point up and the crooked ear is on the right, then light it."],reward:["歪耳纸灯","Crooked-ear paper lantern"],actor:"xiaomao",after:"forge:E-04",later:["小铆把你制作的纸灯挂进影子戏，墙上多了一只歪耳小猫。","Xiaomao hangs your paper lantern in the shadow show; a crooked-ear kitten appears on the wall."],win:["暖光透过灯片，墙上出现一只歪耳猫。","Warm light shines through the cutout, casting a crooked-ear cat on the wall."]},
 sky:{at:[.72,.43],kind:"feather",title:["给云端的一封信","A letter for the clouds"],clue:["信袋两侧必须一样重。把四块砝码移到左右篮中，使重量平衡，再放飞。","Balance the mailbag: place all four weights in the left or right basket, with equal totals, then launch."],reward:["云邮信封","Cloud-post envelope"],actor:"yuanfan",after:"sky:S-05",later:["远帆把这封信送回花园。信角画着你们第一次安全放飞的风筝。","Yuanfan brings the letter back to the garden, with a drawing of your first safely launched kite."],win:["信袋平稳升空，一封盖着云朵邮戳的信留在你手里。","The mailbag lifts steadily into the sky. You keep a cloud-stamped envelope."]},
 library:{at:[.29,.6],kind:"book",title:["三页失散的故事","Three scattered pages"],clue:["把三页故事按早晨、午后、夜晚的顺序排好，装订成册。","Arrange the three story pages in order: morning, afternoon, night. Then bind the book."],reward:["晨昏故事页","Daybreak story page"],actor:"baikan",after:"library:M-05",later:["白栞把你装订的故事抄进新书。花园访客可以读到那个小小的完整故事。","Baikan copies the story you bound into a new book for garden visitors to read."],win:["故事重新连起来了，书页边缘留下温暖的金色印记。","The story is whole again, with a warm golden mark along the page."]},
 starfall:{at:[.51,.58],kind:"star",title:["小猫座","The kitten constellation"],clue:["从金色起点出发，沿虚线依次连接相邻星星。不要走回头路，直到所有星星亮起。","Start at the golden star. Follow the dotted links to neighboring stars without revisiting one, until all shine."],reward:["小猫座星带","Kitten constellation ribbon"],actor:"xingya",after:"starfall:F-04",later:["星芽把小猫座刻进新星图。以后花园夜空里也能找到你连成的小猫座。","Xingya adds your kitten constellation to the new star chart. You can find it in the garden's night sky."],win:["最后一颗星点亮，小猫座在天幕上出现。","The last star lights up, revealing a kitten constellation in the sky."]}
});
export const sideKey=r=>"side-adventure:"+r;
export function newSideState(region){return {region,trace:[],row:0,selected:[],rotation:1,baskets:[0,0,0,0],pages:[],stars:[0],done:false,message:null};}
export const dryLanes=[[0,2],[1],[0,2]],herbs=[["round","尖叶","Pointed leaves"],["round3","三片圆叶","Three round leaves"],["fern","蕨叶","Fern"],["round3","三片圆叶","Three round leaves"]];
export const weights=[1,2,3,4],starPoints=[[.12,.73],[.30,.26],[.48,.56],[.65,.23],[.88,.73]],starLinks=[[0,1],[1,2],[2,3],[3,4],[1,3]];
const say=(s,zh,en)=>{s.message=[zh,en];};
export function sideAction(s,action){
 if(!s||s.done||!sideAdventures[s.region]||!action||typeof action!=="object")return false;
 const {type,i}=action;const n=Number.isInteger(i)?i:-1;
 if(s.trace.length>=80)return false;
 let accepted=true;
 if(s.region==="harbor"&&type==="step"&&n>=0&&n<3){if(dryLanes[s.row]?.includes(n)){s.row++;say(s,"安全到达下一块石头！","Safe on the next stone!");if(s.row===3)s.done=true;}else{say(s,"海水涌上来了，退回这排再试。","The tide rolls in. Try this row again.");}}
 else if(s.region==="forest"&&type==="pick"&&n>=0&&n<4){if(s.selected.includes(n))s.selected=s.selected.filter(x=>x!==n);else if(s.selected.length<2)s.selected.push(n);else return false;}
 else if(s.region==="forest"&&type==="brew"){if(s.selected.length===2&&s.selected.every(x=>herbs[x][0]==="round3"))s.done=true;else{say(s,"香味不对，重新选择两株圆叶香草。","That scent is wrong. Choose two round-leaf herbs.");s.selected=[];}}
 else if(s.region==="forge"&&type==="rotate"){s.rotation=(s.rotation+1)%4;say(s,"灯片转动了。","The cutout turns.");}
 else if(s.region==="forge"&&type==="light"){if(s.rotation===0)s.done=true;else say(s,"影子还歪着，继续转动灯片。","The shadow is sideways. Rotate the cutout again.");}
 else if(s.region==="sky"&&type==="weight"&&n>=0&&n<4){s.baskets[n]=(s.baskets[n]+1)%3;}
 else if(s.region==="sky"&&type==="launch"){const [l,r]=basketTotals(s);if(s.baskets.every(Boolean)&&l===r)s.done=true;else say(s,"还没平衡，两边重量相同才可以放飞。","Not balanced yet. Both baskets need equal weight.");}
 else if(s.region==="library"&&type==="page"&&n>=0&&n<3&&!s.pages.includes(n)){s.pages.push(n);}
 else if(s.region==="library"&&type==="unbind"){s.pages=[];}
 else if(s.region==="library"&&type==="bind"){if(s.pages.join(",")==="1,2,0")s.done=true;else{say(s,"时间顺序还不对，重新排列吧。","The time order is not right. Rearrange the pages.");s.pages=[];}}
 else if(s.region==="starfall"&&type==="star"&&n>=0&&n<5&&!s.stars.includes(n)){const last=s.stars.at(-1);if(starLinks.some(([a,b])=>a===last&&b===n||a===n&&b===last)){s.stars.push(n);if(s.stars.length===5)s.done=true;else say(s,"又一颗星亮了。","Another star lights up.");}else say(s,"这两颗星之间没有连线。","There is no link between those stars.");}
 else if(s.region==="starfall"&&type==="reset"){s.stars=[0];}
 else accepted=false;
 if(accepted)s.trace.push({type,...(n>=0?{i:n}:{})});return accepted;
}
export function basketTotals(s){return [1,2].map(side=>weights.reduce((sum,w,i)=>sum+(s.baskets[i]===side?w:0),0));}
export function verifySideProof(region,trace){if(!Array.isArray(trace)||trace.length<1||trace.length>80)return false;const s=newSideState(region);for(const a of trace)if(!sideAction(s,a))return false;return s.done;}
export function availableSideEvents(region,w,v){const d=sideAdventures[region];return d&&w.location===region&&!w.cargo&&v.regions?.includes(region)&&!w.interactions?.[sideKey(region)]&&!(region==="sky"&&w.interactions?.["sky:survey-island"])?[{id:sideKey(region),kind:d.kind,at:d.at,point:[d.at[0]+.055,d.at[1]-.035],sideEvent:true,label:d.title}]:[];}
export function applySideEvent(region,w,v,trace){const d=sideAdventures[region],p=w.positions?.[region];if(!availableSideEvents(region,w,v).length||!p||Math.hypot(p.x-d.at[0],p.y-d.at[1])>=.072||!verifySideProof(region,trace))return {ok:false,reason:"walk-to-discovery"};return {ok:true,next:{...w,interactions:{...w.interactions,[sideKey(region)]:true}},souvenir:d.reward,message:d.win};}
export function sideKeepsakes(interactions={}){return Object.entries(sideAdventures).filter(([r])=>interactions[sideKey(r)]===true).map(([region,d])=>({region,name:d.reward}));}
export function sideMemory(actor,root){return Object.entries(sideAdventures).filter(([r,d])=>d.actor===actor&&root?.resonanceExploration?.interactions?.[sideKey(r)]===true&&root?.resonance?.completed?.includes(d.after)).map(([,d])=>d.later);}
