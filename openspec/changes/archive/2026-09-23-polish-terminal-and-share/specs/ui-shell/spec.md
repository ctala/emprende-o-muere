# Spec Delta

## MODIFIED Requirements

### Requirement: Terminal screen states the reason
On game-over the UI SHALL distinguish, from the core terminal reason only, at least the `survived` (reached month 24) and `bankrupt` endings, with distinct copy from the strings content. The outcome stamp SHALL carry the color of its verdict inside the ledger identity: the survived seal renders in the ledger's positive tier color (the same green the morale/energy high tier uses), and the bankrupt seal keeps ledger red — red SHALL never brand a positive outcome. Under the headline the sheet SHALL show a metadata line of right-aligned mono facts identifying this exact run (the active seed and the months reached), so two different runs are told apart at a glance. On a `survived` end the UI SHALL render a settlement ledger from the run-ended event params only (no UI math): final valuation, founder ownership %, equity payout, whether the company cash was cashed out, and the personal total. Bankruptcy shows its own line with no ledger. The terminal screen SHALL also satisfy the shareable terminal screen requirement (glanceable stamp block plus the learning one-liner when one was unlocked).

#### Scenario: Bankruptcy shown
- **WHEN** the run ends with reason `bankrupt`
- **THEN** the terminal screen shows the bankruptcy message instead of the survive message, stamped in red

#### Scenario: Survival shown
- **WHEN** the run ends with reason `survived`
- **THEN** the terminal screen shows the survival message, stamped in the positive-tier green — visually distinct from the bankrupt seal without reading the words

#### Scenario: Run identity on the sheet
- **WHEN** any run ends on a page loaded with `?seed=12345`
- **THEN** the terminal metadata line shows seed 12345 and the months reached, in the mono treatment

#### Scenario: Settlement ledger rendered from event facts
- **WHEN** a survived run-ended event carries valuationK 350, founderPctBps 4210, payoutK 147, cashK 0, personalK 147
- **THEN** the terminal screen shows those values in Spanish, and the cash-out line is absent (no control)

#### Scenario: Cash-out line appears for controllers
- **WHEN** the settlement params carry a personalK that exceeds payoutK
- **THEN** the ledger includes the company-cash line explaining the difference

### Requirement: Shareable terminal screen
On game over the UI SHALL render a stamp-styled terminal screen readable in a single glance as a shareable artifact: outcome stamp (Sobreviviste / Quebraste), the run's headline number, the learned one-liner from the learnings copy when one was unlocked during THIS run (an old lesson from a previous company must never contradict this run's stamp), and the settlement ledger for survived runs. The terminal copy SHALL be a single coherent block such that selecting it (or the page) reads as a post worth forwarding in a WhatsApp group. The document head SHALL expose the name, description, and social preview meta sufficient for a link preview.

The terminal SHALL also present an explicit share action: a share button (secondary treatment under the single ink primary "Jugar otra vez", >= 48px target) that shares a Spanish result post built from strings content and terminal facts only — the stamp word for survived runs, months reached, the personal total for survived runs, the learning line when unlocked by THIS run, and the page's own URL carrying the active `?seed=` so the receiver plays the same run. A bankrupt post SHALL frame the run as a dare, not a confession: it names how many months the player held out and challenges the reader to last longer, and it SHALL NOT contain the failure stamp word or the loss lesson (those stay on the player's own screen). The action SHALL use the platform share mechanism when one is available, SHALL fall back to copying the post to the clipboard with a visible confirmation when only the clipboard is available, and SHALL degrade to selecting the visible post text when neither works. The post text SHALL also be rendered on the sheet (annotation treatment) so the block can be copied manually. Sharing SHALL NOT change game state, SHALL NOT draw randomness, and the composed post text SHALL be a pure function of the terminal facts (same facts in, same text out).

#### Scenario: Terminal reads as a share card
- **WHEN** a run ends bankrupt at month 9
- **THEN** the screen shows the Quebraste stamp, the month and headline facts, and the learning line, as one glanceable block

#### Scenario: Link preview exists
- **WHEN** the page is loaded
- **THEN** the head contains title, description and og-style preview metadata with the Spanish game name

#### Scenario: Share post replays the same seed
- **WHEN** a finished run on `?seed=777` builds its share post
- **THEN** the post's link carries `seed=777` and the post names the months reached and the personal total from this run's settlement facts

#### Scenario: Bankrupt posts dare instead of confess
- **WHEN** a run that ended bankrupt builds its share post
- **THEN** the text says how many months the player held out and challenges the reader, and contains neither the failure stamp word nor the loss lesson

#### Scenario: Share degrades without the platform API
- **WHEN** the player taps share in a browser with no platform share mechanism but with clipboard access
- **THEN** the post text lands on the clipboard and the button's state visibly confirms the copy, with no game-state change

#### Scenario: Post text is deterministic copy
- **WHEN** the same terminal facts compose the post text twice
- **THEN** both compositions are byte-identical and drawn from strings content only
