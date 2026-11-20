#!/usr/bin/env bash
# Add licensed, audible music to short gameplay trailers. Does not change the games.
# FreePD: CC0 https://en.freepd.cn/music; OwlishMedia Happy Clappy: CC0
# https://opengameart.org/content/happy-clappy-loop
set -euo pipefail
command -v ffmpeg >/dev/null && command -v ffprobe >/dev/null || { echo "::error::ffmpeg / ffprobe required"; exit 1; }
test -s public/audio/cat-happy-clappy.ogg || { echo "::error::Missing previously verified CC0 cat soundtrack"; exit 1; }
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
base='https://en.freepd.cn/api/music'
declare -A soundtrack=(
  [elsewhere]='576f726c642f436f6e6e656374696e67205261696e626f77732e6d7033'
  [tiny-town]='5570626561742f48617070792057686973746c696e6720556b756c656c652e6d7033'
  [flip-dash]='5570626561742f496e76656e74696e6720466c696768742e6d7033'
  [parcel-panic]='5570626561742f46756e7368696e652e6d7033'
  [pocket-aquarium]='576f726c642f436f6e6e656374696e67205261696e626f77732e6d7033'
)
for game in elsewhere tiny-town pawsibly-innocent flip-dash parcel-panic pocket-aquarium; do
  video="public/promo/$game/real-gameplay-portrait.mp4"
  test -s "$video" || { echo "::error::Missing video $video"; exit 1; }
  music=public/audio/cat-happy-clappy.ogg
  if [[ "$game" != pawsibly-innocent ]]; then
    track="$tmp/$game.mp3"
    if curl --fail --location --silent --show-error --connect-timeout 8 --max-time 35 "$base/${soundtrack[$game]}" -o "$track" &&
       ffprobe -v error -select_streams a:0 -show_entries stream=codec_name -of csv=p=0 "$track" | grep -q .; then
      music="$track"
    else
      echo "::warning::FreePD unavailable for $game; using different verified CC0 audio as fallback"
    fi
  fi
  duration=$(ffprobe -v error -show_entries format=duration -of default=nokey=1:noprint_wrappers=1 "$video")
  fade_start=$(awk -v d="$duration" 'BEGIN { v=d-0.6; if(v<0) v=0; printf "%.3f",v }')
  has_audio=$(ffprobe -v error -select_streams a -show_entries stream=codec_type -of csv=p=0 "$video" | head -1)
  out="$tmp/$game.mp4"
  music_filter="[1:a]aresample=48000,volume=0.40,afade=t=in:st=0:d=0.18,afade=t=out:st=$fade_start:d=0.6[music]"
  if [[ "$has_audio" == "audio" ]]; then
    filter="$music_filter;[0:a:0]aresample=48000,volume=0.90[game];[game][music]amix=inputs=2:duration=longest:dropout_transition=0[aout]"
  else
    filter="$music_filter;[music]anull[aout]"
  fi
  ffmpeg -nostdin -y -hide_banner -loglevel error -i "$video" -stream_loop -1 -i "$music" \
    -filter_complex "$filter" -map 0:v:0 -map '[aout]' \
    -c:v copy -c:a aac -b:a 128k -ar 48000 -ac 2 -t "$duration" \
    -movflags +faststart "$out"
  test "$(ffprobe -v error -select_streams a:0 -show_entries stream=codec_type -of csv=p=0 "$out")" = audio
  mv "$out" "$video"
  echo "Audio embedded in $video (CC0)."
done
