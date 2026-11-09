---
target: profile screen
total_score: 26
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 1
target_identity: "file:D:\\SnapVocab\\src\\features\\profile\\profile-screen.tsx"
target_fingerprint: "sha256:4c324d0c30d611fd484f94e0e5b501240e0d17775bc7219b549228ff5a5c097c"
target_path: "D:\\SnapVocab\\src\\features\\profile\\profile-screen.tsx"
timestamp: 2026-10-31T12-35-12Z
slug: src-features-profile-profile-screen-tsx
---
Method: design review only (detector not applicable, native platform)

Target: src/features/profile/profile-screen.tsx. Android emulator, light and dark; current implementation after removing the branding footer. No application source modified.

Design specificity: identity, streak, XP and owned avatar frames fit SnapVocab, but the composition is still a generic account dashboard. Its thin bordered, softly shadowed cards differ from the chunky Home/Learn/Shop world. Biggest opportunity: a compact identity block with clearer learning and collection identity, preserving factual data.

Design health: 26/40. Status 2/4 (cached profile and streak failure are not explained); real-world match 3/4 (XP multiplier ambiguity); control 3/4 (clear settings/back routes); consistency 2/4 (thin cards and mismatched Coin icon); prevention 3/4 (unavailable achievements disabled but chevron suggests navigation); recognition 3/4 (clear row labels); efficiency 3/4 (wallet and inventory direct); aesthetics 2/4 (identity oversized, weak secondary-text hierarchy in dark); recovery 2/4 (retry only if no user exists); help 3/4 (useful row descriptions, misleading unavailable-achievement hint).

Strengths: clear name and navigation groups; streak/XP/Coin are scannable; wallet and inventory labels are explicit and the native header/status bar is coherent.

Priority issues:
1. P1: XP multiplier attached to total. Code renders user.exp followed by x2 whenever a booster is active, while the screen's total is not itself doubled. Keep actual XP as the number and display a separate active XP booster status with multiplier sourced from the activation, not hard-coded. Suggested command: impeccable clarify.
2. P2: Card and type language diverges from Home. Identity, stats and menu use thin borders plus soft shadows; dark helper text becomes white through the shared Text default dark:text-white, competing with labels. Adopt incumbent chunky cards and explicit muted dark text; use the same Coin visual as Shop/Home. Suggested command: impeccable polish.
3. P2: Identity block consumes roughly 250dp before the metrics, mostly initials, email and join date. Compact avatar and identity spacing, subordinate join date, and place edit near identity. Do not fabricate levels or progress. Suggested command: impeccable layout.
4. P2: Achievements is first in the menu despite being unavailable; its chevron and 'Badges you have earned' hint imply existing content. Move available destinations first; remove the unavailable chevron and use honest copy, or hide the unshipped row. Suggested command: impeccable distill.
5. P2: Stale and failed data lack recovery with an existing stored profile. useMe falls back to stored and its error is not surfaced; streak failure remains a dash; no on-screen retry exists for this normal case. Keep cached content, offer compact offline/update feedback and retry per failed section. Do not show a pull indicator for background requests. Suggested command: impeccable harden.

Cognitive load: low, roughly four available choices including header actions; the main cost is interpreting XP and an unavailable row, not option volume. Emotional journey: clear identity -> three isolated numbers -> an unavailable achievement destination; the first reward-related row ends in a dead end. Available wallet/inventory should carry the ending.

Persona red flags: Jordan (first timer) can mistake x2 as doubled balance and try the achievement chevron; Casey (mobile) reaches to the top for edit/settings and cannot retry a silent stale profile; Sam (accessibility) encounters 40dp header targets, below the 44dp target, and menu rows lack combined accessible labels/hints.

Minor observations: date formatting is fixed dd/MM/yyyy despite English UI; large XP/Coin numbers have no locale grouping or compact layout strategy; test larger text and long names before changing the stat row. Empty-avatar initials appearing blank in the first light capture was not reproduced and is not counted as a finding.

Questions: Scope options: all five issues / visual-only issues 2-4. Achievements options: hide until shipped / retain disabled at the bottom without a chevron. Existing direction is the strong Home design; no new tone decision is needed.
