#!/usr/bin/env bash
set -euo pipefail
tested=347e13fde5cc94979568292aa5888e42ca12bc92
candidate=${1:-HEAD}
git fetch --no-tags --depth=1 origin "$tested" >/dev/null
git diff --quiet "$tested" "$candidate" -- . ':!public/telemetry.js' ':!scripts/test-starbell-telemetry.mjs' ':!scripts/starbell-release-gate.sh' ':!scripts/starbell-garden-release-scope.sh' ':!.github/workflows/cat-bond-preview.yml' ':!.github/workflows/starbell-portrait-art-preview.yml' ':!.github/workflows/starbell-locale-purity.yml' ':!.github/workflows/cat-bond-canon22-browser.yml' ':!.github/workflows/starbell-canon22-playtest.yml'
