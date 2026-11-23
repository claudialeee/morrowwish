#!/usr/bin/env python3
"""Build a self-contained Y8 export of Cat Bond without changing the live game.

Run from repository root:
    python3 scripts/y8-catbond-build.py
Optional Y8_APP_ID is obtained in the Developer Portal; do not invent it.
"""
from __future__ import annotations
import json, os, re, shutil, subprocess, sys, zipfile
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public"
OUT = ROOT / ".check" / "y8-cat-bond"
GAME = OUT / "game"
APP_ID = os.environ.get("Y8_APP_ID", "").strip()
GAME_ID = os.environ.get("Y8_GAME_ID", "").strip()

if not (SOURCE / "cat-bond" / "index.html").exists():
    raise SystemExit("Missing production Cat Bond source")
if GAME.exists():
    shutil.rmtree(GAME)
GAME.mkdir(parents=True)
shutil.copytree(SOURCE / "cat-bond", GAME, dirs_exist_ok=True,
                ignore=shutil.ignore_patterns("adult-preview.html", "duo-showcase.html"))
for name in ("lang.js", "studio-audio.js", "studio-music.js"):
    shutil.copy2(SOURCE / name, GAME / name)
(GAME / "icons").mkdir(exist_ok=True)
shutil.copy2(SOURCE / "icons" / "cat-bond.svg", GAME / "icons" / "cat-bond.svg")

# The public soundtrack sources are FreePD CC0. Save the two real Cat Bond
# tracks locally so the Y8 build has no dependency on a remote music server.
music = GAME / "studio-music.js"
text = music.read_text()
url_re = re.compile(r"https://en[.]freepd[.]cn/api/music/[a-zA-Z0-9]+")
all_music = list(dict.fromkeys(url_re.findall(text)))
if len(all_music) < 2:
    raise SystemExit("Unexpected FreePD music catalog: check source before exporting")
(GAME / "audio").mkdir(exist_ok=True)
for i, url in enumerate(all_music):
    # The Cat Bond track and its battle track are present in this same catalog.
    filename = f"freepd-cc0-{i}.mp3"
    target = GAME / "audio" / filename
    if i in (3, 5):
        error = None
        for attempt in range(3):
            try:
                req = Request(url, headers={"User-Agent": "MorrowWishY8Exporter/1.0"})
                with urlopen(req, timeout=30) as response, target.open("wb") as out:
                    shutil.copyfileobj(response, out)
                if target.stat().st_size < 5000:
                    raise ValueError("Music download suspiciously small")
                error = None
                break
            except Exception as exc:
                error = exc
        if error:
            raise SystemExit(f"Cannot obtain CC0 soundtrack for offline export: {url}: {error}")
        text = text.replace(url, "./audio/" + filename)
    else:
        # Unused games' tracks and existing error fallback must not request
        # remote resources. Reuse the local garden track after all URLs exist.
        text = text.replace(url, "__MUSIC_FALLBACK__")
text = text.replace("__MUSIC_FALLBACK__", "./audio/freepd-cc0-3.mp3")
text = text.replace("location.pathname.split('/').filter(Boolean)[0]||''", "'cat-bond'")
music.write_text(text)

# An uploaded Y8 game path is not the original /cat-bond/ website route.
audio_file = GAME / "studio-audio.js"
audio_code = audio_file.read_text().replace(
    "const route=location.pathname.split('/').filter(Boolean)[0];",
    "const route='cat-bond';")
# Expose the existing stop() implementation to the isolated Y8 blur handler.
audio_code = audio_code.replace("window.MorrowwishAudio={start,toggle", "window.MorrowwishAudio={start,stop,toggle")
audio_file.write_text(audio_code)


# Rewrite absolute website paths to relative files in the ZIP.
def portable(s: str) -> str:
    s = s.replace("/cat-bond/", "./")
    for name in ("lang.js", "studio-audio.js", "studio-music.js",
                 "game-settings.js", "game-fullscreen.js", "telemetry.js"):
        s = s.replace("/" + name, "./" + name)
    s = s.replace("/icons/cat-bond.svg", "./icons/cat-bond.svg")
    return s

for f in list(GAME.rglob("*.js")) + list(GAME.rglob("*.css")):
    f.write_text(portable(f.read_text()))

# Y8 is not the Morrow Wish website. Remove links and site share controls.
index = GAME / "index.html"
html = portable(index.read_text())
html = re.sub(r'<a\b(?=[^>]*\bid="cb-home")[^>]*>.*?</a>', "", html, flags=re.S)
html = re.sub(r'<link\b[^>]*\brel="(?:canonical|manifest)"[^>]*>', "", html)
html = re.sub(r'<meta\b[^>]*(?:property="og:|name="twitter:)[^>]*>', "", html)
html = re.sub(r'<script\b[^>]*src="\./(?:game-settings|game-fullscreen|telemetry)[.]js[^"]*"[^>]*></script>', "", html)
# Optional telemetry stub: no events go to the Morrow Wish production analytics.
html = html.replace('</head>', '<script>window.arcadeMetric = function(){};</script>\n</head>')
html = html.replace('<title>Cat Bond', '<title>Cat Bond')
# Standalone Y8 SDK integration; its official CDN must remain external by design.
html = html.replace('</head>', '<script src="https://cdn.y8.com/minimal-sdk/2-0/y8.min.js" async></script>\n'
                    '<script src="y8-sdk-bridge.js" defer></script>\n</head>')
index.write_text(html)

# Fast-entry game mode is an isolated Y8 adaptation only.
platform = GAME / "js" / "platform.js"
s = platform.read_text()
s = s.replace("const externalPortal = crazygames ||", "const externalPortal = true || crazygames ||")
platform.write_text(s)
# Freeze the isolated Y8 simulation when hidden or when focus is lost.
game_code_file = GAME / "js" / "game.js"
game_code = game_code_file.read_text()
needle = "this._lastTs = ts; this.t += dt;"
if needle not in game_code:
    raise SystemExit("Y8 pause patch target changed in live source")
game_code_file.write_text(game_code.replace(needle,
    "this._lastTs = ts; if(window.__Y8_SUSPENDED__) return; this.t += dt;"))
main = GAME / "js" / "main.js"
s = main.read_text().replace("if(window.CatBondPlatform?.crazygames){",
                             "if(window.CatBondPlatform?.externalPortal){")
main.write_text(s)

sdk_config = f"window.__Y8_APP_ID__={json.dumps(APP_ID)};window.__Y8_GAME_ID__={json.dumps(GAME_ID)};\n"
(GAME / "y8-sdk-config.js").write_text(sdk_config)
# This script is loaded before the bridge so the latter reads the values.
html = index.read_text().replace('<script src="y8-sdk-bridge.js" defer></script>',
                                 '<script src="y8-sdk-config.js"></script><script src="y8-sdk-bridge.js" defer></script>')
index.write_text(html)
(GAME / "y8-sdk-bridge.js").write_text(r"""/* Y8 platform-only SDK bootstrap. Never blocks guest play. */
(function(){
  'use strict';
  let initStarted=false;
  function init(){
    if(initStarted||!window.y8||typeof window.y8.sdk!=='function')return;
    const appId=window.__Y8_APP_ID__;
    if(!appId){console.warn('[Y8] App ID pending game record; this is a preview build');return;}
    initStarted=true;
    try{
      const sdk=window.y8.sdk();
      window.MorrowWishY8Sdk=sdk;
      const adId=window.__Y8_GAME_ID__;
      const app={appId,autoLogin:true};
      const ads=adId?{gameId:adId,preloadAdBreaks:'on',sound:'on',onReady:()=>{}}:undefined;
      sdk.init(app,ads);
      sdk.onAuth((user,error)=>{
        if(error)console.warn('[Y8] Sign-in unavailable; guest play continues',error);
      });
    }catch(error){console.warn('[Y8] SDK init failed; guest play continues',error);}
  }
  // Y8 requires pause and mute on hidden tabs and window blur.
  let resumeMusic=false;
  function suspend(paused){
    window.__Y8_SUSPENDED__=Boolean(paused);
    if(paused){
      resumeMusic=Boolean(window.MorrowwishMusic?.status?.().playing);
      window.MorrowwishMusic?.stop?.();
      window.MorrowwishAudio?.stop?.();
    }else if(resumeMusic){
      window.MorrowwishMusic?.start?.();
      resumeMusic=false;
    }
  }
  document.addEventListener('visibilitychange',()=>suspend(document.hidden));
  window.addEventListener('blur',()=>suspend(true));
  window.addEventListener('focus',()=>suspend(document.hidden));
  window.addEventListener('y8sdk.ready',init);
  if(window.y8&&window.y8.emitReadyEvent)window.y8.emitReadyEvent();
  init();
})();
""")

# Validate the approved 63-painting source is still present, without touching it.
script = (GAME / "index.html").read_text()
original = GAME / "assets" / "duo-storyboard-21x3-v3.webp"
if not original.exists() or original.stat().st_size < 100_000 or "duo-storyboard-21x3-v3.webp" not in script:
    raise SystemExit("Approved original 63-painting duo source is missing")
if 'href="/" id="cb-home"' in script or 'src="/telemetry.js"' in script:
    raise SystemExit("Website links/telemetry still present in export")
if not re.search(r'src="https://cdn.y8.com/minimal-sdk/2-0/y8.min.js"', script):
    raise SystemExit("Y8 SDK tag missing")
if any("url:'https://en.freepd.cn" in f.read_text() for f in GAME.rglob("*.js")):
    raise SystemExit("Unbundled external game music remains")
zip_path = OUT / "cat-bond-y8.zip"
with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED,
                     compresslevel=8) as z:
    for f in sorted(GAME.rglob("*")):
        if f.is_file():
            z.write(f, f.relative_to(GAME))
with zipfile.ZipFile(zip_path) as z:
    if "index.html" not in z.namelist() or z.testzip():
        raise SystemExit("Bad ZIP")
status = {
    "game": "Cat Bond", "studio": "Morrow Wish", "source": "public/cat-bond",
    "zip": str(zip_path.relative_to(ROOT)),
    "archiveBytes": zip_path.stat().st_size,
    "fileCount": len([f for f in GAME.rglob("*") if f.is_file()]),
    "sdkAppIdSet": bool(APP_ID), "sdkGameIdSet": bool(GAME_ID),
    "reviewReady": False if not APP_ID else "requires browser QA and media review",
    "original63PaintingPresent": True,
    "liveWebsiteModified": False,
}
(OUT / "build-report.json").write_text(json.dumps(status, indent=2) + "\n")
print(json.dumps(status, indent=2))
