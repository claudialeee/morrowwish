"""Grade the existing authored RPG plates, not the UI or approved 63-frame duo atlas."""
from pathlib import Path
from PIL import Image, ImageEnhance, ImageStat, ImageOps, ImageDraw
import hashlib, json, math
root=Path("public/cat-bond/assets")
report=root/"daylight-grade-v1.json"
out=Path("artifacts/cat-bond-daylight")
out.mkdir(parents=True,exist_ok=True)
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
if report.exists():
    manifest=json.loads(report.read_text())
    for e in manifest["assets"]:
        assert sha(root/e["path"])==e["afterSha256"], e["path"]
    print("Existing daylight grade verified:",len(manifest["assets"]))
    raise SystemExit(0)
paths=sorted(set(list((root/"resonance-world-v2").glob("*.webp"))+
    list((root/"cinematics").rglob("*.webp"))+
    list((root/"combat").glob("*.webp"))+
    list((root/"garden").glob("*.webp"))+
    list((root/"npc").glob("*-painted.webp"))))
assert len(paths)>=35
def grade(im,rel):
    # Individual palettes: cool sky/water stay cool, forge stays amber,
    # memory/night scenes retain their shadows and dramatic separation.
    name=str(rel)
    dramatic=any(t in name for t in ("broken-bell","keepers-choice","inward-call","pendant-signal","harbor-at-twilight","star-bell-arena","forge-guardian"))
    actor=any(t in name for t in ("npc/","characters/"))
    strength=.60 if dramatic else .72 if actor else 1.
    rgb=im.convert("RGB")
    # Nonlinear shadow/midtone lift, with endpoints anchored to protect highlights.
    gamma=1-.27*strength
    lut=[round(255*(v/255)**gamma) for v in range(256)]
    graded=rgb.point(lut*3)
    graded=ImageEnhance.Color(graded).enhance(1+.20*strength)
    # Subtle warm reflected daylight, restricted to midtones; no flat veil.
    warmth=(3,2,-1) if any(t in name for t in ("garden","forge","forest","library")) else (1,2,3) if any(t in name for t in ("sky","harbor","starfall")) else (2,2,0)
    channels=graded.split()
    graded=Image.merge("RGB",tuple(ch.point([max(0,min(255,round(v+d*strength*4*(v/255)*(1-v/255)))) for v in range(256)]) for ch,d in zip(channels,warmth)))
    if "A" in im.getbands(): graded.putalpha(im.getchannel("A"))
    return graded
entries=[]
for idx,p in enumerate(paths):
    rel=p.relative_to(root)
    old=Image.open(p).copy()
    new=grade(old,rel)
    assert new.size==old.size
    if "A" in old.getbands(): assert old.getchannel("A").tobytes()==new.getchannel("A").tobytes()
    mask=old.getchannel("A") if "A" in old.getbands() else None
    a=ImageStat.Stat(old.convert("L"),mask).mean[0]
    b=ImageStat.Stat(new.convert("L"),mask).mean[0]
    assert b>a+2, (str(rel),a,b)
    oldhash=sha(p)
    new.save(p,"WEBP",quality=92,method=6,exact=True)
    decoded=Image.open(p)
    assert decoded.size==old.size
    if mask is not None: assert decoded.getchannel("A").tobytes()==mask.tobytes()
    entries.append({"path":str(rel),"beforeSha256":oldhash,"afterSha256":sha(p),"beforeLuma":round(a,2),"afterLuma":round(b,2),"size":list(old.size)})
    sheet=Image.new("RGB",(640,210),(246,243,236))
    for col,im in enumerate((old,decoded)):
        thumb=im.convert("RGBA");thumb.thumbnail((310,170))
        sheet.paste(thumb,(col*320+(320-thumb.width)//2,10),thumb)
    d=ImageDraw.Draw(sheet);d.text((8,184),"BEFORE  "+str(rel)[-40:],fill=(30,30,30));d.text((328,184),"AFTER  "+str(rel)[-40:],fill=(30,30,30))
    sheet.save(out/f"{idx:02d}.jpg",quality=91)
report.write_text(json.dumps({"edition":"daylight-grade-v1","assets":entries},indent=2)+"\n")
print("Graded actual painted files:",len(entries))
