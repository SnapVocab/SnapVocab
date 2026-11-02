---
target: mobile app UI (main navigation and key flows)
total_score: 25
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:D:\\SnapVocab\\src\\app\\(app)\\(tabs)\\_layout.tsx"
target_fingerprint: "sha256:17235e04d1914ac6dc70bbecf2f4eabaa03607e09a52885907f85a7abdff0a41"
target_path: "D:\\SnapVocab\\src\\app\\(app)\\(tabs)\\_layout.tsx"
timestamp: 2026-10-24T06-38-26Z
slug: src-app-app-tabs-layout-tsx
---
# Critique — mobile app

**Method:** design review only (detector not applicable, native platform).
**Target:** mobile app shell, with Home, Learn, Study, Missions, Shop and Profile reviewed as representative flows. No ignore list was present. Review was source-based, not on a running simulator; rendered device and screen-reader behavior still need confirmation.

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---:|---|
| 1 | Visibility of System Status | 3/4 | Loading, progress and retry states are present; some actions rely on small, local feedback. |
| 2 | Match System / Real World | 3/4 | Vocabulary and collection metaphors work; FSRS, booster and XP terms can assume prior knowledge. |
| 3 | User Control and Freedom | 3/4 | Back, refresh, retry and cancellation are generally available; some item actions are hidden behind long press/options. |
| 4 | Consistency and Standards | 2/4 | Header, card depth, dark surfaces and border treatments vary between features. |
| 5 | Error Prevention | 3/4 | Purchase/delete flows have safeguards; discoverability and feedback vary by screen. |
| 6 | Recognition Rather Than Recall | 3/4 | Collections, progress and most tabs are labeled; some secondary actions need discovery. |
| 7 | Flexibility and Efficiency | 2/4 | Collection/topic study paths exist, but frequent users have few shortcuts or batch actions. |
| 8 | Aesthetic and Minimalist Design | 2/4 | Home has several similarly prominent cards and competing entry points. |
| 9 | Error Recovery | 3/4 | Retry, loading and cached mission states are handled in several core flows. |
| 10 | Help and Documentation | 1/4 | Little contextual guidance for first-time study, FSRS ratings or gamification terms. |
| **Total** | | **25/40** | **Acceptable; consistency and focus need work.** |

## Design Specificity Verdict

SnapVocab has a recognizable product character: the mascot, camera-first tab, vocabulary collections, streaks, XP and study progress support a gamified learning app. Collection-first study also fits the daily-goal model.

The experience is less cohesive across feature areas. Home and collection cards use a pronounced tactile border style, while Profile is flatter and Shop uses its own surfaces and colors. Accent details sometimes compete with the learning action instead of reinforcing it.

**Automated scan:** not applicable for this native mobile review. **Visual overlays:** not applicable. No running simulator was available.

## Overall Impression

There is a solid learning product underneath the screens, and the primary actions are mostly represented clearly. The main opportunity is to make the next action unmistakable, then apply one shared visual and language system across feature modules.

## What’s Working

- The center camera tab makes scan-to-learn easy to find.
- Study can start from a collection or specific topic, matching the collection-based daily-goal model.
- Core async screens include loading, retry, progress and empty/error states.

## Priority Issues

1. **[P1] Home gives too many sections similar emphasis.** Greeting, search, Study Today, vocabulary stats, level/XP, missions and quick-study cards compete in one scroll. A returning learner has to scan several cards to choose the next action.
   **Fix:** make Study Today the primary action, compress stats into a quieter summary, and group secondary routes lower on the page.
   **Suggested command:** `$impeccable distill` or `$impeccable layout`

2. **[P1] Visual rules drift between modules.** Card depth and bottom-border weight vary between Home, Learn, Study, Shop and Profile; dark surfaces use different neutral palettes, and back/header patterns are not uniform.
   **Fix:** define shared surface, border, header and back-button variants, then migrate the main screens to them.
   **Suggested command:** `$impeccable extract`, then `$impeccable polish`

3. **[P1] Localization coverage is incomplete.** Home was recently moved to translation keys, but Shop still has visible Vietnamese strings and accessibility labels directly in components; the camera tab accessibility label is hardcoded in English.
   **Fix:** inventory user-visible strings in production components, move them into both locale files, and include accessibility labels and fallback copy.
   **Suggested command:** `$impeccable harden`

4. **[P2] The first study session needs more in-context guidance.** Collection selection explains the shared daily goal, but new learners get little help understanding Again/Hard/Good/Easy or what happens after rating a card.
   **Fix:** add a short, dismissible first-session explanation and concise descriptions on rating controls.
   **Suggested command:** `$impeccable onboard`

## Cognitive Load

**Moderate: 3 checklist failures.** Home lacks a single obvious focus; similar cards compete for visual hierarchy; and several destinations/actions are presented together. Grouping is otherwise fairly strong, and the collection/topic structure provides useful context.

## Persona Red Flags

- **Casey, distracted mobile learner:** Home’s long stack delays the quick “start today’s study” choice during a short session.
- **Jordan, first-time learner:** Study ratings and terms such as booster/XP are not explained at the point of use.
- **Sam, accessibility-dependent learner:** The central camera button has a hardcoded English accessibility label; color/contrast behavior needs device confirmation with both themes.

## Minor Observations

- Learn search/title fallbacks are inline Vietnamese defaults and can bypass locale selection.
- Long-press and three-dot actions are efficient for experienced users but easy to miss without a visible cue.
- Some Shop controls and error/empty copy use a visual language distinct from the rest of the app.

## Questions to Consider

- Should Home prioritize **starting today’s study** or **searching/exploring vocabulary**?
- Which pass should come first: **shared visual system**, **localization coverage**, or **study onboarding**?
