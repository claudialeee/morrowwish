// Canonical H-02 slice extracted from campaign.mjs; the test suite asserts parity.
export const harborSample = {
 cast:{
  qilan:{id:"qilan",name:{zh:"栖蓝",en:"Qilan"}},
  jiedeng:{id:"jiedeng",name:{zh:"岬灯",en:"Jiedeng"}}
 },
 scene:{
  id:"harbor:H-02",chapter:"harbor",
  title:{zh:"拒绝点灯的守灯人",en:"The Keeper Who Refuses"},
  lines:[
   {speaker:"jiedeng",text:{zh:"灯亮了，船就会回来。可有些船不应该再出海。",en:"If the light comes on, the boats will return. But some boats should never sail again."}},
   {speaker:"qilan",text:{zh:"你又在说以前的事情。",en:"You're talking about the past again."}},
   {speaker:"jiedeng",text:{zh:"你根本不知道以前发生了什么。",en:"You have no idea what happened back then."}},
   {speaker:"qilan",text:{zh:"那你倒是告诉我啊！",en:"Then tell me!"}},
   {speaker:"jiedeng",text:{zh:"我不想再看见有人因为一盏灯而受伤。",en:"I don't want anyone else hurt because of a light."}}
  ],
  choices:[
   {id:"comfort",label:{zh:"先安慰栖蓝",en:"Comfort Qilan first"},npc:"qilan",method:"navigator-trust"},
   {id:"ask",label:{zh:"先询问岬灯过去的风暴",en:"Ask Jiedeng about the old storm"},npc:"jiedeng",method:"keeper-trust"}
  ]
 }
};
