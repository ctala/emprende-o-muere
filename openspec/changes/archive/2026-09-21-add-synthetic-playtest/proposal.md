# Proposal

## Why

Every visual change so far was validated only against an 800×450 desktop
viewport; the first mobile look (393×852) showed an unreadable 393×221
canvas strip. The fix is a mobile-first shell redesign, but the audience
(LatAm startup community arriving through WhatsApp) was decided from
conversation, not evidence — and there is no budget for a human research
panel yet. Microsoft TinyTroupe (LLM persona simulation, MIT license) lets
us run synthetic focus groups: 5 founder personas that *see* the actual
screenshots (vision support, v0.7.0) and give comprehension, taste and
share-intent feedback before a single human is asked. This change builds
that harness; the redesign change consumes its output.

## What Changes

- New `playtest/` directory (tooling, not game code): Python venv with
  TinyTroupe installed from git, plus a local OpenAI-compat shim proxying
  to DashScope mode-compatible (the environment has `DASHSCOPE_API_KEY`
  only, and TinyTroupe's client hardcodes `OPENAI_API_KEY`/OpenAI URLs —
  the shim lets it run unmodified)
- 5 founder persona JSON specs (early-stage founder, funded second-timer,
  curious aspirant, traditional SME owner, designer-gamer) plus 3
  persona-adherence unit tests
- Screenshot rig (Node, reusing the existing CDP pattern): captures the
  game's 3 canonical states — fresh month 1, help open, QUEBRASTE game
  over — at mobile portrait 393×852, landscape 852×393, and desktop
- Round protocol per agent (isolated, no cross-talk): cold-glance
  comprehension, imagined play (what to tap first, what the grey button
  means), share intent on the game over screen; results land as
  `results/round<N>.json` + a synthesized markdown report
- One real round executed against the CURRENT build (the baseline the
  mobile-first redesign will be measured against)
- Nothing in `core/`, `ui/`, `content/` changes; the game and its tests
  are untouched. Playtest failures never block `node --test`

## Capabilities

### New Capabilities
- `synthetic-playtest`: an offline research harness that simulates a
  defined persona panel, feeds it real screenshots of the game, and
  records structured, auditable feedback as the evidence gate for visual
  changes

### Modified Capabilities
- (none — no game behavior changes)

## Impact

- New `playtest/` (personas/, shim, runner scripts) — Python 3.10+ venv,
  excluded from the game's Node test suite and the browser bundle
- Cost/calls: ~5 personas × 3 rounds of vision calls per round via
  DashScope; cached responses so re-analysis is free
- `tests/` gains persona-schema tests only (plain Node or Python, not the
  game suite); README gains a "Playtest" section
- Downstream: the mobile-first shell redesign change cites
  `playtest/results/` as its evidence; the 3-viewport screenshot rule
  (portrait/landscape/desktop) becomes a standing verification convention
