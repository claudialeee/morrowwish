#!/usr/bin/env python3
"""Fetch licensed source recordings at build time only; no third-party runtime audio."""
import hashlib, json, pathlib, subprocess, tempfile, urllib.parse, re, html, math, sys
ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/"public/cat-bond/assets/quality-audio"
CAT=json.loads((ROOT/"docs/cat-bond-rpg/premium-soundtrack-catalog.json").read_text())
def run(args):
    p=subprocess.run(args,check=True,capture_output=True,text=True)
    return p.stdout,p.stderr
def probe(path):
    return json.loads(run(["ffprobe","-v","error","-show_format","-show_streams","-of","json",str(path)])[0])
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def loud(path):
    _,err=run(["ffmpeg","-hide_banner","-nostdin","-i",str(path),"-af","loudnorm=I=-19:TP=-2:LRA=11:print_format=json","-f","null","-"])
    return json.loads(re.findall(r'\{\s*"input_i"[\s\S]*?\}',err)[-1])
def verify(path,entry):
    info=probe(path); audio=next(s for s in info["streams"] if s["codec_type"]=="audio")
    dur=float(info["format"]["duration"])
    assert math.isfinite(dur) and 40<=dur<=480,(path,dur)
    assert audio["channels"]==2 and int(audio["sample_rate"])>=44100,(path,audio)
    stats=loud(path)
    level=float(stats["input_i"]); peak=float(stats["input_tp"])
    assert math.isfinite(level) and -21.5<=level<=-16.5 and peak<=-0.9,(path,stats)
    return dict(entry,file=path.name,seconds=dur,bytes=path.stat().st_size,sha256=sha(path),integratedLUFS=level,truePeakDBTP=peak,channels=audio["channels"],sampleRate=int(audio["sample_rate"]))
OUT.mkdir(parents=True,exist_ok=True)
results={}
with tempfile.TemporaryDirectory() as tmp:
    tmp=pathlib.Path(tmp)
    for key,t in CAT["tracks"].items():
        print("Preparing",key,flush=True)
        if "local" in t:
            source=OUT/t["local"]
            assert source.is_file()
        else:
            assert urllib.parse.urlsplit(t["download"]).hostname=="www.scottbuckley.com.au"
            source=tmp/(key+".mp3")
            run(["curl","--fail","--location","--retry","2","--connect-timeout","15","--max-time","180","--max-filesize","50000000","--output",str(source),t["download"]])
        info=probe(source); dur=float(info["format"]["duration"])
        assert math.isfinite(dur) and 40<=dur<=480,(key,dur)
        # Rotate the full recording through an equal-power 1.2-second tail/head
        # overlap; no mid-phrase cuts or procedural replacement music.
        loop=tmp/(key+"-loop.wav"); x=1.2
        af=(f"[0:a]aresample=44100,aformat=channel_layouts=stereo,asplit=3[a][b][c];"
            f"[a]atrim=start={x}:end={dur-x},asetpts=PTS-STARTPTS[mid];"
            f"[b]atrim=start={dur-x},asetpts=PTS-STARTPTS[tail];"
            f"[c]atrim=end={x},asetpts=PTS-STARTPTS[head];"
            f"[tail][head]acrossfade=d={x}:c1=qsin:c2=qsin[join];"
            "[mid][join]concat=n=2:v=0:a=1[out]")
        run(["ffmpeg","-y","-hide_banner","-nostdin","-i",str(source),"-filter_complex",af,"-map","[out]","-c:a","pcm_s24le",str(loop)])
        m=loud(loop)
        norm=("loudnorm=I=-19:TP=-2:LRA=11:measured_I="+m["input_i"]+
              ":measured_TP="+m["input_tp"]+":measured_LRA="+m["input_lra"]+
              ":measured_thresh="+m["input_thresh"]+":offset="+m["target_offset"]+":linear=true")
        path=OUT/("premium-"+key+".mp3")
        run(["ffmpeg","-y","-hide_banner","-nostdin","-i",str(loop),"-af",norm,"-ar","44100","-ac","2","-c:a","libmp3lame","-b:a","192k","-map_metadata","-1",str(path)])
        entry={k:v for k,v in t.items() if k not in ("download","local")}
        entry.update(sourceSha256=sha(source),edits="1.2s equal-power loop join, two-pass loudness normalization, 44.1 kHz stereo MP3")
        results[key]=verify(path,entry)
        print(key,results[key]["seconds"],results[key]["integratedLUFS"],results[key]["truePeakDBTP"],flush=True)
assert set(results)==set(CAT["tracks"])
assert sum(x["bytes"] for x in results.values())<=100*1024*1024,"Candidate music package exceeds 100 MiB"
manifest={"schema":1,"review":CAT["review"],"licenseUrl":CAT["licenseUrl"],"scenes":CAT["scenes"],"tracks":results}
(OUT/"premium-manifest.json").write_text(json.dumps(manifest,indent=2)+"\n")
print("All assets decoded and measured; subjective listening is still required.")
