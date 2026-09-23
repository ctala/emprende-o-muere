# Emprende o Muere

Turn-based roguelite about founding a startup in Latin America. 24 months,
two actions per month, and it mostly goes wrong. That's the point.

## Play

No build step, no dependencies, no npm install. Static files only.

ES modules do not load over `file://`, so serve the folder with any static
server:

```
python3 -m http.server 8000
```

and open http://localhost:8000. For deployment, any plain static hosting
works (drop the folder anywhere). The game runs fully offline: no network
requests, no analytics, no CDNs.

## Two engines

The founder presses buttons (build, talk, publish, rest, sign, hire, pitch);
the team runs on its own every month: roles add interested customers
automatically, and Ventas closes one deal per month without any click. Sign
yourself when you have focus and the MVP is built (2 builds) — the team only
signs one deal a month, founder signings stack on top. Publish content to
feed the pipeline the team converts into invoices.

## Test

Two layers, one command (requires Node 22+; the browser layer uses the
cached Chromium headless shell, no installs):

```
npm run gate
```

- `npm test` — pure Node unit suite: core rules, RNG goldens, view model,
  strings, purity.
- `npm run test:e2e` — browser gate: serves the folder over http, boots the
  real page, fails on any console/page error, blank render, unwired boot
  marker, disabled rows without a reason, clicks that change nothing, or a
  run that never reaches its stamp. Set `CHROME=/path/to/chrome-headless-shell`
  if the cached one is missing.

Green gate means "the page actually boots, renders, and plays". A green unit
suite alone does not.

## Playtest

Synthetic founder-panel research (`playtest/`): five simulated LatAm
founders *see* screenshots of the game and answer a fixed comprehension /
play / share-intent protocol. It is a Python tool, not game code — the game
never imports it and `node --test` stays its only gate. It is opinion from
LLM simulation, **not human data**: use it to find comprehension and
language problems, then confirm with real people. Setup and commands:
`playtest/README.md`. Round 1 was against the old canvas build; round 2 (the
DOM shell) lives in `playtest/results/round2-report.md`, and the canvas round-1
report in `playtest/results/round1-report.md`. Synthesize a report from the
raw JSON with `node playtest/synthesize.mjs N` (run from the repo root).

## Layout

- `core/` — pure deterministic game rules. No DOM, no `Date`, no `Math.random`,
  no floats. Same seed + same action sequence = identical run.
- `ui/` — DOM presentation (view model + renderer). Consumes the core; never
  the other way around. `tests/e2e/` drives this layer in a real browser.
- `content/strings_es.js` — all player-visible text, in one place, Spanish.

## Roadmap

One OpenSpec change at a time, proposed against the previous change's archived specs:

1. ~~walking skeleton~~ (shipped)
2. ~~focus + actions~~ (shipped)
3. ~~cash / runway~~ (shipped: invoices at 90 days, bankruptcy)
4. early hires (CTO/CPO/CFO/ventas: salaries -> burn, perks -> actions)
5. fundraising I (one investor, term sheet, cap table + founder burnout:
   the pitch scene is where energy finally lives — a burned-out founder
   gets worse terms; the energy bar was simulated ~15 tunings against the
   bootstrap economy and every placement either killed bootstrapping or
   never bound; it needs the fundraising slack to exist as a real decision)
6. fundraising II (hidden-archetype investors, toxic clauses)
7. learnings (persistent between runs: reveals information, no perks)
8. exit (real payout math — the punchline)
9. ~~visual identity~~ (shipped as the ledger; ~~canvas shell superseded~~ —
   now a responsive DOM shell, portrait-first, mobile-readable)
9b. game feel (tweens/floating numbers/particles/shake — the Balatro layer).
   SUPERSEDED as a canvas change; the cheap CSS-transition slice returns as a
   future DOM change once the shell settles.
9c. feedback metaphors + synthesized sound (burn tank, runway road, WebAudio)
10. outsourced tasks (buy work per task — freelance/agente — instead of a
    salary; the alternative that makes CFO/CPO hires a real decision)

Rules: each change is proposed against the previous change's archived specs
(no upfront proposals for future stages). Every new screen ships as its own
`ui/` module with pure layout (see `ui/layout.js`) and must look good from
its first commit; cosmetic sweeps happen only in change 9. The month closes
automatically ~600 ms after the last focus point is spent (UI-side dispatch;
core and replay logs unchanged).

## Dev log

- `add-walking-skeleton`: seedable core, `NEXT_MONTH` loop, month counter on
  canvas, replay-determinism tests. No economy yet, on purpose.
- `add-focus-and-actions`: 2 focus/month, 4 actions (build/talk/publish/rest),
  traction + morale with a 3-tier effectiveness gate, `END_MONTH` with morale
  decay, jittered yields from the seeded PRNG, canvas buttons + HUD.
  Playtest note (auto-run, 2x build every month, no rest): morale hits 0 around
  month 5 and traction ends at ~18 — labor is strong but self-defeating without
  rest. Tuning block is one place; rebalance with cash pressure in change 03.
- `add-cash-runway`: cash in $k, invoices paying at 90 days, burn, bankruptcy.
  Balance note: first tuning (80/20/10+5) made the game inwonnable — swept 8
  policies x 8 seeds, 0 survivors; fixed to start 120 / burn 15 / deal 20+10
  per 10 traction: idle play dies ~month 9-10, harvest play survives 8/8 with
  half ending near cash $0 (winning while gasping = intended feel).
- `add-early-hires`: team + HIRE action. Role prices are a gradient lesson:
  VENTAS 3+2 and CTO 5+4 pay off even in bootstrap (8/8 harvest seeds richer);
  CFO 12+8 and CPO 8+6 are bankruptcy at seed stage on purpose — some roles
  are services you buy per task, not salaries you carry early (outsource
  alternative deferred to a follow-up change). First pre-authoring sim was
  wrong (single-hire gate overestimates); the real-core sweep set the numbers.
- `add-fundraising-i`: founder energy + PITCH + term sheets + cap table.
  Energy only drains on the pitch (−80, gate 40, regen +10/mes, REST +25), so
  bootstrap stays byte-identical and the drained pitch tier (<60 -> pre x2/3)
  is reachable — a gate equal to the penalty floor would have made it a dead
  mechanic (first sim draft had exactly that bug). UI holds the 600ms
  auto-close while an offer is undecided, otherwise expiry would eat every
  pitch. Sim-pinned: fundraising turns ~$40 bootstraps into $540 (drained
  pitches) or $1020k (fresh pitches) but the founder lands near 1-2% — cash
  is not ownership; the exit change makes the cap table mean something.
- `add-fundraising-ii`: COUNTER_ROUND on pending offers — 20 energy to push
  dilution to 4/5, 1-in-4 the investor walks. The elegant seam: a fresh pitch
  leaves exactly 20 energy (100-80), so one fresh pitch buys exactly one
  negotiation and a drained pitch buys none. Sim-pinned trade: negotiating
  trades cash for ownership on every seed (~$900 @ 2% vs $1020 @ <1% fresh;
  $420 @ ~4% vs $540 @ 1% drained). Walk uses PRNG — the only fundraising
  draw; replays reproduce it via the run log.
- `add-exit`: the punchline. At month 24 an acquirer pays 150 + 10/traction
  (traction, not cash — the compounding asset); the founder is paid by
  ownership, and only while holding >= half also cashes out the company
  balance. Sim-pinned over 8 seeds: bootstrap $160-640k personal, naive
  raise-everything $3-7k on EVERY seed (the disaster is strict), raise-then-
  build $184-889k winning 6/8 but losing 2 — the right answer is judgment,
  not formula. On-screen proof: bootstrapper personal $210k beats a
  two-round founder's $148k who sits on $310k of money no longer his.
- `add-learnings`: cross-run memory, decision A enforced structurally — the
  whole feature lives in ui/ (core import-graph test proves the core can
  never see it), so learnings can only reveal, never perk. Eight discoveries
  triggered purely from the event stream (the one core change is the
  informational `tier` param on offer events, so attribution never
  duplicates pricing math in UI). localStorage via injected adapter -> all
  logic tests run under plain Node; corrupt payloads fall back to empty.
- `add-visual-identity`: the paper-and-ink ledger look — pixels only, the
  geometry is frozen. The literal `CLICKABLE` coordinate table is pinned by
  a test so any future button nudge fails loudly. `ui/theme.js` owns the
  whole look: warm near-black desk under cream sheets, accountant red
  (`#a3312a`) for the margin rule / negatives / seals, mono digits + dot
  leaders for ledger numbers, serif for prose. Rotations are fixed
  constants, never random, so identity adds zero nondeterminism (two CDP
  sessions with the same click plan end on byte-identical frames). Offer
  panel = term sheet with a dashed perforation above the buttons; game-over
  = rotated rubber stamp (QUEBRASTE / SOBREVIVISTE) over the page.
- `improve-onboarding`: renamed to "Emprende o Muere — El juego de las
  startups" (the English working title was opaque to the target player).
  Policy: the venture jargon STAYS on the HUD (Runway, Burn, Pitch are part
  of what the game teaches) but is never left undefined — a "?" legend
  (same modal contract as the library) glosses every metric, action and
  lock rule in plain Spanish, driven by `getHelpSections()` data so copy
  drift fails a Node test. First-run hint points at "?" until first open,
  then never again (`roguelike.helpSeen.v1`, same storage adapter).
- `add-regression-gate`: incident — the owner opened the page to review and
  saw nothing (blank screen: `file://` blocks ES modules; the throwaway `/tmp`
  CDP checks that would have caught it never run on their own). The unit
  suite was green. Fix is structural, not the one missing server: the repo
  now ships a committed browser gate — `npm run gate` runs the pure suite
  then boots the real page over its own http server (stdlib CDP + the cached
  headless shell, zero dependencies), fails on console errors, blank render,
  missing boot marker, disabled rows without a reason, clicks that change
  nothing, or a run that never reaches its stamp; the `file://` blank page is
  a permanent diagnosis scenario, not a pass. Deterministic via `?seed=`.
  Green gate = "the page actually boots, renders, and plays".
- `redesign-mobile-first`: the canvas shell is gone; the game is a
  responsive DOM shell — portrait-first (WhatsApp-link phone sessions),
  runway as the one big number ("8m / meses de vida"), Quema explicit next
  to Caja, ledger identity rebuilt in CSS (paper, rules, margin red, stamp).
  Decision trail: synthetic round 1 flagged phone legibility as the top
  friction at 6px canvas text; owner confirmed on a 393px phone. The
  add-game-feel change (canvas tweens) was superseded by this; its cheap
  CSS-transition slice may return later. Terminal is a shareable trophy:
  stamp + learning line + settlement, closable, with "Jugar otra vez".
  Owner review passes then fixed: closable modals (button/Esc/backdrop),
  solid buttons, state cards, burned-team warning ("Tracción +0" in ledger
  red instead of a silent freeze the owner read as a bug), focus as "2/2",
  sticky Cerrar mes, and a `ux-review` agent (powered by the ui-ux-pro-max
  skill) now gates visual changes — its first pass caught the gold-on-paper
  CTA at 3.97:1 contrast (now 5.69:1). Round 2 against the DOM shell is in
  `playtest/results/round2-report.md`.
  Round-2 gate verdict (run twice): the DOM shell fixed the round-1 top
  friction (6px canvas text: the physical legibility complaints are gone;
  help comprehension 5/5, cause-of-loss 5/5, valid records 15/15). Share
  intent held at 2/5 — the social barrier ("vergüenza de quebrar en el
  grupo") is a content/viral-design problem, NOT a shell problem, so it
  does not block this change and moves to the backlog. Remaining flagged
   needs-human: body size vs panel taste (the ledger's 16px floor is an
   accessibility line, not a preference), ledger texture "noise", and the
   jargon stance (kept by design, glossed). All four go to the 5-human
   WhatsApp-group pass before any external sharing.
- `open-source-release`: v0.1.0 published 2026-09-22 as
  github.com/ctala/emprende-o-muere (public, MIT, tagged annotated release).
  Version source is `package.json`; CHANGELOG.md is written before every tag.
  What to test from a stranger's phone: open the game from any static host
  (or the repo's Pages once set up), expect a readable one-column portrait
  layout with no zooming, and run `npm run gate` — green means the page
  boots, renders, and plays for real.
- `two-engines-economy`: the team finally works. Buttons stay the founder's
  hands; the team is a machine that runs every END_MONTH with zero extra PRNG
  draws (bootstrap stays byte-identical): each role feeds the pipeline
  (`pipeline` table field), and VENTAS auto-closes one deal a month with no
  click or focus. Traction is now framed as "Clientes interesados" everywhere
  (field name unchanged in core), and nobody can sell vaporware: the first
  signing — founder's or the team's — needs an MVP (2 builds). Balance decided
  by `node scripts/sweep.mjs` (6 policy families x 16 seeds, bands pinned as
  tests): sales-first survives 16/16 ($481k mean) with the founder resting,
  publisher-without-sales still dies (content feeds cash only through a
  closer), bad-hire lesson preserved 0/16. The money that arrives is still
  one-time invoices — recurring revenue stays roadmap.

- `add-cashflow-forecast`: money legibility, zero balance change. Leads vs
  Clientes finally named as the two different things the state always tracked;
  burn decomposed into named parts (15 operativa · 2 Ventas · 4 CTO); the
  "Flujo de caja" panel projects the founder-does-nothing future exactly —
  possible because cash evolution is morale-independent, so forecastOf replays
  the engine's cash line with zero PRNG draws and matches a real idle run
  cash-for-cash (pinned by test). Each contract pays once: the "MRR" shown is
  a run-rate, recurring revenue stays roadmap. Also fixed the CFO card
  advertising "+0 leads/mes".
- `redesign-documentary-ledger`: the identity held; the craft caught up. The
  evidence protocol ran BEFORE the proposal: the ux-review agent graded the
  shipped v0.2.0 build (5 P1s: beige soup, weak CTA, bar occluding the log on
  phones, empty-log band, missing flow labels), the synthetic panel confirmed
  the same from screenshots, and only then did the change get authored — that
  order (evidence → proposal → implement → re-run) is the loop now pinned by
  the change's acceptance tasks. The ledger vocabulary flip is an OWNER
  OVERRIDE of the `improve-onboarding` jargon policy: after three panel rounds
  at 0/5 "would play" with "habla en cristiano" as the recurring verdict, the
  jargon itself (Runway/Quema/Leads/Pitch/Founder) was renamed to plain
  Spanish instead of glossed (Quema→Gastos etc.), the hero says "8 meses" not
  "8m", and type went 16→17px on a 28px rule grid (reference bar: the owner's
  own elhda-ep22 script mock — big serif prose on wide rules reads as a
  document, not a planilla). Panel post-pass: comprehension 5/5, intent 1/5
  "sí", zero jargon complaints; still synthetic — the 5-human WhatsApp-founder
  pass remains the real gate before v0.3.0.
- `polish-terminal-and-share`: the terminal is a trophy, and now you can hand
  it to someone. The survived seal stamps in the ledger's positive green (the
  same token as the morale/energy high tier) — red brands only negatives, so
  SOBREVIVISTE and QUEBRASTE are told apart without reading. A `seed · mes`
  line identifies which run this was. Share: `composeShareText` (pure,
  Node-tested) builds ONE post used for both the visible on-sheet text and the
  share payload; its link carries the seed actually played (`?seed=`), so a
  forwarded post replays YOUR exact 24 months through the existing replay
  contract; `performShare` degrades navigator.share → clipboard("Copiado") →
  select-the-post, never touching game state. The copy went through three
  synthetic round-3s on the same terminal: the confession ("Quebré en el mes
  9") tripped the shame wall (4/5 named it; share intent 2/5); the dare
  ("Aguanté N meses. ¿Vos aguantás más?" — no failure stamp, no loss lesson in
  the message) hit the 3/5 bar and pulled shame to 1/5; a neutral variant fell
  back to 2/5 as "seco". The loss lesson stays on the player's own screen
  only (and now comes only from THIS run's unlocks — a bankrupt→restart→
  survived run must show no old lesson, pinned e2e). e2e also pins the
  seed-in-link, seal colors by computed style, the clipboard stub, and
  AbortError silence.

## Contributing

The contract is one command: `npm run gate` (unit + real-browser e2e) must be
green. Behavior changes start as an OpenSpec change (`openspec/`), visual
changes go through the `ux-review` agent's findings. Zero dependencies and no
build step are load-bearing — keep them. Issues welcome.

## License

MIT — see [LICENSE](LICENSE). The vendored `ui-ux-pro-max` skill keeps its own
MIT license and provenance in `.opencode/skills/ui-ux-pro-max/`.
