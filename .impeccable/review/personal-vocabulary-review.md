## Disposition

**Ship at the reviewed synthetic Android compact-phone scope.** The sole material finding is resolved. The captured phone UI preserves the incumbent design and supports the requested task without a redesign. This is a native design/source review, not a production integration certification.

## Evidence checked

- Read AGENTS.md, PRODUCT.md, the personal-vocabulary brief, craft-floor.md and android.md.
- Visually inspected Pixel_6 emulator captures: `my-words-light-vi-large.png`, `my-words-empty-vi-large.png`, `subtopic-light-vi-large.png`, `add-word-light-vi-large.png`, `word-detail-vi-large.png`, `scan-vi-large.png`, and `choose-subtopic-dark.png`.
- Inspected My words list/mutation/button code, Dictionary entry, destination picker, semantic-role prefill and add-word form against `src/global.css` and the shared Button/BackButton primitives.
- Build, installation, TypeScript, lint and Jest outcomes are supplied implementation evidence; this reviewer did not rerun them.
- Follow-up: inspected focused `BackHandler` registration/cleanup and captures `back-subtopic-vi.png`, `back-root-topics-vi.png`, and `back-my-words-vi.png` at Vietnamese font scale 1.0. Implementer supplied passing focused regression/TypeScript evidence and an actual adb KEYCODE_BACK sequence through subtopics, root topics, collections (confirmed by UI hierarchy text), then My words.

## Material findings

- **Resolved — P2, System Back skipped picker levels.** `src/features/scan/save-word-screen.tsx` now registers Android Back while the picker is focused and a collection is selected, invokes the same `goUp` callback as visible Back, and removes the handler on blur/unselection. At the collections root, the navigator handles Back normally. Source inspection, the focused regression result, and the supplied native KEYCODE_BACK sequence resolve the finding. No material findings remain within the reviewed scope.

## Optional findings

- The light primary button inherits white on `#58CC02` from the established shared design (approximately 2.1:1). It falls below the craft-floor text contrast threshold. Track a shared-token accessibility correction separately; this extension should not introduce a competing button palette.
- The populated-list pagination recovery button uses the error sentence as its label (`my-words-screen.tsx`, ListFooterComponent). A short translated Retry action with adjacent error copy would state the recovery more clearly.
- VI copy at 1.3 scale wraps cleanly in the reviewed states. Primary collection advancement and secondary removal are distinguishable; topic ancestry and parent/child destinations remain explicit. Rounded containers, depth borders, type hierarchy and dark surface roles agree with incumbent primitives.

## Coverage/limitations

The evidence covers one compact Android emulator, light Vietnamese at 1.3 font scale and one dark English destination-picker state. No approved visual comp exists; incumbent code and screens are the visual authority. No web detector ran because the implementation is native. Synthetic API data establishes UI/data-flow behavior only. The scan fixture deliberately uses the existing app icon and proves no detection quality. Still captures do not verify keyboard/IME behavior, TalkBack traversal, predictive Back animation, hardware performance, real-account authentication, real inference, or all dark/error/loading/pagination variants. The add-word capture shows the top of a scrollable form, not every field. No tablet claim is made.
