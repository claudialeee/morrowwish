// data.js — static game data: species catalogue + rarity config.

const RARITY = {
  // Base encounter / draw percentages before luck boosts. High-tier cats are trophies,
  // while the 40-pull SR pity in Raising stays intact.
  N:   { key: 'N',   name: '普通', weight: 68, color: '#c9c9c9', statMul: 1.0,  bondReq: 100, guardSpeed: 1.0 },
  R:   { key: 'R',   name: '稀有', weight: 24, color: '#7ab8ff', statMul: 1.25, bondReq: 130, guardSpeed: 1.25 },
  SR:  { key: 'SR',  name: '史诗', weight: 7,  color: '#c08bff', statMul: 1.6,  bondReq: 165, guardSpeed: 1.55 },
  SSR: { key: 'SSR', name: '传说', weight: 1,  color: '#ffd36b', statMul: 2.1,  bondReq: 210, guardSpeed: 1.9 },
};

// species fields:
//  id, name, palette (CAT_PALETTES key), pattern, eyeColor, rarity, fluffy, ears, point(optional)
//  desc, base stats {pow, agi, vit, cha}
const LEGACY_SPECIES = [
  // ---------- N (普通) ----------
  { id: 'tangyuan', name: '汤圆',   palette: 'orange',      pattern: 'tabby',   eyeColor: '#6fcf97', rarity: 'N', desc: '爱睡懒觉的橘猫，据说三斤起步。',       base: { pow: 7, agi: 8, vit: 6, cha: 5 } },
  { id: 'doudou',   name: '豆豆',   palette: 'brownTabby',  pattern: 'tabby',   eyeColor: '#f2c94c', rarity: 'N', desc: '标准狸花猫，机灵又好动。',             base: { pow: 7, agi: 5, vit: 8, cha: 5 } },
  { id: 'xiaohui',  name: '小雾',   palette: 'silver',      pattern: 'tabby',   eyeColor: '#8fd3ff', rarity: 'N', desc: '银渐层的雏形，蹲窗台看雨。',           base: { pow: 7, agi: 5, vit: 8, cha: 5 } },
  { id: 'moqiu',    name: '墨球',   palette: 'black',       pattern: 'solid',   eyeColor: '#9be7c4', rarity: 'N', desc: '黑夜里只剩一双发光的眼睛。',           base: { pow: 7, agi: 6, vit: 5, cha: 4 } },
  { id: 'nainai',   name: '雪团',   palette: 'white',       pattern: 'solid',   eyeColor: '#6ab7ff', rarity: 'N', desc: '一身奶白，像落了一层初雪。',           base: { pow: 4, agi: 5, vit: 6, cha: 8 } },
  { id: 'nietu',    name: '奶酥',   palette: 'cream',       pattern: 'solid',   eyeColor: '#f2994a', rarity: 'N', desc: '奶油色的小懒猫，踩奶高手。',           base: { pow: 5, agi: 5, vit: 7, cha: 6 } },
  { id: 'niuniu',   name: '奥利奥',   palette: 'tux',         pattern: 'tuxedo',  eyeColor: '#7ee787', rarity: 'N', desc: '黑白分明的奶牛猫，话痨一只。',         base: { pow: 6, agi: 6, vit: 6, cha: 6 } },

  // ---------- R (稀有) ----------
  { id: 'sanhua',   name: '花花',   palette: 'calico',      pattern: 'calico',  eyeColor: '#f2c94c', rarity: 'R', desc: '三色福猫，传说能招来好运。',           base: { pow: 7, agi: 7, vit: 7, cha: 9 } },
  { id: 'lixiao',   name: '绅绅',   palette: 'tux',         pattern: 'tuxedo',  eyeColor: '#7ee787', rarity: 'R', desc: '穿燕尾服的绅士，优雅又傲娇。',         base: { pow: 8, agi: 8, vit: 6, cha: 8 } },
  { id: 'lanbao',   name: '蓝莓',   palette: 'blue',        pattern: 'solid',   eyeColor: '#f6b93b', rarity: 'SSR', desc: '英短蓝猫，圆脸包子，捏不腻。',         base: { pow: 16, agi: 12, vit: 18, cha: 13 } },
  { id: 'dundun',   name: '团团',   palette: 'silver',      pattern: 'silver',  eyeColor: '#7ee7c4', rarity: 'R', desc: '银渐层，眼线天生，表情包担当。',       base: { pow: 6, agi: 7, vit: 8, cha: 8 } },
  { id: 'yunduo',   name: '云朵',   palette: 'ragdoll',     pattern: 'pointed', eyeColor: '#56ccf2', rarity: 'R', fluffy: true, point: '#6b5244', desc: '布偶幼崽，软成一团云。', base: { pow: 6, agi: 6, vit: 8, cha: 9 } },
  { id: 'zherdd',   name: '布丁',   palette: 'cream',       pattern: 'solid',   eyeColor: '#f2994a', rarity: 'R', ears: 'fold', desc: '折耳小团子，坐姿像佛系大师。',          base: { pow: 6, agi: 6, vit: 7, cha: 9 } },
  { id: 'qisi',     name: '芝士',   palette: 'cheese',      pattern: 'bicolor', eyeColor: '#f2994a', rarity: 'N', desc: '橘白相间的起司猫，贪吃界冠军。',       base: { pow: 6, agi: 5, vit: 8, cha: 6 } },
  { id: 'duanduan', name: '跳跳',   palette: 'apricot',     pattern: 'tabby',   eyeColor: '#f6b93b', rarity: 'R', short: true, desc: '曼基康矮脚猫，小短腿跑起来超可爱。',    base: { pow: 6, agi: 9, vit: 7, cha: 10 } },
  { id: 'jinjc',    name: '金豆',   palette: 'goldShaded',  pattern: 'silver',  eyeColor: '#7ee7c4', rarity: 'R', desc: '金渐层，雍容华贵的小土豪。',           base: { pow: 7, agi: 6, vit: 9, cha: 10 } },

  // ---------- SR (史诗) ----------
  // Exotic Shorthair (加菲猫): round, flat-faced plush kitten.
  { id: 'jiafei', name: '圆宝', palette: 'orange', pattern: 'tabby',
    eyeColor: '#aa713f', rarity: 'SR', chubby: true, flatFace: true, short: true,
    desc: '加菲猫（异国短毛猫），扁扁的脸颊、圆滚滚的肚子，最爱坐着守护伙伴。',
    base: { pow: 6, agi: 3, vit: 11, cha: 8 } },
  { id: 'xianluo',  name: '露露',   palette: 'siamese',     pattern: 'pointed', eyeColor: '#56ccf2', rarity: 'SR', point: '#443529', desc: '暹罗贵族，蓝眼如宝石，嗓门极大。', base: { pow: 9, agi: 11, vit: 8, cha: 11 } },
  { id: 'yinghua',  name: '樱桃',   palette: 'white',       pattern: 'bicolor', eyeColor: '#eb5e9b', rarity: 'SR', fluffy: true, desc: '粉樱梦幻猫，走过留下花瓣。',         base: { pow: 9, agi: 11, vit: 8, cha: 12 } },
  { id: 'senlin',   name: '松松',   palette: 'maine',       pattern: 'tabby',   eyeColor: '#7ee787', rarity: 'SSR', fluffy: true, ears: 'tufted', desc: '缅因巨猫，像一头小狮子。', base: { pow: 14, agi: 9, vit: 20, cha: 14 } },
  { id: 'youling',  name: '幽幽',   palette: 'mystic',      pattern: 'solid',   eyeColor: '#c9b6ff', rarity: 'SR', fluffy: true, desc: '半透明的紫雾猫，来去无声。',         base: { pow: 12, agi: 12, vit: 9, cha: 9 } },
  { id: 'nuowei',   name: '枫枫',   palette: 'norwegian',   pattern: 'tabby',   eyeColor: '#7ee787', rarity: 'SR', fluffy: true, ears: 'tufted', desc: '挪威森林猫，披着厚毛的山林王者。', base: { pow: 13, agi: 13, vit: 10, cha: 9 } },
  { id: 'baomao',   name: '斑斑',   palette: 'bengal',      pattern: 'spotted', eyeColor: '#ffd36b', rarity: 'SR', desc: '孟加拉豹猫，野性斑纹，爆发极快。',       base: { pow: 13, agi: 14, vit: 9, cha: 9 } },

  // ---------- SSR (传说) ----------
  { id: 'jinwu',    name: '焰焰',   palette: 'flame',       pattern: 'tabby',   eyeColor: '#ffd36b', rarity: 'SSR', fluffy: true, ears: 'tufted', desc: '传说中背负太阳的火焰之猫。', base: { pow: 16, agi: 14, vit: 14, cha: 15 } },
  { id: 'yuelian',  name: '月月',   palette: 'cloud',       pattern: 'bicolor', eyeColor: '#9ec8ff', rarity: 'SSR', fluffy: true, desc: '踏月而行的云端仙猫，毛泛微光。',       base: { pow: 14, agi: 17, vit: 13, cha: 16 } },
  { id: 'xingchen', name: '星星',   palette: 'mystic',      pattern: 'spotted', eyeColor: '#ffe08a', rarity: 'SSR', fluffy: true, ears: 'tufted', desc: '身披星河的梦境之猫，极为罕见。', base: { pow: 17, agi: 16, vit: 15, cha: 14 } },
  // Seven genuinely collectible new breeds — included in the normal catch pool.
  { id:'abi', name:'杏仁',palette:'apricot',pattern:'tabby',eyeColor:'#86bd73',rarity:'SR',short:true,
    desc:'阿比西尼亚猫，身形轻巧，额头有细细的暖金纹。',base:{pow:12,agi:11,vit:11,cha:8} },
  { id:'meidu', name:'圈圈',palette:'silver',pattern:'silver',eyeColor:'#85bc77',rarity:'N',
    desc:'美短银虎斑，背上是醒目的漩涡纹。',base:{pow:7,agi:7,vit:9,cha:8} },
  { id:'xuewa', name:'雪袜',palette:'siamese',pattern:'bicolor',eyeColor:'#73c8fa',rarity:'R',point:'#65535a',
    desc:'雪鞋猫，深色面罩配四只白袜子。',base:{pow:8,agi:8,vit:8,cha:10} },
  { id:'mengmai', name:'夜夜',palette:'black',pattern:'solid',eyeColor:'#e3a64d',rarity:'R',
    desc:'孟买猫，一身亮黑毛，像迷你黑豹。',base:{pow:9,agi:10,vit:8,cha:8} },
  { id:'fanmao', name:'奶糖',palette:'cheese',pattern:'bicolor',eyeColor:'#a4ccf9',rarity:'SR',fluffy:true,
    desc:'土耳其梵猫，雪白的身体和奶橘色尾巴。',base:{pow:10,agi:11,vit:9,cha:11} },
  { id:'bosi', name:'绒绒',palette:'cream',pattern:'solid',eyeColor:'#87c5c1',rarity:'SR',fluffy:true,
    desc:'波斯猫，圆圆的娃娃脸，蓬松得像云朵。',base:{pow:7,agi:6,vit:11,cha:14} },
  { id:'wumao', name:'桃桃',palette:'apricot',pattern:'solid',eyeColor:'#89bead',rarity:'SSR',ears:'large',
    desc:'斯芬克斯猫，暖桃色皮肤、大耳朵，活力十足。',base:{pow:17,agi:19,vit:12,cha:14} },
];

// Localized breed names use memorable, pronounceable CAT NAMES in English,
 // not literal pinyin or generic species labels. Chinese save IDs remain stable.
const EN_NAMES={
  "tangyuan": "Mochi",
  "doudou": "Bean",
  "xiaohui": "Misty",
  "moqiu": "Inky",
  "nainai": "Snowball",
  "nietu": "Biscuit",
  "niuniu": "Oreo",
  "sanhua": "Patches",
  "lixiao": "Tuxie",
  "lanbao": "Blueberry",
  "jiafei": "Pudding",
  "dundun": "Pebble",
  "yunduo": "Cloudy",
  "zherdd": "Muffin",
  "qisi": "Cheddar",
  "duanduan": "Shortcake",
  "jinjc": "Goldie",
  "xianluo": "Suki",
  "yinghua": "Blossom",
  "senlin": "Cedar",
  "youling": "Wisp",
  "nuowei": "Maple",
  "baomao": "Spotty",
  "jinwu": "Ember",
  "yuelian": "Luna",
  "xingchen": "Stardust",
  "abi": "Almond", "meidu": "Swirly", "xuewa": "Boots",
  "mengmai": "Midnight", "fanmao": "Vanilla",
  "bosi": "Pompom", "wumao": "Peach"
};
LEGACY_SPECIES.forEach(sp=>{sp.nameEn=EN_NAMES[sp.id]||sp.name;if(sp.id==='jinjc'){sp.storyArt='assets/core-art-remaster/leads/player.webp';sp.collectible=false;}});
// Only these authored species appear in the current collectible catalog and random draws.
const SPECIES = [
  {
    "id": "biscuit",
    "name": "麦饼",
    "nameEn": "Biscuit",
    "rarity": "N",
    "element": "fire",
    "role": "fighter",
    "desc": "橘白短尾曼岛猫，热心。",
    "palette": "orange",
    "pattern": "solid",
    "eyeColor": "#7ee7c4",
    "base": {
      "pow": 7,
      "agi": 6,
      "vit": 7,
      "cha": 5
    },
    "storyArt": "assets/core-art-remaster/collectibles/biscuit.webp"
  },
  {
    "id": "inkspot",
    "name": "墨点",
    "nameEn": "Inkspot",
    "rarity": "N",
    "element": "dark",
    "role": "control",
    "desc": "黑白短毛家猫，腼腆。",
    "palette": "black",
    "pattern": "solid",
    "eyeColor": "#7ee7c4",
    "base": {
      "pow": 5,
      "agi": 7,
      "vit": 6,
      "cha": 8
    },
    "storyArt": "assets/core-art-remaster/collectibles/inkspot.webp"
  },
  {
    "id": "puff",
    "name": "绒蒲",
    "nameEn": "Puff",
    "rarity": "N",
    "element": "grass",
    "role": "tank",
    "desc": "蓝乳玳瑁异短，随和。",
    "palette": "brownTabby",
    "pattern": "solid",
    "eyeColor": "#7ee7c4",
    "base": {
      "pow": 5,
      "agi": 4,
      "vit": 10,
      "cha": 6
    },
    "storyArt": "assets/core-art-remaster/collectibles/puff.webp"
  },
  {
    "id": "shell",
    "name": "贝扣",
    "nameEn": "Shell",
    "rarity": "N",
    "element": "water",
    "role": "support",
    "desc": "奶白土耳其梵猫，爱凑热闹。",
    "palette": "blue",
    "pattern": "solid",
    "eyeColor": "#7ee7c4",
    "base": {
      "pow": 5,
      "agi": 6,
      "vit": 7,
      "cha": 8
    },
    "storyArt": "assets/core-art-remaster/collectibles/shell.webp"
  },
  {
    "id": "cinder",
    "name": "炭栗",
    "nameEn": "Cinder",
    "rarity": "R",
    "element": "fire",
    "role": "assassin",
    "desc": "肉桂阿比西尼亚，大胆。",
    "palette": "orange",
    "pattern": "solid",
    "eyeColor": "#7ee7c4",
    "base": {
      "pow": 10,
      "agi": 10,
      "vit": 5,
      "cha": 6
    },
    "storyArt": "assets/core-art-remaster/collectibles/cinder.webp"
  },
  {
    "id": "ripplet",
    "name": "漪舟",
    "nameEn": "Ripplet",
    "rarity": "SR",
    "element": "water",
    "role": "fighter",
    "desc": "海豹重点布偶，耐心。",
    "palette": "blue",
    "pattern": "solid",
    "eyeColor": "#7ee7c4",
    "base": {
      "pow": 8,
      "agi": 7,
      "vit": 9,
      "cha": 7
    },
    "storyArt": "assets/core-art-remaster/collectibles/ripplet.webp"
  },
  {
    "id": "clover",
    "name": "芽扣",
    "nameEn": "Clover",
    "rarity": "R",
    "element": "grass",
    "role": "control",
    "desc": "玳瑁日本短尾猫，好奇。",
    "palette": "brownTabby",
    "pattern": "solid",
    "eyeColor": "#7ee7c4",
    "base": {
      "pow": 6,
      "agi": 9,
      "vit": 7,
      "cha": 9
    },
    "storyArt": "assets/core-art-remaster/collectibles/clover.webp"
  },
  {
    "id": "fizz",
    "name": "啪嗒",
    "nameEn": "Fizz",
    "rarity": "R",
    "element": "elec",
    "role": "dps",
    "desc": "银斑埃及猫，急性子。",
    "palette": "silver",
    "pattern": "solid",
    "eyeColor": "#7ee7c4",
    "base": {
      "pow": 8,
      "agi": 11,
      "vit": 6,
      "cha": 6
    },
    "storyArt": "assets/core-art-remaster/collectibles/fizz.webp"
  },
  {
    "id": "button",
    "name": "夜扣",
    "nameEn": "Button",
    "rarity": "R",
    "element": "dark",
    "role": "assassin",
    "desc": "黑色德文卷毛，淘气。",
    "palette": "black",
    "pattern": "solid",
    "eyeColor": "#7ee7c4",
    "base": {
      "pow": 9,
      "agi": 10,
      "vit": 5,
      "cha": 7
    },
    "storyArt": "assets/core-art-remaster/collectibles/button.webp"
  },
  {
    "id": "sunlace",
    "name": "晴纱",
    "nameEn": "Sunlace",
    "rarity": "R",
    "element": "light",
    "role": "support",
    "desc": "金吉拉波斯，慢性子。",
    "palette": "white",
    "pattern": "solid",
    "eyeColor": "#7ee7c4",
    "base": {
      "pow": 5,
      "agi": 6,
      "vit": 8,
      "cha": 11
    },
    "storyArt": "assets/core-art-remaster/collectibles/sunlace.webp"
  },
  {
    "id": "tidemark",
    "name": "潮刻",
    "nameEn": "Tidemark",
    "rarity": "SSR",
    "element": "water",
    "role": "tank",
    "desc": "蓝烟挪威森林猫，可靠。",
    "palette": "blue",
    "pattern": "solid",
    "eyeColor": "#7ee7c4",
    "base": {
      "pow": 10,
      "agi": 8,
      "vit": 14,
      "cha": 9
    },
    "storyArt": "assets/core-art-remaster/collectibles/tidemark.webp"
  },
  {
    "id": "emberwing",
    "name": "烬羽",
    "nameEn": "Emberwing",
    "rarity": "SSR",
    "element": "fire",
    "role": "dps",
    "desc": "红虎斑索马里，爱冒险。",
    "palette": "orange",
    "pattern": "solid",
    "eyeColor": "#7ee7c4",
    "base": {
      "pow": 13,
      "agi": 13,
      "vit": 8,
      "cha": 9
    },
    "storyArt": "assets/core-art-remaster/collectibles/emberwing.webp"
  },
  {
    "id": "mossbell",
    "name": "苔盏",
    "nameEn": "Mossbell",
    "rarity": "SR",
    "element": "grass",
    "role": "fighter",
    "desc": "棕虎斑西伯利亚，护短。",
    "palette": "brownTabby",
    "pattern": "solid",
    "eyeColor": "#7ee7c4",
    "base": {
      "pow": 12,
      "agi": 9,
      "vit": 13,
      "cha": 9
    },
    "storyArt": "assets/core-art-remaster/collectibles/mossbell.webp"
  },
  {
    "id": "zest",
    "name": "柚弧",
    "nameEn": "Zest",
    "rarity": "SR",
    "element": "elec",
    "role": "assassin",
    "desc": "雪豹纹孟加拉，坐不住。",
    "palette": "silver",
    "pattern": "solid",
    "eyeColor": "#7ee7c4",
    "base": {
      "pow": 13,
      "agi": 15,
      "vit": 8,
      "cha": 7
    },
    "storyArt": "assets/core-art-remaster/collectibles/zest.webp"
  },
  {
    "id": "nightloom",
    "name": "织夜",
    "nameEn": "Nightloom",
    "rarity": "SR",
    "element": "dark",
    "role": "control",
    "desc": "黑烟缅因，沉静。",
    "palette": "black",
    "pattern": "solid",
    "eyeColor": "#7ee7c4",
    "base": {
      "pow": 14,
      "agi": 14,
      "vit": 15,
      "cha": 18
    },
    "storyArt": "assets/core-art-remaster/collectibles/nightloom.webp"
  },
  {
    "id": "aurora",
    "name": "曦瓷",
    "nameEn": "Aurora",
    "rarity": "SSR",
    "element": "light",
    "role": "support",
    "desc": "双色土耳其安哥拉，慷慨。",
    "palette": "white",
    "pattern": "solid",
    "eyeColor": "#7ee7c4",
    "base": {
      "pow": 12,
      "agi": 15,
      "vit": 14,
      "cha": 19
    },
    "storyArt": "assets/core-art-remaster/collectibles/aurora.webp"
  }
];
function speciesName(sp){
 if(typeof sp==='string')sp=speciesById(sp);
 if(!sp)return (window.MorrowwishI18n?.get?.()==='zh'?'猫猫':'Kitten');
 return window.MorrowwishI18n?.get?.()==='zh'?sp.name:(sp.nameEn||sp.name);
}
// Named story actors are real combat species with unique IDs, but never enter the wild/breeding/gacha pool.
const STORY_SPECIES = Object.freeze({
  "story_muling": {
    "id": "story_muling",
    "storyActor": "muling",
    "name": "暮铃",
    "nameEn": "Muling",
    "element": "dark",
    "desc": "银渐层旅行者，擅长暗影与回响。",
    "rarity": "SSR",
    "storyRole": "assassin",
    "palette": "silver",
    "pattern": "solid",
    "eyeColor": "#7ee7c4",
    "base": {
      "pow": 8,
      "agi": 9,
      "vit": 7,
      "cha": 9
    },
    "storyArt": "assets/core-art-remaster/leads/muling.webp"
  },
  "story_qilan": {
    "id": "story_qilan",
    "storyActor": "qilan",
    "name": "栖蓝",
    "nameEn": "Qilan",
    "element": "water",
    "desc": "港口领航员。",
    "rarity": "R",
    "storyRole": "control",
    "palette": "blue",
    "pattern": "solid",
    "eyeColor": "#7ee7c4",
    "base": {
      "pow": 7,
      "agi": 9,
      "vit": 8,
      "cha": 8
    },
    "storyArt": "assets/npc/qilan-painted.webp"
  },
  "story_jiedeng": {
    "id": "story_jiedeng",
    "storyActor": "jiedeng",
    "name": "岬灯",
    "nameEn": "Jiedeng",
    "element": "light",
    "desc": "灯塔守望者。",
    "rarity": "SR",
    "storyRole": "tank",
    "palette": "cream",
    "pattern": "solid",
    "eyeColor": "#7ee7c4",
    "base": {
      "pow": 7,
      "agi": 6,
      "vit": 10,
      "cha": 9
    },
    "storyArt": "assets/npc/jiedeng-painted.webp"
  },
  "story_yahe": {
    "id": "story_yahe",
    "storyActor": "yahe",
    "name": "芽禾",
    "nameEn": "Yahe",
    "element": "grass",
    "desc": "森林药草师。",
    "rarity": "N",
    "storyRole": "support",
    "palette": "brownTabby",
    "pattern": "solid",
    "eyeColor": "#7ee7c4",
    "base": {
      "pow": 6,
      "agi": 8,
      "vit": 8,
      "cha": 10
    },
    "storyArt": "assets/npc/yahe-painted.webp"
  },
  "story_yuchuan": {
    "id": "story_yuchuan",
    "storyActor": "yuchuan",
    "name": "榆川",
    "nameEn": "Yuchuan",
    "element": "grass",
    "desc": "地下根系守护者。",
    "rarity": "SSR",
    "storyRole": "tank",
    "palette": "brownTabby",
    "pattern": "solid",
    "eyeColor": "#7ee7c4",
    "base": {
      "pow": 9,
      "agi": 6,
      "vit": 10,
      "cha": 7
    },
    "storyArt": "assets/npc/yuchuan-painted.webp"
  },
  "story_xiaomao": {
    "id": "story_xiaomao",
    "storyActor": "xiaomao",
    "name": "小铆",
    "nameEn": "Xiaomao",
    "element": "elec",
    "desc": "年轻工匠。",
    "rarity": "N",
    "storyRole": "dps",
    "palette": "silver",
    "pattern": "solid",
    "eyeColor": "#7ee7c4",
    "base": {
      "pow": 8,
      "agi": 10,
      "vit": 7,
      "cha": 7
    },
    "storyArt": "assets/npc/xiaomao-painted.webp"
  },
  "story_jinpo": {
    "id": "story_jinpo",
    "storyActor": "jinpo",
    "name": "烬婆",
    "nameEn": "Jinpo",
    "element": "fire",
    "desc": "炉城工匠。",
    "rarity": "SR",
    "storyRole": "fighter",
    "palette": "orange",
    "pattern": "solid",
    "eyeColor": "#7ee7c4",
    "base": {
      "pow": 10,
      "agi": 6,
      "vit": 9,
      "cha": 7
    },
    "storyArt": "assets/npc/jinpo-painted.webp"
  },
  "story_yuanfan": {
    "id": "story_yuanfan",
    "storyActor": "yuanfan",
    "name": "远帆",
    "nameEn": "Yuanfan",
    "element": "elec",
    "desc": "群岛信使。",
    "rarity": "R",
    "storyRole": "dps",
    "palette": "silver",
    "pattern": "solid",
    "eyeColor": "#7ee7c4",
    "base": {
      "pow": 7,
      "agi": 11,
      "vit": 7,
      "cha": 7
    },
    "storyArt": "assets/npc/yuanfan-painted.webp"
  },
  "story_lingyu": {
    "id": "story_lingyu",
    "storyActor": "lingyu",
    "name": "翎羽",
    "nameEn": "Lingyu",
    "element": "light",
    "desc": "经验丰富的飞行员。",
    "rarity": "R",
    "storyRole": "fighter",
    "palette": "cream",
    "pattern": "solid",
    "eyeColor": "#7ee7c4",
    "base": {
      "pow": 8,
      "agi": 9,
      "vit": 8,
      "cha": 7
    },
    "storyArt": "assets/npc/lingyu-painted.webp"
  },
  "story_baikan": {
    "id": "story_baikan",
    "storyActor": "baikan",
    "name": "白栞",
    "nameEn": "Baikan",
    "element": "light",
    "desc": "书库研究者。",
    "rarity": "R",
    "storyRole": "support",
    "palette": "cream",
    "pattern": "solid",
    "eyeColor": "#7ee7c4",
    "base": {
      "pow": 6,
      "agi": 8,
      "vit": 8,
      "cha": 10
    },
    "storyArt": "assets/npc/baikan-painted.webp"
  },
  "story_moye": {
    "id": "story_moye",
    "storyActor": "moye",
    "name": "墨页",
    "nameEn": "Moye",
    "element": "dark",
    "desc": "档案守护者。",
    "rarity": "SR",
    "storyRole": "control",
    "palette": "silver",
    "pattern": "solid",
    "eyeColor": "#7ee7c4",
    "base": {
      "pow": 9,
      "agi": 7,
      "vit": 9,
      "cha": 7
    },
    "storyArt": "assets/npc/moye-painted.webp"
  },
  "story_xingya": {
    "id": "story_xingya",
    "storyActor": "xingya",
    "name": "星芽",
    "nameEn": "Xingya",
    "element": "elec",
    "desc": "星原观测者。",
    "rarity": "SSR",
    "storyRole": "dps",
    "palette": "silver",
    "pattern": "solid",
    "eyeColor": "#7ee7c4",
    "base": {
      "pow": 8,
      "agi": 9,
      "vit": 7,
      "cha": 8
    },
    "storyArt": "assets/npc/xingya-painted.webp"
  },
  "story_lichuan": {
    "id": "story_lichuan",
    "storyActor": "lichuan",
    "name": "砾川",
    "nameEn": "Lichuan",
    "element": "fire",
    "desc": "星原商队向导。",
    "rarity": "N",
    "storyRole": "fighter",
    "palette": "orange",
    "pattern": "solid",
    "eyeColor": "#7ee7c4",
    "base": {
      "pow": 9,
      "agi": 7,
      "vit": 9,
      "cha": 7
    },
    "storyArt": "assets/npc/lichuan-painted.webp"
  }
});
function speciesById(id) { return STORY_SPECIES[id] || SPECIES.find(s => s.id === id) || LEGACY_SPECIES.find(s => s.id === id); }

// Owned combat budget is independent of wild rarity odds and encounter stats.
const OWNED_RARITY_BUDGET = Object.freeze({N:1,R:1.05,SR:1.10,SSR:1.15});
function ownedBudget(catOrSpecies) {
  if(catOrSpecies?.protagonist)return OWNED_RARITY_BUDGET.R;
  const sp=catOrSpecies?.species ? speciesById(catOrSpecies.species) : catOrSpecies;
  return OWNED_RARITY_BUDGET[sp?.rarity] || 1;
}
function rarityInfo(cat, en=false) {
  const sp=cat?.species ? speciesById(cat.species) : cat;
  if(cat?.protagonist)return {key:'hero',name:en?'Protagonist':'主角',label:en?'Protagonist':'主角'};
  const key=sp?.rarity||'N';
  const name=en?({N:'Common',R:'Rare',SR:'Epic',SSR:'Legendary'}[key]):RARITY[key].name;
  return {key,name,label:key+' · '+name};
}
function rollSpecies(luck = 0) {
  const rarities = Object.values(RARITY);
  let total = 0;
  const adj = rarities.map(r => {
    const bias = r.key === 'N' ? (1 - luck * 0.6) : (1 + luck * (r.key === 'SSR' ? 3 : r.key === 'SR' ? 2 : 1));
    const w = r.weight * bias; total += w; return { r, w };
  });
  let roll = Math.random() * total;
  let chosen = adj[0].r;
  for (const a of adj) { if ((roll -= a.w) <= 0) { chosen = a.r; break; } }
  const pool = SPECIES.filter(s => s.rarity === chosen.key);
  return pool[Math.floor(Math.random() * pool.length)];
}

window.GameData = { RARITY, SPECIES, STORY_SPECIES, speciesById, speciesName, rollSpecies, OWNED_RARITY_BUDGET, ownedBudget, rarityInfo };
