# Cat Bond 图片素材需求(DALL·E prompt + 接线计划)

架构注: 游戏原本纯 Canvas2D 零图片,但 owner 已开图片路(assets/ 下有 duo-premium-sheet.webp
等)。图片用于高展示/非实时场景。透明素材用 PNG,带氛围背景用 WebP。
统一风格基线(每个 prompt 都含): soft watercolor + gentle cartoon, cozy children's-book
style, matching Cat Bond's 25-breed painted kittens, no text, no UI.

交付: 生成后放 public/cat-bond/assets/,按建议文件名,告诉我文件名我接线。

## P0
### 1. 六系终结技大图 (方形1024, 带元素渐变氛围底, 文件名 ult-{fire,water,grass,elec,dark,light}.webp)
- fire: cute watercolor kitten unleashing a massive fiery roar, warm orange-red flames swirling, heroic pose, radiant ember glow background
- water: ...summoning a giant tidal wave, swirling blue water and foam, cool aqua glow
- grass(阳光烈焰): ...charging a radiant solar-flare beam through blooming vines and petals, golden-green light, sunlit meadow glow
- elec(破坏死光): ...firing a dazzling electric destruction beam from its mouth, crackling yellow-white lightning, electric blue glow
- dark(虚吞): ...opening a swirling void portal of purple-black shadow energy, dark violet cosmic glow
- light: ...radiating a holy moonlight halo burst, soft white-gold rays, luminous pastel glow

### 2. 护盾护罩 (透明PNG 512, 中心透明边缘发光, shield-{bubble,wall,static}.png)
- bubble: translucent soap-bubble dome shield, iridescent blue/pink rim, hollow transparent center, soft glow edges, transparent bg
- wall: vertical translucent energy barrier wall, soft cyan light panels glowing edges, semi-transparent, transparent bg
- static: translucent electric dome crackling with yellow sparks, hexagonal energy pattern faint, semi-transparent center, transparent bg

## P1
### 3. 元素场地纹理 (可平铺tile 256, 半透明, field-{fire,water,grass,elec}.png)
seamless tileable watercolor texture, top-down game floor overlay, semi-transparent:
fire=glowing embers+cracked warm ground; water=shallow rippling puddle blue; grass=soft grass+tiny flowers; elec=faint electric field pale yellow sparks
### 4. 技能图标 sprite sheet (skill-icons.webp, 透明, 每格64): fish-toss, yarn-ball, flame claw, water whip, leaf dart, lightning arc, shadow swipe, light beam, heal sparkle, shield bubble — consistent thin outline
### 5. 状态图标 (status-icons.webp, 透明, 每格32): burn, ice, lightning(paralyze), vine(bind), dizzy stars, bleed droplet, expose crosshair

## P2
### 6. 新技能 VFX (透明PNG): vfx-stareyes(pink hypnotic hearts+stars cone), vfx-pawwave(pink paw-pad shockwave rings), vfx-cagering(green vine cage ring top-down)
### 7. 收服庆祝 (capture-celebrate.webp, 方形1024): joyful kitten being tamed, floating hearts+sparkles, warm cozy glow
### 8. 五区域背景 (横版~1600×900, region-{home,sakura,creek,volcano,ruins}.webp): cozy watercolor landscape, no characters:
home=sunny backyard garden; sakura=pink cherry-blossom grove; creek=clear forest creek; volcano=warm volcanic rocks; ruins=ancient moonlit ruins
