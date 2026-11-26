#!/usr/bin/env python3
"""Import candidate recordings from the composer's public OGA releases, not runtime streaming.
Fail closed if license, archive, audio, or coverage is not verified. No deployment."""
import concurrent.futures, hashlib, html, io, json, math, pathlib, re, subprocess, tempfile, urllib.parse, zipfile
from html.parser import HTMLParser
ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/"public/cat-bond/assets/quality-audio"
CAT=json.loads((ROOT/"docs/cat-bond-rpg/jrpg-soundtrack-catalog.json").read_text())
def run(args):
    p=subprocess.run(args,check=True,capture_output=True,text=True)
    return p.stdout,p.stderr
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def probe(path):
    return json.loads(run(["ffprobe","-v","error","-show_format","-show_streams","-of","json",str(path)])[0])
def loud(path):
    _,err=run(["ffmpeg","-hide_banner","-nostdin","-i",str(path),"-af","loudnorm=I=-19:TP=-2:LRA=11:print_format=json","-f","null","-"])
    return json.loads(re.findall(r'\{\s*"input_i"[\s\S]*?\}',err)[-1])
def download(url,path):
    assert urllib.parse.urlsplit(url).scheme=="https" and urllib.parse.urlsplit(url).hostname in ("opengameart.org","www.opengameart.org"),url
    run(["curl","--fail","--location","--retry","2","--connect-timeout","15","--max-time","120","--max-filesize","40000000","--user-agent","CatBond-licensed-asset-import/1.0","--output",str(path),url])
class Links(HTMLParser):
    def __init__(self):super().__init__();self.links=[]
    def handle_starttag(self,tag,attrs):
        if tag=="a":self.links.append(dict(attrs).get("href",""))
def keytitle(s):return re.sub(r"[^a-z0-9]","",s.lower())
def prepare(item,tmp):
    key,t=item
    page=tmp/(key+".html");download(t["source"],page);markup=page.read_text(errors="replace")
    assert "creativecommons.org/licenses/by/3.0" in markup and "Jonathan Shaw" in markup and keytitle(t["title"]) in keytitle(markup),("license/author/title mismatch",key)
    parser=Links();parser.feed(markup)
    urls=sorted(set(urllib.parse.urljoin(t["source"],v) for v in parser.links if urllib.parse.unquote(urllib.parse.urlsplit(v).path).lower().endswith(".zip")))
    urls=[u for u in urls if urllib.parse.urlsplit(u).hostname in ("opengameart.org","www.opengameart.org") and "mp3" in u.lower() and keytitle(t["title"]) in keytitle(urllib.parse.unquote(u).split("/")[-1])]
    assert len(urls)==1,("ambiguous or missing MP3 archive",key,urls)
    archive=tmp/(key+".zip");download(urls[0],archive)
    with zipfile.ZipFile(archive) as z:
        files=[m for m in z.infolist() if not m.is_dir() and m.filename.lower().endswith(".mp3") and not m.filename.startswith("__MACOSX/")]
        assert len(files)==1 and files[0].file_size<40000000,("unexpected archive contents",key,[m.filename for m in files])
        src=tmp/(key+"-src.mp3");src.write_bytes(z.read(files[0]))
    # Trim only sustained quiet tails / heads, retain musical sections. Crossfade is an audition candidate,
    # not a guarantee of a musically seamless loop; author loop metadata should be checked by ear.
    trim=tmp/(key+"-trim.wav")
    run(["ffmpeg","-y","-hide_banner","-nostdin","-i",str(src),"-af","silenceremove=start_periods=1:start_duration=0.1:start_threshold=-55dB,areverse,silenceremove=start_periods=1:start_duration=0.35:start_threshold=-55dB,areverse","-ar","44100","-ac","2","-c:a","pcm_s24le",str(trim)])
    dur=float(probe(trim)["format"]["duration"]);assert 42<=dur<=480,(key,dur)
    x=.8;loop=tmp/(key+"-loop.wav")
    af=(f"[0:a]asplit=3[a][b][c];[a]atrim=start={x}:end={dur-x},asetpts=PTS-STARTPTS[mid];"
        f"[b]atrim=start={dur-x},asetpts=PTS-STARTPTS[tail];[c]atrim=end={x},asetpts=PTS-STARTPTS[head];"
        f"[tail][head]acrossfade=d={x}:c1=qsin:c2=qsin[join];[mid][join]concat=n=2:v=0:a=1[out]")
    run(["ffmpeg","-y","-hide_banner","-nostdin","-i",str(trim),"-filter_complex",af,"-map","[out]","-c:a","pcm_s24le",str(loop)])
    m=loud(loop);norm="loudnorm=I=-19:TP=-2:LRA=11:measured_I="+m["input_i"]+":measured_TP="+m["input_tp"]+":measured_LRA="+m["input_lra"]+":measured_thresh="+m["input_thresh"]+":offset="+m["target_offset"]+":linear=true"
    output=tmp/("premium-jrpg-"+key+".mp3")
    run(["ffmpeg","-y","-hide_banner","-nostdin","-i",str(loop),"-af",norm,"-ar","44100","-ac","2","-c:a","libmp3lame","-b:a","160k","-map_metadata","-1",str(output)])
    info=probe(output);a=next(s for s in info["streams"] if s["codec_type"]=="audio");stats=loud(output);level=float(stats["input_i"]);peak=float(stats["input_tp"]);seconds=float(info["format"]["duration"])
    assert 40<=seconds<=480 and a["channels"]==2 and int(a["sample_rate"])==44100 and -21.5<=level<=-16.5 and peak<=-.9,(key,seconds,level,peak)
    entry=dict(t,file=output.name,seconds=seconds,bytes=output.stat().st_size,sha256=sha(output),sourceSha256=sha(src),archiveSha256=sha(archive),download=urls[0],edits="Quiet-tail trim, 0.8s loop crossfade, two-pass loudness normalization, stereo MP3",integratedLUFS=level,truePeakDBTP=peak,channels=2,sampleRate=44100)
    print(key,seconds,level,peak,flush=True)
    return key,entry,output
def credits(manifest):
    esc=lambda s:html.escape(str(s),quote=True)
    cards=[]
    for key,t in manifest["tracks"].items():
        cards.append(f'<article><h2>{esc(t["title"])}</h2><p>{esc(t["author"])} · <a href="{esc(t["source"])}">Original / license</a> · {esc(t["license"])}</p><p>{esc(" · ".join(t["scenes"]))} — {esc(t["notes"])}</p><audio controls preload="none" loop src="{esc(t["file"])}"></audio></article>')
    return '<!doctype html><html lang="zh"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Cat Bond · JRPG score review</title><style>body{max-width:760px;margin:28px auto;padding:0 18px;font:16px/1.6 system-ui;background:#faf5e9;color:#394139}article{border-bottom:1px solid #d8d0bd;padding:16px 0}h2{font-size:18px;margin:0}audio{width:100%}</style><h1>Cat Bond · 新版 JRPG 配乐试听</h1><p>候选版，尚未主观试听验收。音乐由 Jonathan Shaw 创作，<a href="https://creativecommons.org/licenses/by/3.0/">CC BY 3.0</a>。修改：静音裁剪、循环交叉淡化、响度标准化、格式转换。</p>'+''.join(cards)+'<script>document.addEventListener("play",e=>{if(e.target.tagName==="AUDIO")for(const a of document.querySelectorAll("audio"))if(a!==e.target)a.pause()},true)</script></html>'
assert len(CAT["scenes"])==25 and set(CAT["scenes"].values())==set(CAT["tracks"])
with tempfile.TemporaryDirectory() as temp:
    tmp=pathlib.Path(temp)
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        results=list(pool.map(lambda x:prepare(x,tmp),CAT["tracks"].items()))
    assert sum(e["bytes"] for _,e,_ in results)<=100*1024*1024
    manifest=dict(CAT,tracks={k:e for k,e,_ in results})
    OUT.mkdir(parents=True,exist_ok=True)
    for _,e,path in results:(OUT/e["file"]).write_bytes(path.read_bytes())
    (OUT/"premium-manifest.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n")
    (OUT/"music-credits.html").write_text(credits(manifest))
    print("All 25 cues covered; recorded audio decoded, measured and attributed. Listening approval pending.")
