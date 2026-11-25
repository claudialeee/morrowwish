// Pure state transitions for the playable Misttide Harbor NPC sample.
export const BRANCH_DIALOGUE = {
 comfort: [
  {speaker:"qilan",face:"warm",zh:"谢谢你先听我说。我不是不想听岬灯解释，只是不想永远被当成需要保护的人。",en:"Thank you for listening first. I do want to hear Jiedeng's reasons. I just don't want to be treated as someone who always needs protecting."},
  {speaker:"jiedeng",face:"worried",zh:"我知道你已经长大了。只是每次看见那盏灯，我都会想起那场风暴。",en:"I know you've grown. Every time I look at that light, I remember the storm."},
  {speaker:"qilan",face:"determined",zh:"那就让我和你一起面对它。别再替我决定能不能出海。",en:"Then let me face it with you. Don't decide for me whether I can sail."}
 ],
 ask: [
  {speaker:"jiedeng",face:"soft",zh:"那场风暴里，我关掉了灯。救援船失去了指引，后来船员都回来了，但我再也没能联系上那位朋友。",en:"During that storm, I extinguished the light. The rescue boat lost its bearing. The crew made it back, but I never managed to reach that dear friend again."},
  {speaker:"qilan",face:"worried",zh:"你一直把这件事一个人扛着。可你从来没告诉我。",en:"You've been carrying this alone. But you never told me."},
  {speaker:"jiedeng",face:"guarded",zh:"我不想让你也背上这样的后悔。可我也不该用沉默替你选择。",en:"I didn't want you to carry the same regret. But silence shouldn't have been my way of choosing for you."}
 ]
};
export function createHarborState(){
 return {version:1,sceneId:"harbor:H-02",stage:"dialogue",index:0,branchIndex:0,choice:null,trust:{qilan:0,jiedeng:0},quest:null,event:null,supportRoute:null};
}
export function normalizeHarborState(value){
 const s=value&&typeof value==="object"?JSON.parse(JSON.stringify(value)):createHarborState();
 const base=createHarborState();
 if(s.version!==1||s.sceneId!==base.sceneId||!["dialogue","choice","branch","quest"].includes(s.stage))return base;
 s.index=Math.max(0,Math.min(5,Number.isInteger(s.index)?s.index:0));
 s.branchIndex=Math.max(0,Math.min(3,Number.isInteger(s.branchIndex)?s.branchIndex:0));
 s.choice=["comfort","ask"].includes(s.choice)?s.choice:null;
 s.trust={qilan:Number.isFinite(s.trust?.qilan)?s.trust.qilan:0,jiedeng:Number.isFinite(s.trust?.jiedeng)?s.trust.jiedeng:0};
 if(!s.choice){s.quest=null;s.event=null;s.supportRoute=null;if(s.stage==="branch"||s.stage==="quest")s.stage="choice";}
 if(s.choice&&!s.quest){s.quest={id:"harbor:flooded-logbook",status:"active",progress:0};}
 return s;
}
export function advanceHarborState(value){
 const s=normalizeHarborState(value);
 if(s.stage==="dialogue"){
  s.index=Math.min(5,s.index+1);
  if(s.index===5)s.stage="choice";
 }else if(s.stage==="branch"){
  s.branchIndex=Math.min(3,s.branchIndex+1);
  if(s.branchIndex===3)s.stage="quest";
 }
 return s;
}
export function chooseHarborState(value,choiceId){
 const s=normalizeHarborState(value);
 if(s.stage!=="choice"||s.choice||!["comfort","ask"].includes(choiceId))return null;
 s.choice=choiceId;
 if(choiceId==="comfort"){s.trust.qilan+=2;s.supportRoute="navigator-first";}
 else{s.trust.jiedeng+=2;s.supportRoute="keeper-first";}
 s.quest={id:"harbor:flooded-logbook",status:"active",progress:0};
 s.event={id:"harbor:H-02:keeper-choice",status:"resolved",choice:choiceId};
 s.stage="branch";s.branchIndex=0;
 return s;
}
