# Proposal

## Why

The owner compared the current build against a sibling project they built and
like ("documentary paper" — a single cream sheet floating on a dark backdrop,
thick olive frame, all-mono wide-tracked headers, documentary line-height) and
called the current desktop view "beige soup". Before proposing anything, the
repo's own UX machinery was run proactively against the current build (v0.2.0):

- **ux-review agent**: 0 P0 / 3 P1 / 4 P2. Measured: card-vs-paper surface
  contrast 1.09:1, border-vs-paper 1.3:1 (hierarchy exists only as 1px hairlines);
  CTA "Cerrar mes" is olive-on-olive with no emphasis; and a real phone bug —
  the fixed footer bar covers the event log at scroll bottom (measured: last log
  line bottom=830px vs bar top=665px at 393x852).
- **Synthetic panel (fresh round, 5/5 valid)**: intent 0/5 "sí" (2 "quizás");
  "planilla Excel del 2004", "me arde el ojo". New comprehension findings:
  diego derived "0 leads, 0 clientes, pitch at month 6 — ¿cómo genero ingresos?"
  from the fresh screen (the team engine is invisible until month 2), and
  flagged "Quema 15k/mes · operativa 15k" as redundant; "Energía" unexplained
  (2 personas); jorge: Cerrar mes looking pressable at month 1 "no deja pensar".
- **ui-ux-pro-max rules cited throughout**: visual-hierarchy, elevation-consistent,
  primary-action, empty-states, line-height(1.5–1.75), fixed-element-offset,
  blur-purpose, number-tabular/axis-labels.

The paper-ledger identity is a fixed contract and the reference is inside it —
a documentary paper is our ledger's own genre. This change moves the shell
toward that depth/typography without touching layout mechanics, game state, or
balance.

## What Changes

- **Surface hierarchy (kills the beige soup)**: card separation via darker
  rule-edge + one unified elevation token (2-3px hard shadow scale), not via
  same-tone fills; the CTA becomes the single ink-dark stamp element on the
  page; primary rows keep heavier treatment than secondary.
- **Documentary typography pass (identity-preserving)**: ledger ruling widens
  from 22px to 26px and lists move to 26px line-height (1.625, inside the
  skill's band); section headers ("Flujo de caja", month line) become
  uppercase mono with wide letter-spacing and right-aligned mono metadata —
  documentary cadence; prose stays serif.
- **Depth pass (desktop, the owner's complaint)**: sheets gain a thicker dark
  frame + deeper shadow at >=700px; modal/terminal backdrops gain blur behind
  the existing darken; the two-column layout caps width to read as a document,
  not a wall of beige.
- **Phone P1 fix**: the fixed Cerrar-mes/Pitch bar no longer covers the event
  log — padding reservation moves to the scroll container; scenario is
  measurable (last log line fully visible at scroll bottom, 393x852).
- **Empty-state + micro-fixes**: fresh log strip shows one ledger line instead
  of a blank 22px band; flow column headers right-align over their columns
  (the missing-`entra/sale/Caja`-labels bug is already fixed on `main` — 0.2.0
  shipped without the fix, so this change carries it).
- **Copy legibility (panel-driven, content-strings only)**: "Quema" value drops
  the redundant total-when-only-base (show parts once), "Energía" gets its
  plain gloss inside the field itself, and the help gains what diego could not
  derive: the money loop in three lines (build -> leads -> firmar -> factura ->
  cobro) with the team engine named.

## Capabilities

### New Capabilities
- (none)

### Modified Capabilities
- `ui-shell`: Responsive DOM presentation gains surface/elevation/typography
  floors, the un-occluded fixed-bar behavior, and the empty-log rule (1
  MODIFIED requirement, whole block restated). Cash-flow panel projects the
  ledger gains right-aligned column labels (1 MODIFIED requirement, whole
  block restated). Runway hero and explicit burn changes the burn-field
  rendering so no line repeats the same total twice (1 MODIFIED requirement,
  whole block restated).
- `content-strings`: no requirement delta — copy keys change (burn line,
  energy gloss, money-loop help lines) under the existing single-source rule;
  drift tests extend.

## Impact

- `styles.css` (token/elevation/typography/backdrop), `index.html` (flow head
  already patched on top of v0.2.0), `ui/view.js` (burn field parts-only, log
  empty-state line), `content/strings_es.js` (copy). No `core/`, no balance, no
  event/state changes — goldens untouched by construction.
- Gate gains: phone-occlusion e2e (393x852, last log line visible at scroll
  bottom), flow-head labels e2e (already on main), existing contrast/48px/390px
  scenarios must stay green.
- Acceptance follows the established protocol: re-run the synthetic panel (new
  shots) — goal: intent improves from 0/5 "sí" and the "feo/ardor de ojos /
  planilla 2004" cluster drops — then the 5-human WhatsApp pass before sharing.
  The panel stays a finding-generator, not a tap-test; humans confirm.
- Reversible: pure presentation + copy; rollback reverts the commit.
