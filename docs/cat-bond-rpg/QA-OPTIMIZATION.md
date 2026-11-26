# Starbell QA optimization

This is a QA-only candidate derived from `704ae1c95fbc2e4c0c3f24166f8af57ad2f36e09`. Do not merge while that candidate's final acceptance is running. No runtime, art, story or existing assertions are changed.

- Four browser workflows share one pinned Chromium setup and exact version/architecture cache. Cache never substitutes for launching a real browser; missing OS dependencies trigger the original installation path. Project dependencies and Playwright remain installed per runner. Cache scope follows GitHub branch rules, so a first target-branch run may be cold.
- Fresh opening (both languages and all original profiles) and continuous fresh-slot campaign are independent matrix jobs with fail-fast disabled. Both must pass; an opening failure cannot suppress the campaign. The campaign artifact keeps its existing name; opening evidence has its own artifact.
- Fresh workflow only cancels running work on an explicit [replace-obsolete-qa] push, consistent with the chapter workflow. Ordinary pushes preserve useful in-progress jobs. Do not use this marker for cosmetic/doc-only changes.
- On the isolated review/starbell-qa-optimization branch, a push exercises the real harbor chapter and all its reload assertions only. That smoke is not full release evidence. Manual dispatch defaults to all eight chapters on the unified branch; tail is still explicitly selectable. No automatic preview deployment from the QA review branch.
- Merge only after QA smoke passes and existing acceptance is no longer running. Preserve evidence for the exact runtime tree and test-script SHA. No estimated speedup is claimed until CI timing measurements on warm and cold cache are available.
