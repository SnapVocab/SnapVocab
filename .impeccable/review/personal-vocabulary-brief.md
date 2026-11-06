# Personal vocabulary extension

Mode: Operate. Native Android phone, Expo SDK 54 / React Native.

Confirmed by the user: keep the app's existing design; place My words in Dictionary;
scan → detection list → save individual dictionary words → My words → collection →
topic or subtopic → editable prefilled TopicItem form. Build Android development APK
so `pnpm start` works again after a production build.

Direction: inherit existing Nunito/Inter typography declarations, semantic surface,
line and brand tokens, rounded containers, bottom-border button depth, back navigation,
SafeAreaView insets, and Vietnamese/English copy. No redesign, new icon system, or
new raster assets. Primary action advances the word toward a topic; removal remains
secondary. Loading, retries and empty states are explicit.

Data: `wordId` and `inMyVocabulary` from backend lookup and scan; personal words
are separate from TopicItems. Roles are read from the selected topic's active template
through the full schema and mapped by schemaAttributeId. Never infer translation,
definition, pronunciation or example roles from names. Preserve user edits. A field
without an explicit supported role stays available for manual entry. Topic schema
alone defines form structure and allowed payload fields; template lookup failure
must not prevent manual TopicItem creation.

Validation: full mobile Jest suite passed (40 suites, 251 tests), TypeScript passed,
targeted ESLint has no errors. Android debug build succeeded and was installed on
Pixel_6 emulator. UI checks use a synthetic local API on port 18080, never the real
account or Runpod inference; the development .env remains unchanged. APK is at
`android/app/build/outputs/apk/debug/app-debug.apk`.

No HTML/CSS detector runs for this native platform. Review using the Android
reference and the established app design. Screenshot files are captured via adb.
