#!/usr/bin/env bash
# Download a CC0 piano recording and make a small, first-party Ogg/Opus loop.
# Source: https://opengameart.org/content/happy-clappy-loop
# Artist: OwlishMedia. License: CC0 1.0.
set -euo pipefail
# Minimal GitHub hosted runners do not always include ffmpeg/ffprobe.
if ! command -v ffmpeg >/dev/null 2>&1 || ! command -v ffprobe >/dev/null 2>&1; then
  echo "Installing audio converter for CC0 music asset..."
  if command -v sudo >/dev/null 2>&1; then
    sudo apt-get update -qq
    sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq ffmpeg >/dev/null
  else
    echo "Audio converter missing. Install ffmpeg to prepare the soundtrack." >&2
    exit 1
  fi
fi
target="public/audio/cat-happy-clappy.ogg"
mkdir -p public/audio
if [ -s "$target" ] && ffprobe -v error -show_entries stream=codec_name -of default=noprint_wrappers=1 "$target" | grep -q 'opus'; then
  echo "Recorded cat music already present."
  exit 0
fi
src=$(mktemp --suffix=.wav)
trap 'rm -f "$src"' EXIT
for url in \
  'https://opengameart.org/sites/default/files/HappyClappyLoop.wav' \
  'https://opengameart.org/sites/default/files/HappyClappyLoop_0.wav'
do
  if curl -fLsS --connect-timeout 12 --max-time 60 --retry 2 --retry-delay 2 -A 'Mozilla/5.0 (compatible; MorrowWishAssetImporter/1.0)' "$url" -o "$src" && \
     ffprobe -v error -show_entries stream=codec_name -of default=noprint_wrappers=1 "$src" | grep -Eq 'pcm_|wavpack'; then
    ffmpeg -nostdin -y -v error -i "$src" -map 0:a:0 -vn -c:a libopus -b:a 72k -ar 48000 "$target"
    ffprobe -v error -show_entries stream=codec_name -of default=noprint_wrappers=1 "$target" | grep -q opus
    test "$(wc -c < "$target")" -gt 40000
    duration=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$target")
    awk -v seconds="$duration" 'BEGIN{exit(seconds>5?0:1)}'
    echo "Imported CC0 recorded piano loop from $url as $target"
    exit 0
  fi
done
echo "::error::Could not download the CC0 piano recording from OpenGameArt; not deploying a silent music control." >&2
exit 1
