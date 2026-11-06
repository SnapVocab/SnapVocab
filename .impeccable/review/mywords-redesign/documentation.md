# My words and destination picker: implementation record

This records the user-approved compact-list, single-word composition in the existing SnapVocab Android app. Authority is `PRODUCT.md`, this directory's `brief.md`, `src/global.css`, shared UI primitives, and incumbent lookup, scan and learning screens. It is a surface implementation record, not a replacement global design specification. No global `DESIGN.md`, token sidecar, new asset, or unrelated drift repair is part of this document.

## Relationship to the incumbent system

| Existing authority | Implemented expression |
| --- | --- |
| `src/global.css` declares Inter and Nunito families and theme-aware background, surface, raised surface, line, edge and brand roles. | Both screens use those surface and divider roles. Nunito gives screen titles and words their established heavy heading treatment; supporting text uses the shared Text component's Inter declaration. No second palette or font family is introduced. |
| `lookup/lookup-screen.tsx` and `scan/scan-result-screen.tsx` use surface headers, line dividers, shared BackButton and Nunito headings. | My words and the picker retain that vocabulary with compact headers and the same shared back control. |
| `learn/learn-screen.tsx` uses rounded, outlined, bottom-edged cards; `components/ui/button.tsx` supplies rounded brand actions with a four-unit bottom edge and a pressed depth change. | The redesign changes repeated content cards into divided rows locally. The picker still uses the shared Button for its single confirmation action, preserving the app's tactile action treatment. It does not establish flat rows as a replacement for learning cards elsewhere. |
| Shared icons and rounded controls already provide navigation and actions. | Existing book, folder, search, overflow, chevron and check icons carry the new row composition. Neutral icon containers use raised surfaces; word folder actions and selected destinations use existing primary shades, with explicit dark variants. |

The code declares the incumbent fonts; this record does not independently certify which font files the native runtime resolved. Icon colors include existing-style explicit light/dark values as well as semantic classes. This is documentation of the scoped implementation, not a token migration.

## Composition and usage

`src/features/my-words/my-words-screen.tsx` renders a paginated FlatList of `PersonalWordRow` components. The header supplies the saved count and a labeled lookup action. A short list hint explains the word and folder actions once, rather than repeating a full-width action inside every item.

`personal-word-row.tsx` uses a minimum 80dp divided row, a 40dp book container, a two-line word title, and separate 48dp folder and overflow actions. The word area opens dictionary detail. The folder opens `/scan-save` for that word, retaining its dictionary ID and optional scan request ID. Overflow opens a native removal alert; long press also reaches that alert. Removal changes the saved dictionary-reference state, not existing topic items or study progress. Its pending state disables the overflow control and supplies busy accessibility state.

`destination-row.tsx` serves two distinct interactions. Collection rows are full-row navigation buttons with a trailing chevron. Topic rows expose radio semantics and checked state; tapping the row changes selection. A separate 48dp chevron control appears only when children exist and browses those children. Selection is expressed with both a tinted row and a checked circular marker, so color is not the only signal. Destination titles and optional translations allow two lines.

`src/features/scan/save-word-screen.tsx` keeps the current word visible while choosing among the user's own collections (`type: 'USER'`). Choosing a collection opens its topics. Browsing a topic adds an ancestry level and clears selection. The current parent remains selectable above its subtopics, so entering a folder does not force a child destination. The horizontal breadcrumb scrolls to the latest level and allows returning to an ancestor. Screen Back and Android hardware Back walk up topic and collection levels before leaving, clearing the previous selection.

The footer stays below the scrolling topic list. Until a topic is selected it shows a prompt and disables confirmation. Once selected it shows the collection/topic ancestry and enables the shared brand action. Confirmation alone replaces the picker with `/collections/add-word`, carrying topic, collection, word, optional dictionary ID, active template ID and scan request ID. Row selection does not open the form or save a TopicItem. The downstream `learn/add-word-screen.tsx` retains schema-driven editable form generation and dictionary-prefill handling; this list composition does not replace that form.

## State coverage and limits

My words has explicit initial loading, load failure with retry, empty guidance with the existing reading mascot, pull-to-refresh, pagination loading, and a retry footer when loaded items coexist with an error. The picker supplies loading, load failure with retry, no-own-collection guidance, empty-topic/subtopic messages, and pagination loading. Topic-fetch failure is shown separately from the list, allowing any already loaded rows to remain visible. Removal reports success or failure through the existing messaging helpers. Screen copy uses the existing translation mechanism.

The selected destination summary is built from the complete ancestry. Final review identified that its previous two-line limit could hide a long path; the implementation now leaves the footer summary uncapped so it can wrap. The inspected `long-path-light-large.png` capture at font scale 1.3 shows a long synthetic collection name followed by Home / Kitchen wrapping fully across three lines, with the confirmation action still visible. Its horizontal breadcrumb shows a scrolled segment rather than the entire long name at once. Row titles still allow two lines. More extreme name length and depth remain verification limits, not an inferred global design rule.

## Native evidence

Inspected captures live beside this document. The brief identifies the validation environment as Pixel_6 with a synthetic local API fixture containing eight saved words, six collections and nested topics. The images establish visible native composition; they do not independently prove every navigation or failure path.

| Capture | Evidence |
| --- | --- |
| [list-light.png](list-light.png) | Current light list: all eight fixture words and the visible “Tra thêm” lookup label, with distinct folder and overflow controls. |
| [list-dark-large.png](list-dark-large.png) | Current dark large-text list: all eight fixture words, labeled lookup action, distinct folder and overflow controls, and clear row separators. |
| [collections-light.png](collections-light.png) | Six collection navigation rows with titles, translations, rounded folder containers and chevrons. |
| [topics-unselected-light.png](topics-unselected-light.png) | Unselected radio rows, child-browse controls and disabled footer confirmation. |
| [subtopic-selected-light.png](subtopic-selected-light.png) | Selectable current parent, selected Kitchen subtopic, full fixture destination summary and enabled shared brand confirmation. |
| [subtopic-dark-large.png](subtopic-dark-large.png) | Current dark large-text nested state: readable ancestry, current-parent choice, selected radio, separate child navigation and bottom action. |
| [long-path-light-large.png](long-path-light-large.png) | Font scale 1.3 with a long synthetic collection title and Home / Kitchen: complete footer destination wraps to three lines and the enabled confirmation action remains visible. |
| [word-menu.png](word-menu.png) | Native alert explaining saved-list removal and retention of created topic items. This capture predates the labeled lookup control visible in the current large-text list; use it as alert evidence only. |

The brief reports 42 passing suites / 259 tests, passing TypeScript, and targeted lint with zero errors and remaining routine warnings. Those checks were not rerun for this documentation-only pass. Source tests in `scan/save-word.test.tsx` cover confirmation parameters, no-own-collection guidance, child browsing with parent selection, selection clearing and Android Back traversal. Final independent review is separate from this record. Runpod recovery and real inference were explicitly deferred; no real-account or inference validation is claimed here.

## Maintenance boundaries

Preserve the distinction between opening a word, choosing a destination and removing a saved reference. Keep selection separate from child navigation and from form confirmation. Reuse the app's semantic surfaces, existing typography declarations, icons, translations and shared Button rather than promoting this local list layout into a new app-wide identity. Update this record and native evidence when those interactions or their composition change.
