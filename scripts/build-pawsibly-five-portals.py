#!/usr/bin/env python3
"""Isolated, no-deployment portable build; no unverified platform credentials."""
import re, shutil, zipfile, json, hashlib, os
from pathlib import Path
src=Path('public'); out=Path('release-kit/pawsibly'); out.mkdir(parents=True,exist_ok=True)
game=out/'standalone'; game.mkdir(exist_ok=True)
shutil.copytree(src/'pawsibly-innocent',game,dirs_exist_ok=True)
for name in ('lang.js','studio-audio.js'):
    shutil.copy2(src/name,game/name)
(game/'audio').mkdir(exist_ok=True)
shutil.copy2(src/'audio/cat-happy-clappy.ogg',game/'audio/cat-happy-clappy.ogg')
for file in game.glob('*.js'):
    s=file.read_text()
    s=s.replace("location.pathname.split('/').filter(Boolean)[0]","'pawsibly-innocent'")
    if file.name=='cat-music.js':
        s=s.replace('if(!wanted||document.hidden)return false;','if(!wanted||document.hidden||window.__MW_PORTAL_PAUSED__)return false;')
    if file.name=='studio-audio.js':
        s=s.replace('window.MorrowwishAudio={start,toggle','window.MorrowwishAudio={start,stop,toggle')
    if file.name=='game.js':
        # Keep normal gameplay, isolate website-only links and test controls.
        s,n=re.subn(r'window\.__PAWSIBLY_TEST__=\{[^\n]+\};','',s)
        assert n==1, 'test hook changed'
        # Pause both input and any queued route / yarn timers while unfocused.
        at='window.addEventListener("resize",fitCanvasPixels);'
        assert at in s
        s=s.replace(at,'''window.addEventListener("resize",fitCanvasPixels);
let portalSuspended=false,portalPlatformPaused=false,portalWindowPaused=false,portalYarnWasRunning=false;
function portalFocus(paused){
 if(portalSuspended===paused)return;portalSuspended=paused;window.__MW_PORTAL_PAUSED__=paused;
 if(paused){route=[];if(movingTimer){clearInterval(movingTimer);movingTimer=null}if(yarnChaseTimer!==null){clearInterval(yarnChaseTimer);yarnChaseTimer=null;portalYarnWasRunning=true}window.MorrowwishAudio?.stop?.();window.MorrowwishCatMusic?.stop?.();}
 else {if(portalYarnWasRunning&&s?.yarnAnimating&&!menuOpen){yarnChaseTimer=setInterval(advanceYarnChase,470)}portalYarnWasRunning=false;if(window.MorrowwishAudio?.isEnabled?.())window.MorrowwishAudio?.start?.();if(window.MorrowwishCatMusic?.status?.().enabled)window.MorrowwishCatMusic?.start?.();}
}
function syncPortalPause(){portalFocus(portalPlatformPaused||portalWindowPaused||document.hidden)}
window.MorrowwishPortalPause=paused=>{portalPlatformPaused=Boolean(paused);syncPortalPause()};
window.addEventListener("blur",()=>{portalWindowPaused=true;syncPortalPause()});window.addEventListener("focus",()=>{portalWindowPaused=false;syncPortalPause()});document.addEventListener("visibilitychange",syncPortalPause);''')
        for token in ('function single(dx,dy){','function onClick(e){','function waitTurn(){','function throwYarn(){','function command(x,y){','function advanceCatRoute(){','function advanceYarnChase(){'):
            assert token in s
            s=s.replace(token,token+'if(portalSuspended)return;')
    file.write_text(s)
p=game/'index.html'; h=p.read_text()
h=re.sub(r'<script\b[^>]*src="/(?:social-share|telemetry|playtest-pulse|game-fullscreen|game-settings)\.js[^"]*"[^>]*></script>','',h)
h=re.sub(r'<link\b[^>]*rel="canonical"[^>]*>','',h)
h=re.sub(r'<meta\b[^>]*(?:property="og:|name="twitter:)[^>]*>','',h)
h=re.sub(r"@import url\('https://fonts.googleapis.com/[^']+'\);",'',h)
h=h.replace('href="/pawsibly-innocent/','href="./').replace('src="/pawsibly-innocent/','src="./')
for n in ('lang.js','studio-audio.js'):h=h.replace('src="/'+n,'src="./'+n)
h=h.replace('"/audio/','"./audio/')
# Keep IDs referenced by game.js, but make all website-only anchors inert.
h=re.sub(r'(<a\b[^>]*?)\s+href="[^"]*"([^>]*>)',r'\1\2',h)
h=h.replace('</head>','<style>#stageHome,#back,#shareResult,#musicCredit{display:none!important}#portalAudio{display:flex;gap:4px;align-items:center;flex-wrap:wrap}#portalAudio button{font-size:11px;padding:5px 7px;border:1px solid #eed7d6;border-radius:8px;background:#fff8ee;color:#42334c}</style></head>')
h=h.replace('<div class="in-game-controls" id="stageControls">','<div class="in-game-controls" id="stageControls"><div id="portalAudio"><button id="portalLang" type="button" aria-label="Language">EN / 中文</button><button id="portalMusic" type="button" aria-label="Music">♫</button><button id="portalSound" type="button" aria-label="Sound effects">SFX</button></div>')
h=h.replace('</body>','<script src="./portal-controls.js" defer></script></body>')
p.write_text(h)
(game/'portal-controls.js').write_text("""(()=>{const $=id=>document.getElementById(id);const sync=()=>{$('portalMusic').setAttribute('aria-pressed',String(window.MorrowwishCatMusic?.status?.().enabled));$('portalSound').setAttribute('aria-pressed',String(window.MorrowwishAudio?.isEnabled?.()));};$('portalLang').onclick=()=>{window.MorrowwishI18n.set(window.MorrowwishI18n.get()==='zh'?'en':'zh');};$('portalMusic').onclick=()=>{$('music').click();sync()};$('portalSound').onclick=()=>{$('sound').click();sync()};sync();})();""")
(game/'LICENSE-MUSIC.txt').write_text('Happy Clappy Loop — OwlishMedia, CC0 1.0. Source: https://opengameart.org/content/happy-clappy-loop\n')
# Standalone ZIP is a candidate, not a claim of completed platform SDK certification.
def pack(directory,name):
    zpath=out/name
    with zipfile.ZipFile(zpath,'w',zipfile.ZIP_DEFLATED) as z:
        for f in sorted(directory.rglob('*')):
            if f.is_file():z.write(f,f.relative_to(directory))
    with zipfile.ZipFile(zpath) as z:
        assert 'index.html' in z.namelist() and z.testzip() is None
    return {'file':name,'bytes':zpath.stat().st_size,'sha256':hashlib.sha256(zpath.read_bytes()).hexdigest()}
record=pack(game,'pawsibly-standalone-candidate.zip')
# Preserve the existing itch delivery model, which keeps saves and live updates.
itch=out/'itch-wrapper';itch.mkdir(exist_ok=True)
(itch/'index.html').write_text('''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pawsibly Innocent!</title><style>html,body,iframe{margin:0;width:100%;height:100%;border:0;display:block;overflow:hidden}</style><iframe title="Pawsibly Innocent!" src="https://morrowwish.vercel.app/pawsibly-innocent/?utm_source=itch&utm_medium=portal&utm_campaign=pawsibly-innocent-playtest" allow="fullscreen; autoplay" allowfullscreen></iframe></html>''')
wrapper=pack(itch,'pawsibly-itch-live-wrapper.zip')
(out/'build-manifest.json').write_text(json.dumps({'source':os.environ.get('SOURCE_SHA','unknown'),'packages':[record,wrapper],'status':'candidate; SDK/portal approval pending','sourceGameModified':False},indent=2)+'\n')
print(record,wrapper)
