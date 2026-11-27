#!/usr/bin/env bash
set -euo pipefail
base=35ef1c1979513bd7d98b07bb804d842dc47bfcfd
source_sha=${SOURCE_SHA:-$GITHUB_SHA}
git fetch --no-tags --depth=1 origin "$base"
test "$(git rev-parse HEAD)" = "$source_sha"
git diff --quiet "$base" "$source_sha" -- . ':!scripts/cat-bond-release-prologue-qa.mjs' ':!scripts/starbell-garden-qa.mjs' ':!.github/workflows/starbell-locale-purity.yml' ':!.github/workflows/cat-bond-preview.yml' ':!.github/workflows/starbell-portrait-art-preview.yml' ':!scripts/starbell-release-gate.sh' || { echo "Runtime or accepted test inputs changed; refuse to reuse gates"; exit 1; }
for id in 46055927178 46055930919 46055930995 46055927140 46055927212; do
  gh api "repos/$GITHUB_REPOSITORY/actions/runs/$id" | jq -e --arg base "$base" '.head_sha==$base and .status=="completed" and .conclusion=="success"' >/dev/null
done
for id in 140698358209 140698358253 140698358365; do
  gh api "repos/$GITHUB_REPOSITORY/actions/jobs/$id" | jq -e '.run_id==46055927144 and .status=="completed" and .conclusion=="success"' >/dev/null
done
duo=6c7e690a6276d3b51431143523ec4652aaaea0d5
git fetch --no-tags --depth=1 origin "$duo"
git diff --quiet "$duo" "$source_sha" -- public/cat-bond/js/duo-premium.js public/cat-bond/js/battle.js public/cat-bond/assets/mobile-portrait/duo scripts/test-starbell-native-duo-renderer.mjs scripts/check-starbell-portrait-duo.mjs .github/workflows/starbell-duo-portrait-samples.yml package.json package-lock.json
gh api "repos/$GITHUB_REPOSITORY/actions/runs/45950550328" | jq -e --arg sha "$duo" '.head_sha==$sha and .status=="completed" and .conclusion=="success"' >/dev/null
for attempt in $(seq 1 120); do
  run=$(gh api "repos/$GITHUB_REPOSITORY/actions/workflows/starbell-locale-purity.yml/runs?head_sha=$source_sha&branch=review%2Fstarbell-canon13-player-experience" | jq -c '.workflow_runs[0] // {}')
  if [[ $(jq -r .head_sha <<<"$run") == "$source_sha" && $(jq -r .status <<<"$run") == completed ]]; then
    test "$(jq -r .conclusion <<<"$run")" = success
    id=$(jq -r .id <<<"$run")
    gh api "repos/$GITHUB_REPOSITORY/actions/runs/$id/jobs?per_page=100" | jq -e '([.jobs[]|select((.name=="browser (opening-en)" or .name=="browser (opening-zh)") and .conclusion=="success")]|length)==2' >/dev/null
    echo "All prior exact-runtime gates and both corrected opening locales passed"
    { echo "DUO_GATE=45950550328"; echo "CAMPAIGN_GATE=46055930919"; echo "SOURCE_GATE=46055930995"; echo "OPENING_GATE=$id"; echo "ACCEPTED_RUNTIME=$base"; } >> "$GITHUB_ENV"
    exit 0
  fi
  sleep 5
done
echo "Opening acceptance incomplete; refusing deployment" >&2
exit 1
