#!/usr/bin/env bash
# Keep the already-licensed CC0 cat game music available during Pages releases.
# Source: https://opengameart.org/content/happy-clappy-loop
# Artist: OwlishMedia. License: CC0 1.0.
# Prefer our verified previously published Ogg/Opus copy. Do not block each
# deployment for minutes waiting for the third-party WAV host to respond.
set -euo pipefail
target="public/audio/cat-happy-clappy.ogg"
mkdir -p public/audio
valid_audio() {
  [ -s "$1" ] || return 1
  # Verify the Ogg/Opus structure and duration using Python's standard library.
  # This works on clean GitHub runners without apt-get, ffprobe or ffmpeg.
  python3 - "$1" <<'PY'
from pathlib import Path
import sys
try:
    data = Path(sys.argv[1]).read_bytes()
    last = data.rfind(b'OggS')
    assert len(data) > 40000
    assert data.startswith(b'OggS') and b'OpusHead' in data[:256]
    assert last > 100 and len(data) >= last + 14
    assert int.from_bytes(data[last+6:last+14], "little") > 5*48000
except Exception:
    sys.exit(1)
PY
}
if valid_audio "$target"; then
  echo "Verified recorded CC0 cat soundtrack already present."
  exit 0
fi
temp=$(mktemp --suffix=.ogg)
src=$(mktemp --suffix=.wav)
trap 'rm -f "$temp" "$src"' EXIT

# Existing production contains the verified 181 KB Opus recording. Reuse it
# as an immutable release input before contacting the flaky original host.
for url in \
  'https://morrowwish.vercel.app/audio/cat-happy-clappy.ogg' \
  'https://morrowwish.pages.dev/audio/cat-happy-clappy.ogg'
do
  echo "Checking verified production CC0 music mirror..."
  if curl -fLsS --connect-timeout 5 --max-time 18 --retry 0 "$url" -o "$temp" && valid_audio "$temp"; then
    mv "$temp" "$target"
    echo "Reused verified CC0 Opus recording from $url (no conversion needed)."
    exit 0
  fi
done

# First-time deployments only: convert the public-domain original.
if ! command -v ffmpeg >/dev/null 2>&1 || ! command -v ffprobe >/dev/null 2>&1; then
  echo "Installing audio converter for one-time CC0 asset preparation..."
  if command -v sudo >/dev/null 2>&1; then
    sudo apt-get -o Acquire::Retries=1 update -qq
    sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq ffmpeg >/dev/null
  else
    echo "::error::Audio converter missing; cannot prepare licensed track." >&2
    exit 1
  fi
fi
for url in \
  'https://opengameart.org/sites/default/files/HappyClappyLoop.wav' \
  'https://opengameart.org/sites/default/files/HappyClappyLoop_0.wav'
do
  if curl -fLsS --connect-timeout 5 --max-time 18 --retry 0 \
    -A 'Mozilla/5.0 (compatible; MorrowWishAssetImporter/1.0)' "$url" -o "$src" && \
    ffprobe -v error -show_entries stream=codec_name -of default=noprint_wrappers=1 "$src" | grep -Eq 'pcm_|wavpack'; then
    ffmpeg -nostdin -y -v error -i "$src" -map 0:a:0 -vn -c:a libopus -b:a 72k -ar 48000 "$target"
    valid_audio "$target"
    echo "Imported CC0 piano loop from $url as $target."
    exit 0
  fi
done
echo "::error::Verified CC0 cat music could not be fetched from any source." >&2
exit 1
