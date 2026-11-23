#!/usr/bin/env python3
"""Build isolated, original-game GamePix submission ZIPs without changing production.
These are SDK-free portal builds. External streamed background music is disabled,
while locally synthesized sound effects are preserved.
"""
import csv
import json
import re
import shutil
import sys
import zipfile
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import unquote, urlparse

from PIL import Image, ImageOps

ROOT=Path(__file__).resolve().parents[1]
PUBLIC=ROOT/"public"
DIST=ROOT/"dist"/"gamepix"
GAMES=[
 ("cat-bond","Cat Bond","Adventure","Raise a cozy cat family, explore new regions, and collect 33 breeds. Train your favorite cats, fight real-time battles, and unleash illustrated two-cat combo moves to earn Golden Paw medals.","Mouse, tap or touch to select actions, explore the map, manage your yard and guide your cats in battles."),
 ("pawsibly-innocent","Pawsibly Innocent!","Puzzle","Sneak through eight illustrated rooms as a curious cat. Steal tasty snacks, distract humans with yarn, hide from trouble and collect souvenirs while escaping without getting caught.","Click or tap to move the cat, interact with objects and use yarn to distract humans. Complete room objectives while staying unseen."),
 ("tiny-town","No More Mondays: Wish Cascade","Casual","Build a whimsical life without deadlines. Make seven days of playful wishes, explore surprising travel adventures and create a personalized illustrated ending in your own little town.","Click or tap to make choices, combine town wonders and explore each day. There is no time pressure."),
 ("elsewhere","Elsewhere","Adventure","What if you woke up in another life? Explore eight illustrated dream worlds, from Parisian romance to a floating island, and discover up to 80 collectible story endings through meaningful choices.","Read scenes, then click or tap a choice to shape the next chapter and unlock different endings."),
 ("flip-dash","Flip Dash","Arcade","A one-button gravity-flipping runner. Bounce between floor and ceiling, dodge pink hazards, collect gold coins and try to beat your best score or the daily challenge.","Press Space or tap the screen to reverse gravity. Time every flip to avoid hazards and collect coins."),
 ("parcel-panic","Parcel Panic","Casual","Keep a hectic parcel depot under control. Sort packages fast, manage express orders and survive increasingly demanding shifts when every mistake matters.","Use the on-screen controls or mouse to sort each parcel correctly before the rush gets out of hand."),
 ("pocket-aquarium","Pocket Aquarium","Casual","Dive into a compact one-minute aquarium challenge. Match food colors, time each drop and keep the water clean while caring for colorful fish.","Tap or click to dispense food and manage the tank. Match fish colors and make each second count."),
]
BLOCKED_SCRIPTS=("telemetry.js","social-share.js","playtest-pulse.js")
HOST_JS=r"""/* GamePix SDK-free isolation: no third-party analytics or outbound navigation. */
(function(){
 'use strict';
 window.arcadeMetric=function(){return undefined;};
 window.open=function(){return null;};
 function scrubLinks(){
   document.querySelectorAll('a[href]').forEach(function(a){
     const href=a.getAttribute('href')||'';
     if(href && href.charAt(0)!=='#'){
       a.removeAttribute('href');
       a.setAttribute('tabindex','-1');
       a.setAttribute('aria-hidden','true');
       a.style.setProperty('display','none','important');
     }
   });
 }
 if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',scrubLinks);
 else scrubLinks();
 new MutationObserver(scrubLinks).observe(document.documentElement,{childList:true,subtree:true});
 document.addEventListener('visibilitychange',function(){
   if(document.hidden) document.querySelectorAll('audio,video').forEach(function(a){a.pause();});
 });
})();
"""
HOST_CSS="""/* No links to the Morrow Wish hub, publishers or external services. */
a[href]:not([href^="#"]){display:none!important}\n#musicPermission{display:none!important}
html,body{max-width:100%;overflow-x:hidden}
"""
MUSIC_STUB=r"""/* Streamed FreePD soundtrack intentionally excluded from GamePix offline ZIP.
   Keep original browser-generated SFX in studio-audio.js. */
(function(){
  'use strict';
  window.MorrowwishMusic={
   start:function(){return false;},stop:function(){},
   toggle:function(){return false;},sync:function(){},
   switchScene:function(){return true;},duckFor:function(){},
   status:function(){return {enabled:false,offline:true};}
  };
})();
"""
DREAM_AUDIO_STUB=r"""/* GamePix build: local sound effects only, no streamed background tracks. */
(function(){
 'use strict';
 let enabled=true,ctx=null;
 function fx(){
  if(!enabled)return;
  try{
   const C=window.AudioContext||window.webkitAudioContext;
   if(!C)return;ctx=ctx||new C();ctx.resume().catch(function(){});
   const o=ctx.createOscillator(),g=ctx.createGain(),t=ctx.currentTime;
   o.type='sine';o.frequency.value=660;
   g.gain.setValueAtTime(0.0001,t);
   g.gain.exponentialRampToValueAtTime(0.018,t+0.012);
   g.gain.exponentialRampToValueAtTime(0.0001,t+0.12);
   o.connect(g);g.connect(ctx.destination);o.start(t);o.stop(t+0.13);
  }catch(e){}
 }
 window.DreamAudio={
  controls:function(){return '';},sync:function(){},setWorld:function(){},
  fx:fx,toggleMusic:function(){},toggleFX:function(){enabled=!enabled;},
  status:function(){return {offline:true,effectsOn:enabled,musicOn:false};}
 };
})();
"""

def copy_tree(src,dst):
 if not src.exists():return
 if src.is_dir():shutil.copytree(src,dst,dirs_exist_ok=True,ignore=shutil.ignore_patterns(".DS_Store"))
 else:
  dst.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(src,dst)

def strip_online(html):
 # Remove links to external assets, tracking code, canonical metadata and schema.org.
 html=re.sub(r'<script\b[^>]*type\s*=\s*["\x27]application/ld\+json["\x27][^>]*>.*?</script\s*>','',html,flags=re.I|re.S)
 html=re.sub(r'<script\b[^>]*src\s*=\s*["\x27](?:https?:)?//[^"\x27]+["\x27][^>]*>\s*</script\s*>','',html,flags=re.I|re.S)
 html=re.sub(r'<script\b[^>]*src\s*=\s*["\x27][^"\x27]*(?:telemetry|social-share|playtest-pulse)\.js[^"\x27]*["\x27][^>]*>\s*</script\s*>','',html,flags=re.I|re.S)
 html=re.sub(r'<script\b[^>]*src\s*=\s*["\x27][^"\x27]*_vercel/insights/script\.js[^"\x27]*["\x27][^>]*>\s*</script\s*>','',html,flags=re.I|re.S)
 html=re.sub(r'<link\b[^>]*(?:https?://|rel\s*=\s*["\x27]canonical["\x27])[^>]*>','',html,flags=re.I|re.S)
 html=re.sub(r'<meta\b[^>]*(?:property\s*=\s*["\x27]og:|name\s*=\s*["\x27]twitter:)[^>]*>','',html,flags=re.I|re.S)
 html=re.sub(r'@import\s+(?:url\()?["\x27]?https?://[^;\n]+;','',html,flags=re.I)
 # Original page lives in the game subdirectory, shared dependencies one level up.
 html=re.sub(r'((?:src|href|poster)\s*=\s*["\x27])/(?!/)',r'\1../',html,flags=re.I)
 html=re.sub(r'(url\(\s*["\x27]?)/(?!/)',r'\1../',html,flags=re.I)
 host='<script src="../gamepix-host.js"></script><link rel="stylesheet" href="../gamepix-host.css">'
 html=re.sub(r'<head([^>]*)>',lambda m:m.group(0)+host,html,count=1,flags=re.I)
 return html

def scrub_css(css):
 css=re.sub(r'@import\s+(?:url\()?["\x27]?https?://[^;\n]+;','',css,flags=re.I)
 css=re.sub(r'(url\(\s*["\x27]?)/(?!/)',r'\1../',css,flags=re.I)
 return css

def scrub_js(js):
 # Rewrite only root-relative quoted asset URLs. Never rewrite code operators.
 js=re.sub(r'(["\x27])/(?!/|api(?:/|["\x27]))(?=[A-Za-z_])',r'\1../',js)
 return js

def assemble(slug):
 target=DIST/"_work"/slug
 if target.exists():shutil.rmtree(target)
 target.mkdir(parents=True)
 # Preserve the original game route, which is important to game music/audio,
 # save scopes, locale logic and portal-mode detection.
 copy_tree(PUBLIC/slug,target/slug)
 for p in PUBLIC.iterdir():
  if p.is_file() and p.suffix.lower() in (".js",".css") and p.name not in BLOCKED_SCRIPTS:
   copy_tree(p,target/p.name)
 for folder in ("art","icons","social"):
  copy_tree(PUBLIC/folder,target/folder)
 # Remove preview pages, test files, and source notes that are not gameplay.
 for p in list((target/slug).rglob("*")):
  if p.is_file() and (p.suffix.lower()==".md" or p.name in ("duo-preview.html","duo-showcase.html","adult-preview.html","sw.js")):
   p.unlink()
 for p in target.rglob("*"):
  if not p.is_file():continue
  if p.name=="studio-music.js":
   p.write_text(MUSIC_STUB,encoding="utf-8")
  elif p.name=="dream-audio.js":
   p.write_text(DREAM_AUDIO_STUB,encoding="utf-8")
  elif p.suffix.lower()==".html":
   data=p.read_text(encoding="utf-8")
   if p==target/slug/"index.html":
    data=strip_online(data)
    if slug=="pawsibly-innocent":
     # The upstream repo currently does not contain this recorded music track.
     # Avoid a broken preload and use the original synth-based local SFX instead.
     data=re.sub(r'<link[^>]*cat-happy-clappy\.ogg[^>]*>','',data,flags=re.I)
     data=data.replace('src="../audio/cat-happy-clappy.ogg"','')
     data=data.replace('src="/audio/cat-happy-clappy.ogg"','')
   p.write_text(data,encoding="utf-8")
  elif p.suffix.lower()==".css":
   p.write_text(scrub_css(p.read_text(encoding="utf-8")),encoding="utf-8")
  elif p.suffix.lower()==".js" and p.name not in ("studio-music.js","dream-audio.js"):
   p.write_text(scrub_js(p.read_text(encoding="utf-8")),encoding="utf-8")
 (target/"gamepix-host.js").write_text(HOST_JS,encoding="utf-8")
 (target/"gamepix-host.css").write_text(HOST_CSS,encoding="utf-8")
 # Landing screen is local and redirects inside the hosted frame.
 # Do not iframe the game inside an extra iframe.
 idx="""<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1,user-scalable=no"></head><body style="margin:0;background:#182331;color:white;font:16px system-ui;min-height:100vh;display:grid;place-items:center"><span>Loading game...</span><script>location.replace("./%s/index.html"+(location.search?(location.search+"&platform=portal"):"?platform=portal")+location.hash);</script></body></html>"""%slug
 (target/"index.html").write_text(idx,encoding="utf-8")
 # Explicitly avoid including external streaming data and other games.
 # The optional remote soundtrack was not distributed: original recorded SFX stay local.
 return target

class Assets(HTMLParser):
 def __init__(self):super().__init__();self.items=[]
 def handle_starttag(self,tag,attrs):
  data=dict(attrs)
  if tag=="script" and data.get("src"):self.items.append((tag,data["src"]))
  if tag=="link" and data.get("href") and data.get("rel","").lower() in ("stylesheet","icon","manifest","preload"):
   self.items.append((tag,data["href"]))
  if tag in ("img","audio","video","source") and data.get("src"):self.items.append((tag,data["src"]))

def static_audit(slug,folder):
 issues=[]
 page=folder/slug/"index.html"
 if not page.exists():return ["MISSING game index"]
 text=page.read_text(encoding="utf-8")
 parsed=Assets();parsed.feed(text)
 for tag,url in parsed.items:
  if re.match(r'^(?:https?:)?//',url,re.I):
   issues.append("remote resource in game index: "+url[:110]);continue
  if url.startswith(("data:","#","blob:")):continue
  local=(page.parent/unquote(urlparse(url).path)).resolve()
  try:local.relative_to(folder.resolve())
  except ValueError:issues.append("escapes package: "+url);continue
  if not local.exists():issues.append("missing asset: "+url)
 if re.search(r'<script\b[^>]*src\s*=\s*["\x27][^"\x27]*telemetry\.js',text,re.I):
  issues.append("analytics included")
 if re.search(r'@import\s+(?:url\()?["\x27]?https?://',text,re.I):
  issues.append("remote CSS @import")
 return sorted(set(issues))

def zip_directory(src,out):
 with zipfile.ZipFile(out,"w",zipfile.ZIP_DEFLATED,compresslevel=7) as f:
  for file in sorted(src.rglob("*")):
   if file.is_file():f.write(file,file.relative_to(src).as_posix())
 with zipfile.ZipFile(out) as f:
  assert f.testzip() is None
  assert "index.html" in f.namelist()
  assert any(n.endswith("/index.html") for n in f.namelist())

def make_art(slug):
 out=DIST/"artwork"/slug;out.mkdir(parents=True,exist_ok=True)
 promo=PUBLIC/"promo"/slug
 if slug=="cat-bond":
  wide=PUBLIC/slug/"assets"/"yard_bg.png"
  square=PUBLIC/"art"/"cat-bond-home.webp"
  portrait=promo/"cover-portrait.png"
 else:
  wide=promo/"cover-landscape.png"
  square=promo/"cover-square.png"
  portrait=promo/"cover-portrait.png"
 if not wide.exists() or not square.exists():
  raise RuntimeError("Missing original illustrated artwork: "+slug)
 source=Image.open(wide).convert("RGB")
 ImageOps.fit(source,(1280,720),method=Image.Resampling.LANCZOS,centering=(.5,.5)).save(out/"cover-landscape.png",optimize=True)
 source=Image.open(square).convert("RGB")
 ImageOps.fit(source,(512,512),method=Image.Resampling.LANCZOS).save(out/"icon-square.png",optimize=True)
 if portrait.exists():
  source=Image.open(portrait).convert("RGB")
  ImageOps.fit(source,(720,1280),method=Image.Resampling.LANCZOS).save(out/"cover-portrait.png",optimize=True)
 return out

def main():
 if DIST.exists():shutil.rmtree(DIST)
 DIST.mkdir(parents=True)
 records=[];audits=[]
 for slug,name,genre,desc,controls in GAMES:
  game=assemble(slug)
  issues=static_audit(slug,game)
  make_art(slug)
  dst=DIST/(slug+".zip");zip_directory(game,dst)
  records.append({
   "title":name,"slug":slug,"studio":"Morrow Wish","genre_suggestion":genre,
   "description_en":desc,"instructions_en":controls,
   "engine":"HTML5 / vanilla JavaScript","language":"English, Chinese",
   "game_zip":slug+".zip",
   "landscape_cover":"artwork/"+slug+"/cover-landscape.png",
   "square_icon":"artwork/"+slug+"/icon-square.png",
   "portrait_cover":"artwork/"+slug+"/cover-portrait.png",
   "original_game_url":"https://morrowwish.vercel.app/"+slug+"/",
   "sdk":"SDK-free","external_analytics":"Removed in portal build",
   "external_background_music":"Disabled; locally synthesized sound effects retained",
   "allow_distribution":"Review with publisher before enabling"
  })
  audits.append({"game":slug,"archive_bytes":dst.stat().st_size,"static_checks":issues,"status":"STATIC_CHECK_PASS" if not issues else "NEEDS_REVIEW"})
  print(slug, "ZIP",dst.stat().st_size,"issues:",issues or "none",flush=True)
 (DIST/"SUBMISSION_DATA.json").write_text(json.dumps(records,indent=2,ensure_ascii=False),encoding="utf-8")
 with (DIST/"SUBMISSION_DATA.csv").open("w",newline="",encoding="utf-8-sig") as f:
  writer=csv.DictWriter(f,fieldnames=list(records[0]));writer.writeheader();writer.writerows(records)
 (DIST/"STATIC_QA.json").write_text(json.dumps(audits,indent=2),encoding="utf-8")
 guide="""# Morrow Wish — GamePix submission kits (7 original HTML5 games)

Seven separate game archives: upload ONE \`.zip\` per GamePix game listing.
Artwork is stored separately in \`artwork/<slug>/\`.
\`SUBMISSION_DATA.csv\` and \`SUBMISSION_DATA.json\` contain ready-to-paste English fields.

Important:
- SDK-free GamePix builds, not production site deployments.
- Remove all external analytics, share-button scripts, outbound navigation, and externally streamed background music in this portal build. Local sound effects remain.
- Each game ZIP uses an \`index.html\` loading page to forward to its original local game route, which preserves game route-sensitive behavior. All game resources are bundled locally.
- Covers are rendered from existing Morrow Wish artwork, not generated placeholders.
- Before actual GamePix submission, test mouse/touch, desktop 640x480 iframe, portrait and landscape, gameplay + retry, audio visibility, and the provided HTML5 archive in the developer testkit.
- \`STATIC_QA.json\` records filesystem/reference checks only. These are not browser playtest passes.
- GamePix's current guidelines prohibit outbound links, analytics, third-party SDKs, external ads, and nonrelative resource loading.
- Do not upload this outer kit ZIP as a game. Unzip it and upload each \`<slug>.zip\`.
- If a title is already in a CrazyGames review, confirm whether any future exclusivity commitment applies before enabling GamePix partner distribution.
- Source © 2026 Morrow Wish, all rights reserved. Check third-party licensing before distribution.

Official GamePix developer site: https://partners.gamepix.com/developers
Guidelines: https://partners.gamepix.com/guidelines/submission
"""
 (DIST/"README_GAMEPIX.md").write_text(guide,encoding="utf-8")
 shutil.rmtree(DIST/"_work")
 master=ROOT/"dist"/"Morrow-Wish-GamePix-Seven-Games-20261122.zip"
 with zipfile.ZipFile(master,"w",zipfile.ZIP_DEFLATED,compresslevel=3) as f:
  for item in sorted(DIST.rglob("*")):
   if item.is_file():f.write(item,item.relative_to(DIST).as_posix())
 print("FINAL:",master,"bytes:",master.stat().st_size)
 if any(a["static_checks"] for a in audits):
  print("WARNING: Some static checks require attention. See STATIC_QA.json")
  return 1
 return 0

if __name__=="__main__":sys.exit(main())
