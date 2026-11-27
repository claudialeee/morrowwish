#!/usr/bin/env bash
set -euo pipefail
base=35ef1c1979513bd7d98b07bb804d842dc47bfcfd
source_sha=${SOURCE_SHA:-$GITHUB_SHA}
# The integrated candidate must have its own exact-commit combined browser gate.
# Reuse only unchanged approved music, never earlier gameplay acceptance.
if [[ -f .github/workflows/starbell-integrated-guardians.yml ]]; then
  git fetch --no-tags --depth=1 origin c457f85d219a4282e2a1bd7216fdcb31e31dac93
  test "$(git rev-parse HEAD)" = "$source_sha"
  git diff --quiet c457f85d219a4282e2a1bd7216fdcb31e31dac93 "$source_sha" -- public/cat-bond/assets/audio public/cat-bond/assets/quality-audio public/cat-bond/js/rpg-audio.js public/cat-bond/js/rpg-audio-score.js scripts/import-starbell-region-music.mjs scripts/import-cat-bond-windchime-music.mjs
  gh api "repos/$GITHUB_REPOSITORY/actions/runs/46065269370" | jq -e '.head_sha=="c457f85d219a4282e2a1bd7216fdcb31e31dac93" and .status=="completed" and .conclusion=="success"' >/dev/null
  gh api "repos/$GITHUB_REPOSITORY/actions/runs/46065269370/artifacts" | jq -e 'any(.artifacts[]; .name=="starbell-approved-audio" and .expired==false)' >/dev/null
  # Reuse browser evidence only when ALL game/assets/dependencies and the tested
  # browser scripts are byte-identical; allow only explicitly listed QA/pipeline files.
  accepted=9307ef94578ebfd50a74b359242a9826ab40f4e0
  gate_sha="$source_sha"
  git fetch --no-tags --depth=1 origin "$accepted"
  if git diff --quiet "$accepted" "$source_sha" -- . ':!scripts/test-cat-bond-canon22-mirror.mjs' ':!scripts/test-cat-bond-player-first.mjs' ':!scripts/starbell-release-gate.sh' ':!.github/workflows/cat-bond-preview.yml' ':!.github/workflows/cat-bond-canon22-checkpoint.yml' ':!scripts/cat-bond-experience-chapters.mjs' ':!scripts/cat-bond-experience-qa-scope.mjs'; then
    gate_sha="$accepted"
    node scripts/test-cat-bond-canon22-mirror.mjs
    node scripts/test-cat-bond-player-first.mjs
  fi
  for attempt in $(seq 1 120); do
    run=$(gh api "repos/$GITHUB_REPOSITORY/actions/workflows/starbell-integrated-guardians.yml/runs?head_sha=$gate_sha&branch=review%2Fstarbell-integrated-guardians-20261127" | jq -c '.workflow_runs[0] // {}')
    if [[ $(jq -r .head_sha <<<"$run") == "$gate_sha" && $(jq -r .status <<<"$run") == completed ]]; then
      test "$(jq -r .conclusion <<<"$run")" = success
      id=$(jq -r .id <<<"$run")
      gh api "repos/$GITHUB_REPOSITORY/actions/runs/$id/jobs?per_page=100" | jq -e '([.jobs[]|select((.name=="integrated (wide)" or .name=="integrated (portrait)") and .conclusion=="success")]|length)==2' >/dev/null
      { echo "INTEGRATED_GATE=$id"; echo "FOCUSED_GATE=46065269370"; echo "AUDIO_SOURCE_SHA=c457f85d219a4282e2a1bd7216fdcb31e31dac93"; } >> "$GITHUB_ENV"
      echo "Exact integrated guardian, minigame, garden and telemetry acceptance passed"
      exit 0
    fi
    sleep 5
  done
  echo "Integrated acceptance incomplete; refusing preview deploy" >&2
  exit 1
fi
# Exact garden camera runtime accepted on both devices. Reuse unchanged audio bytes
# and previous deployed gameplay gates only when all non-infrastructure inputs match.
if bash scripts/starbell-garden-release-scope.sh "$source_sha"; then
  test "$(git rev-parse HEAD)" = "$source_sha"
  if ! git diff --quiet 347e13fde5cc94979568292aa5888e42ca12bc92 "$source_sha" -- public/telemetry.js; then
    node --check public/telemetry.js
    node scripts/test-starbell-telemetry.mjs
  fi
  gh api "repos/$GITHUB_REPOSITORY/actions/runs/46067169958" | jq -e '.head_sha=="347e13fde5cc94979568292aa5888e42ca12bc92" and .status=="completed" and .conclusion=="success"' >/dev/null
  for id in 46065569395 46065573693 46065269370; do
    gh api "repos/$GITHUB_REPOSITORY/actions/runs/$id" | jq -e '.head_sha=="c457f85d219a4282e2a1bd7216fdcb31e31dac93" and .status=="completed" and .conclusion=="success"' >/dev/null
  done
  gh api "repos/$GITHUB_REPOSITORY/actions/runs/46065269370/artifacts" | jq -e 'any(.artifacts[]; .name=="starbell-approved-audio" and .expired==false)' >/dev/null
  { echo "GARDEN_GATE=46067169958"; echo "FOCUSED_GATE=46065269370"; echo "AUDIO_SOURCE_SHA=c457f85d219a4282e2a1bd7216fdcb31e31dac93"; echo "DUO_GATE=45950550328"; echo "CAMPAIGN_GATE=46055930919"; echo "SOURCE_GATE=46055930995"; echo "ACCEPTED_RUNTIME=c457f85d219a4282e2a1bd7216fdcb31e31dac93"; } >> "$GITHUB_ENV"
  echo "Exact garden camera acceptance and previous deployed art/audio accepted"
  exit 0
fi
# Only the explicit scoped art/recording change may reuse the previously accepted gameplay.
focused_base=0cf0e75dcc6386bb7b6b93094ba0a91900323208
git fetch --no-tags --depth=1 origin "$focused_base"
test "$(git rev-parse HEAD)" = "$source_sha"
if [[ "$source_sha" != "$focused_base" ]] && git diff --quiet "$focused_base" "$source_sha" -- . ':!.github/workflows/starbell-framing-farwind-focused.yml' ':!docs/cat-bond-rpg/FINAL-ART-FOCUSED-HANDOFF-20261127.md' ':!public/cat-bond/assets/combat/star-bell-arena-chorus-wide.webp' ':!public/cat-bond/assets/combat/star-bell-arena-lock-wide.webp' ':!public/cat-bond/assets/combat/star-bell-arena-wide.webp' ':!public/cat-bond/assets/resonance-world-v2/sky-farwind-wide.webp' ':!public/cat-bond/index.html' ':!public/cat-bond/js/resonance/finale-art.mjs' ':!public/cat-bond/js/resonance/finale-combat.mjs' ':!public/cat-bond/js/resonance/integration-entry.mjs' ':!public/cat-bond/js/resonance/portrait-map.mjs' ':!public/cat-bond/js/resonance/world-runtime.mjs' ':!scripts/test-starbell-finale-framing-farwind.mjs' ':!scripts/import-starbell-region-music.mjs' ':!scripts/test-starbell-approved-region-music.mjs' ':!.github/workflows/cat-bond-preview.yml' ':!.github/workflows/starbell-portrait-art-preview.yml' ':!.github/workflows/starbell-locale-purity.yml' ':!scripts/starbell-release-gate.sh'; then
  for id in 46058187045 46058190940 46058187035; do
    gh api "repos/$GITHUB_REPOSITORY/actions/runs/$id" | jq -e --arg base "$focused_base" '.head_sha==$base and .status=="completed" and .conclusion=="success"' >/dev/null
  done
  run=$(gh api "repos/$GITHUB_REPOSITORY/actions/workflows/starbell-framing-farwind-focused.yml/runs?head_sha=$source_sha&branch=fix%2Fstarbell-finale-framing-farwind-art-20261127" | jq -r '[.workflow_runs[]|select(.head_sha=="'"$source_sha"'" and .status=="completed" and .conclusion=="success")][0].id // empty')
  [[ "$run" =~ ^[0-9]+$ ]] || { echo "Exact focused art and audio acceptance missing"; exit 1; }
  gh api "repos/$GITHUB_REPOSITORY/actions/runs/$run/artifacts" | jq -e 'any(.artifacts[]; .name=="starbell-approved-audio" and .expired==false)' >/dev/null
  { echo "FOCUSED_GATE=$run"; echo "DUO_GATE=45950550328"; echo "CAMPAIGN_GATE=46055930919"; echo "SOURCE_GATE=46055930995"; echo "ACCEPTED_RUNTIME=$focused_base"; } >> "$GITHUB_ENV"
  echo "Previously accepted campaign plus exact scoped art/audio gate $run"
  exit 0
fi
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
