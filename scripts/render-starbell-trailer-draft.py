#!/usr/bin/env python3
"""Internal 30-second animatic; not the release edit. Requires ffmpeg/ffprobe.
Usage: python3 scripts/render-starbell-trailer-draft.py [capture-dir]
Optional cut-overrides.json: {"garden": 12.4, "meet": 21.0} (source seconds).
Only uses successfully captured real clips. Missing or too-short clips fail closed.
"""
import json, pathlib, subprocess, sys, tempfile
ROOT = pathlib.Path(sys.argv[1] if len(sys.argv)>1 else "artifacts/starbell-trailer").resolve()
PLAN = json.loads(pathlib.Path("docs/cat-bond-rpg/STAR-BELL-TRAILER-TIMELINE.json").read_text())
report = json.loads((ROOT/"capture-index.json").read_text())
clips = {x["id"]: x for x in report["clips"]}
overrides = json.loads((ROOT/"cut-overrides.json").read_text()) if (ROOT/"cut-overrides.json").exists() else {}
assert abs(sum(s["seconds"] for s in PLAN["shots"])-30)<1e-6
def call(*args): subprocess.run(args,check=True)
def duration(src): return float(subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration","-of","default=nw=1:nk=1",str(src)],text=True))
font="/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf"
with tempfile.TemporaryDirectory() as tmp:
    tmp=pathlib.Path(tmp)
    parts=[]
    for n,s in enumerate(PLAN["shots"]):
        clip=clips[s["id"]]
        if clip["status"]!="captured-not-editorially-approved": raise RuntimeError("Capture failed: "+s["id"])
        src=ROOT/clip["file"]
        start=float(overrides.get(s["id"],clip["marks"][0]["approxSeconds"]))
        if duration(src)+0.04<start+s["seconds"]: raise RuntimeError("Review trim: "+s["id"])
        vf="scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30"
        if s["text"]:
            t=tmp/f"text{n}.txt";t.write_text(s["text"])
            vf+=f",drawtext=fontfile={font}:textfile={t}:fontsize=64:fontcolor=white:shadowcolor=black@0.8:shadowx=2:shadowy=3:x=(w-tw)/2:y=h*0.77"
        dst=tmp/f"{n:02}.mp4"
        call("ffmpeg","-hide_banner","-loglevel","error","-y","-ss",str(start),"-i",str(src),"-t",str(s["seconds"]),"-an","-vf",vf,"-c:v","libx264","-preset","fast","-crf","18","-pix_fmt","yuv420p",str(dst))
        parts.append(dst)
    concat=tmp/"concat.txt";concat.write_text("\n".join("file '"+str(p)+"'" for p in parts)+"\n")
    call("ffmpeg","-hide_banner","-loglevel","error","-y","-f","concat","-safe","0","-i",str(concat),"-i",PLAN["previewMusic"],"-map","0:v:0","-map","1:a:0","-c:v","copy","-af","afade=t=in:st=0:d=0.25,afade=t=out:st=28.8:d=1.2","-c:a","aac","-b:a","192k","-t","30","-movflags","+faststart",str(ROOT/"internal-animatic.mp4"))
print("Internal rough cut only; check actual timing, movement, music and subtitle placement.")
