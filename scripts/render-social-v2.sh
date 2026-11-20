#!/usr/bin/env bash
# Mobile-first re-edit of genuine gameplay; do not fabricate game footage.
# Run after add-promo-audio.sh so source clips already contain licensed sound.
set -euo pipefail
FONT=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf
command -v ffmpeg >/dev/null && command -v ffprobe >/dev/null
test -f "$FONT"
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
for slug in pawsibly-innocent elsewhere tiny-town flip-dash parcel-panic pocket-aquarium; do
  src="public/promo/$slug/real-gameplay-portrait.mp4"
  dest="public/promo/$slug/social-v2.mp4"
  cover="public/promo/$slug/social-v2-cover.jpg"
  test -s "$src" || { echo "::error::Missing real gameplay: $src"; exit 1; }
  case "$slug" in
    pawsibly-innocent)
      accent=F8B976
      hook="A CAT. THREE FISH."
      sub="AND ONE VERY ANGRY HUMAN."
      beat1="THE PERFECT LITTLE HEIST?"
      beat2="DISTRACT. SNEAK. ESCAPE."
      beat3="CAN YOU STEAL ALL THREE?"
      cta="PLAY THE CAT HEIST"
      ;;
    elsewhere)
      accent=C9B5FB
      hook="ONE LIFE ISN'T ENOUGH."
      sub="WHAT IF YOU STARTED AGAIN?"
      beat1="A DIFFERENT PLACE."
      beat2="A DIFFERENT VERSION OF YOU."
      beat3="WHAT WOULD YOU CHOOSE?"
      cta="LIVE ANOTHER LIFE"
      ;;
    tiny-town)
      accent=A5E0C0
      hook="NO ONE HAS TO WORK."
      sub="SO WHAT HAPPENS NEXT?"
      beat1="AI DOES ALL THE WORK."
      beat2="PEOPLE GET THEIR TIME BACK."
      beat3="WHAT WOULD YOU BUILD?"
      cta="BUILD YOUR FREE TOWN"
      ;;
    flip-dash)
      accent=E8B6FF
      hook="ONE TAP. FLIP GRAVITY."
      sub="EASIER SAID THAN DONE."
      beat1="TOO LATE. ANOTHER SPIKE."
      beat2="ONE MORE TRY."
      beat3="HOW FAR CAN YOU GET?"
      cta="BEAT THE HIGH SCORE"
      ;;
    parcel-panic)
      accent=FFCA9D
      hook="THREE LANES. NO TIME."
      sub="THIS GETS FAST."
      beat1="MATCH THE PARCEL."
      beat2="KEEP THE STREAK ALIVE."
      beat3="HOW LONG CAN YOU LAST?"
      cta="TRY THE SORTING RUSH"
      ;;
    pocket-aquarium)
      accent=92DCEA
      hook="60 SECONDS. HUNGRY FISH."
      sub="EVERY SECOND COUNTS."
      beat1="FEED THE RIGHT FISH."
      beat2="KEEP THE WATER CLEAR."
      beat3="CAN YOU SAVE THEM ALL?"
      cta="TAKE THE AQUARIUM TEST"
      ;;
  esac
  printf '%s' "$hook" > "$work/hook.txt"
  printf '%s' "$sub" > "$work/sub.txt"
  printf '%s' "$beat1" > "$work/beat1.txt"
  printf '%s' "$beat2" > "$work/beat2.txt"
  printf '%s' "$beat3" > "$work/beat3.txt"
  printf '%s' "$cta" > "$work/cta.txt"
  printf '%s' "morrowwish.vercel.app  /  PLAY FREE" > "$work/brand.txt"
  vf="[0:v]fps=30,scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=20:2,eq=brightness=-0.22:saturation=0.65[bg];"
  vf="$vf[0:v]fps=30,scale=980:1310:force_original_aspect_ratio=decrease,pad=980:1310:(ow-iw)/2:(oh-ih)/2:color=0x101922,setsar=1[game];"
  vf="$vf[bg][game]overlay=50:305:shortest=1,"
  vf="$vf""drawbox=x=41:y=296:w=998:h=1328:color=0x$accent@0.82:t=6,"
  vf="$vf""drawbox=x=0:y=0:w=1080:h=299:color=0x10131C@0.79:t=fill,"
  vf="$vf""drawbox=x=0:y=1630:w=1080:h=290:color=0x10131C@0.81:t=fill,"
  vf="$vf""drawtext=fontfile=$FONT:textfile=$work/hook.txt:fontsize=62:fontcolor=white:x=(w-text_w)/2:y=83:shadowcolor=black@0.65:shadowx=2:shadowy=3,"
  vf="$vf""drawtext=fontfile=$FONT:textfile=$work/sub.txt:fontsize=36:fontcolor=0x$accent:x=(w-text_w)/2:y=176,"
  vf="$vf""drawtext=fontfile=$FONT:textfile=$work/beat1.txt:fontsize=48:fontcolor=white:x=(w-text_w)/2:y=1694:enable='between(t,0,4.99)',"
  vf="$vf""drawtext=fontfile=$FONT:textfile=$work/beat2.txt:fontsize=48:fontcolor=white:x=(w-text_w)/2:y=1694:enable='between(t,5,9.99)',"
  vf="$vf""drawtext=fontfile=$FONT:textfile=$work/beat3.txt:fontsize=48:fontcolor=white:x=(w-text_w)/2:y=1694:enable='between(t,10,12.99)',"
  vf="$vf""drawbox=x=100:y=1680:w=880:h=106:color=0x$accent@0.96:t=fill:enable='gte(t,13)',"
  vf="$vf""drawtext=fontfile=$FONT:textfile=$work/cta.txt:fontsize=48:fontcolor=0x10131C:x=(w-text_w)/2:y=1704:enable='gte(t,13)',"
  vf="$vf""drawtext=fontfile=$FONT:textfile=$work/brand.txt:fontsize=28:fontcolor=white@0.80:x=(w-text_w)/2:y=1840,"
  vf="$vf""format=yuv420p[v]"
  ffmpeg -nostdin -y -hide_banner -loglevel error -stream_loop -1 -i "$src" -filter_complex "$vf" \
    -map '[v]' -map '0:a:0' -t 16 -r 30 -c:v libx264 -preset veryfast -crf 22 -pix_fmt yuv420p \
    -c:a aac -b:a 160k -af 'afade=t=out:st=15.35:d=0.65' -movflags +faststart "$dest"
  ffmpeg -nostdin -y -hide_banner -loglevel error -ss 1 -i "$dest" -frames:v 1 -q:v 3 "$cover"
  dims=$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0:s=x "$dest")
  audio=$(ffprobe -v error -select_streams a:0 -show_entries stream=codec_type -of csv=p=0 "$dest")
  test "$dims" = '1080x1920' && test "$audio" = 'audio' && test -s "$cover"
  bytes=$(wc -c < "$dest")
  test "$bytes" -lt 25000000 || { echo "::error::Clip over Cloudflare upload limit: $dest"; exit 1; }
  echo "Rendered $dest (1080x1920, audio, $bytes bytes)."
done
