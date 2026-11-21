#!/usr/bin/env bash
set -euo pipefail
## Soundtracks are drawn from EACH game's final reel; no single shared music bed.
for g in pawsibly-innocent cat-bond; do test -s "public/promo/$g/viral-gameplay-20261121.mp4"; done
for g in tiny-town elsewhere flip-dash parcel-panic pocket-aquarium; do test -s "public/promo/$g/highlight-20261121.mp4"; done
ffmpeg -nostdin -y -hide_banner -loglevel error \
-i public/promo/pawsibly-innocent/viral-gameplay-20261121.mp4 \
-i public/promo/cat-bond/viral-gameplay-20261121.mp4 \
-i public/promo/tiny-town/highlight-20261121.mp4 \
-i public/promo/elsewhere/highlight-20261121.mp4 \
-i public/promo/flip-dash/highlight-20261121.mp4 \
-i public/promo/parcel-panic/highlight-20261121.mp4 \
-i public/promo/pocket-aquarium/highlight-20261121.mp4 \
-filter_complex "[0:a]atrim=start=0:duration=2.2,asetpts=PTS-STARTPTS,aresample=48000,afade=t=in:st=0:d=0.1,afade=t=out:st=2.0:d=0.2[a0];[1:a]atrim=start=0:duration=2.2,asetpts=PTS-STARTPTS,aresample=48000,afade=t=in:st=0:d=0.1,afade=t=out:st=2.0:d=0.2[a1];[2:a]atrim=start=4:duration=2.2,asetpts=PTS-STARTPTS,aresample=48000,afade=t=in:st=0:d=0.1,afade=t=out:st=2.0:d=0.2[a2];[3:a]atrim=start=1:duration=2.2,asetpts=PTS-STARTPTS,aresample=48000,afade=t=in:st=0:d=0.1,afade=t=out:st=2.0:d=0.2[a3];[4:a]atrim=start=2:duration=2.2,asetpts=PTS-STARTPTS,aresample=48000,afade=t=in:st=0:d=0.1,afade=t=out:st=2.0:d=0.2[a4];[5:a]atrim=start=1:duration=2.2,asetpts=PTS-STARTPTS,aresample=48000,afade=t=in:st=0:d=0.1,afade=t=out:st=2.0:d=0.2[a5];[6:a]atrim=start=2:duration=2.2,asetpts=PTS-STARTPTS,aresample=48000,afade=t=in:st=0:d=0.1,afade=t=out:st=2.0:d=0.2[a6];[a0][a1][a2][a3][a4][a5][a6]concat=n=7:v=0:a=1[aout];[0:v]trim=start=0:duration=2.2,setpts=PTS-STARTPTS,fps=30,scale=1080:1920,setsar=1[v0];[1:v]trim=start=0:duration=2.2,setpts=PTS-STARTPTS,fps=30,scale=1080:1920,setsar=1[v1];[2:v]trim=start=4:duration=2.2,setpts=PTS-STARTPTS,fps=30,scale=1080:1920,setsar=1[v2];[3:v]trim=start=1:duration=2.2,setpts=PTS-STARTPTS,fps=30,scale=1080:1920,setsar=1[v3];[4:v]trim=start=2:duration=2.2,setpts=PTS-STARTPTS,fps=30,scale=1080:1920,setsar=1[v4];[5:v]trim=start=1:duration=2.2,setpts=PTS-STARTPTS,fps=30,scale=1080:1920,setsar=1[v5];[6:v]trim=start=2:duration=2.2,setpts=PTS-STARTPTS,fps=30,scale=1080:1920,setsar=1[v6];[v0][v1][v2][v3][v4][v5][v6]concat=n=7:v=1:a=0,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='7 FREE BROWSER GAMES':fontcolor=white:fontsize=52:x=(w-text_w)/2:y=130:box=1:boxcolor=black@0.55:boxborderw=16:enable='gte(t,13.2)',drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='PICK ONE - LINK IN BIO':fontcolor=white:fontsize=46:x=(w-text_w)/2:y=1725:box=1:boxcolor=black@0.52:boxborderw=12:enable='gte(t,13.2)',format=yuv420p[v]" \
-map '[v]' -map '[aout]' -t 15.4 -r 30 -c:v libx264 -preset veryfast -crf 21 -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart public/promo/morrow-wish-seven-games-20261121.mp4
ffmpeg -nostdin -y -hide_banner -loglevel error -ss 0.6 -i public/promo/morrow-wish-seven-games-20261121.mp4 -frames:v 1 -q:v 3 public/promo/morrow-wish-seven-games-20261121.jpg
test "$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0:s=x public/promo/morrow-wish-seven-games-20261121.mp4)" = "1080x1920"
test "$(ffprobe -v error -select_streams a:0 -show_entries stream=codec_type -of csv=p=0 public/promo/morrow-wish-seven-games-20261121.mp4)" = "audio"
echo 'Audio follows EACH of the seven game clips, with quick transitions. Human approval required before publishing.'
