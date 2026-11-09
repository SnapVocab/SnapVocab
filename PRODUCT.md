# Product

<!-- impeccable:product-schema 1 -->

## Platform

android

## Product Purpose

SnapVocab helps learners collect English vocabulary from dictionary lookup and
photo scans, then turn selected words into learning items in their own collections.

## Operating Context

The user confirmed the flow: scan → detection list → save to My words → open My
words from Dictionary → choose a collection and a topic or subtopic → review the
prefilled add-word form. Android development builds connect to `pnpm start`.

## Capabilities and Constraints

- Personal words are dictionary references saved for the authenticated user.
- Saving a personal word is separate from creating a TopicItem or study progress.
- Form prefilling uses template semantic roles and preserves user-entered values.
- The existing Expo/React Native app, routes, UI primitives and Vietnamese/English
  translations remain the implementation foundation.

## Brand Commitments

Preserve the current app's design language, as explicitly requested by the user.
Incumbent authority: `src/global.css`, `src/components/ui`, and existing lookup,
scan and learning screens. The user approved a scoped redesign of My words and
the collection/topic picker: compact lists and individual-word actions. Keep the
app's established typography, colors and component language.
