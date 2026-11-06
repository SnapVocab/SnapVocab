# Personal vocabulary implementation record

Ordinary extension of the existing native Android app. The confirmed direction in
`PRODUCT.md` and `personal-vocabulary-brief.md` preserves the incumbent design.
No new visual system was approved. `src/global.css`, `src/components/ui`, and
existing lookup, scan and learning screens remain the visual authority. No
`DESIGN.md`, design sidecar, token changes or shared-component changes were made
by this documentation pass.

## Implemented behavior

- Dictionary exposes My words; dictionary detail and individual scan detections
  reuse `SaveWordButton`. Saving/removing updates personal vocabulary and cached
  lookup/scan occurrences, then refreshes the paginated My words list. This does
  not create a TopicItem or study progress.
- My words offers detail, a primary collection action and secondary removal.
  Loading, empty, retry, refresh and pagination states are explicit.
- The destination picker reads the user's collections, supports choosing a topic
  itself or browsing its subtopics, and shows ancestry. It replaces the picker
  route with the existing editable add-word form. Header Back and Go up share the
  same level navigation. A focused Android `BackHandler` now invokes that action
  while a collection is selected; root-level Back remains navigator-owned.
- The form resolves the selected active template from the full schema (default
  template fallback when no active ID is supplied), maps `schemaAttributeId` to
  the schema's attributes, and fills text fields by `TARGET_WORD`,
  `NATIVE_TRANSLATION`, `DEFINITION` and `EXAMPLE_SENTENCE`. Repeated meaning rows
  are supported. Only empty values are filled; existing edits and custom groups
  remain intact. No field role, including IPA/phonetic, is inferred by name.
  Schema groups/attributes define the form and whitelist submitted fields. Template
  metadata is optional for prefilling; its loading or failure does not block the
  schema-generated manual form. Only an explicitly default template is used when
  no active template ID is supplied; the first template is never assumed.

## Incumbent patterns retained

Nunito/Inter declarations and existing title/body hierarchy; semantic background,
surface, line and brand colors with dark variants; rounded bordered containers;
shared buttons with bottom-border press depth; shared BackButton, status bar,
safe-area handling and existing mascot. New save/advance controls use the shared
primary variant; removal/browsing use the shared neutral variant. Vietnamese and
English translation keys follow the existing i18n system. Font family declarations
were checked in source; this is not a runtime font-loading certification.

## Evidence and limits

Read `AGENTS.md`, `PRODUCT.md`, the task brief and the Impeccable document
reference. Checked `src/features/my-words/{api,my-words-screen,save-word-button}`,
`scan/save-word-screen.tsx`, scan result/card integration, lookup entry/detail,
`learn/add-word-screen.tsx`, `learn/components/add-word/lookup-prefill.ts` and its
form hook, plus global tokens and Button/Input/Text primitives.

The review records Pixel_6 captures covering light Vietnamese at 1.3 font scale
and a dark English picker. The sole Android Back finding is resolved: native
`KEYCODE_BACK` was verified through child → root topics → collections → My words.
The reviewer inspected `back-subtopic-vi.png`, `back-root-topics-vi.png` and
`back-my-words-vi.png`, and updated the disposition to Ship within the reviewed
synthetic, compact Android scope. Final supplied validation: 40 Jest suites /
253 tests pass; TypeScript passes; targeted ESLint errors are fixed after two
test-formatting line changes, with existing/routine warnings remaining. These
and build/installation results are implementation/reviewer evidence, not checks
rerun by this documentation pass. Synthetic API fixtures do not establish
production account or inference behavior. Keyboard/IME, TalkBack, predictive Back
animation, hardware performance, complete dark/error/pagination coverage and
tablet behavior remain outside the recorded evidence. No web detector applies
to this native surface.

## Existing drift and follow-ups

- Shared light primary buttons inherit white labels on `#58CC02`; the reviewer
  reports approximately 2.1:1 contrast. Track any correction in the shared system;
  no competing feature palette was introduced.
- The reviewer notes that pagination recovery uses an error sentence as its
  button label; a translated Retry action could clarify this later.
- `AGENTS.md` still describes only Welcome/Auth as implemented, which predates
  the current feature tree. It was read as repository guidance and left intact.

These observations were recorded without repairing pre-existing system drift.
