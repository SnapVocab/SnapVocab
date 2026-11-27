import type { LookupResultDTO } from '@/features/lookup/types';
import type { TemplateDTO, TopicSchemaDTO } from '@/features/template-builder/types';
import { buildAddWordPayload, validateAddWordForm } from '../add-word-helpers';
import { prefillLookup, withTemplateRoles } from '../lookup-prefill';

jest.mock('@/lib/i18n', () => ({ translate: (key: string) => key }));

const schema: TopicSchemaDTO = {
  topicId: 42,
  groups: [
    { groupId: 1, name: 'custom', label: 'Custom', multiple: false, position: 0, attributes: [
      { attributeId: 1, name: 'term42', label: 'Term', dataType: 'TEXT', required: true, position: 0 },
      { attributeId: 2, name: 'meaning42', label: 'Translation', dataType: 'TEXT', required: false, position: 1 },
      { attributeId: 3, name: 'definition', label: 'Unbound note', dataType: 'TEXT', required: false, position: 2 },
    ] },
    { groupId: 2, name: 'arbitrary', label: 'Meanings', multiple: true, position: 1, attributes: [
      { attributeId: 4, name: 'a', label: 'Definition', dataType: 'TEXT', required: false, position: 0 },
      { attributeId: 5, name: 'b', label: 'Example', dataType: 'TEXT', required: false, position: 1 },
    ] },
  ],
};
const template: TemplateDTO = {
  id: 8,
  schemaId: 1,
  name: 'Active',
  isDefault: false,
  elements: [
    { id: 1, position: 0, type: 'FIELD', field: { schemaAttributeId: 1, semanticRole: 'TARGET_WORD', hideIfEmpty: false, audioAction: false } },
    { id: 2, position: 1, type: 'FIELD', field: { schemaAttributeId: 2, semanticRole: 'NATIVE_TRANSLATION', hideIfEmpty: false, audioAction: false } },
    { id: 3, position: 2, type: 'FIELD', field: { schemaAttributeId: 4, semanticRole: 'DEFINITION', hideIfEmpty: false, audioAction: false } },
    { id: 4, position: 3, type: 'FIELD', field: { schemaAttributeId: 5, semanticRole: 'EXAMPLE_SENTENCE', hideIfEmpty: false, audioAction: false } },
  ],
};
const word: LookupResultDTO = {
  wordId: 10,
  word: 'mug',
  exists: true,
  inMyVocabulary: true,
  langCode: 'vi',
  langName: 'Vietnamese',
  translations: [{ translation: 'cốc' }],
  meanings: [
    { definition: 'a large cup', example: 'a mug of tea' },
    { definition: 'a face', example: 'a familiar mug' },
  ],
};

it('maps arbitrary field and group names through template semantic roles', () => {
  const result = prefillLookup(withTemplateRoles(schema, template), {}, word);
  expect(result.custom).toEqual({ term42: 'mug', meaning42: 'cốc' });
  expect(result.custom.definition).toBeUndefined();
  expect(result.arbitrary).toEqual([
    { a: 'a large cup', b: 'a mug of tea' },
    { a: 'a face', b: 'a familiar mug' },
  ]);
});

it('preserves user edits and never fills an unbound field by its name', () => {
  const result = prefillLookup(withTemplateRoles(schema, template), {
    custom: { term42: 'my mug', meaning42: 'my translation', definition: 'my note' },
    arbitrary: [{ a: 'my definition', b: '' }],
  }, word);
  expect(result.custom).toEqual({ term42: 'my mug', meaning42: 'my translation', definition: 'my note' });
  expect(result.arbitrary[0]).toEqual({ a: 'my definition', b: 'a mug of tea' });
});

it('does not guess mapping when no template roles are available', () => {
  const result = prefillLookup(withTemplateRoles(schema), {}, word);
  expect(result.custom).toEqual({});
  expect(result.arbitrary).toEqual([]);
});

const scanSchema: TopicSchemaDTO = {
  topicId: 226,
  groups: [
    { groupId: 1, name: 'main', label: 'Main', multiple: false, position: 0, attributes: [
      { attributeId: 1, name: 'word', label: 'Word', dataType: 'TEXT', required: true, position: 0, semanticRole: 'TARGET_WORD' },
      { attributeId: 2, name: 'phonetic', label: 'IPA', dataType: 'TEXT', required: false, position: 1, semanticRole: 'PHONETIC' },
      { attributeId: 3, name: 'translation', label: 'Translation', dataType: 'TEXT', required: false, position: 2, semanticRole: 'NATIVE_TRANSLATION' },
    ] },
    { groupId: 2, name: 'examples', label: 'Examples', multiple: true, position: 1, attributes: [
      { attributeId: 4, name: 'content', label: 'Sentence', dataType: 'TEXT', required: true, position: 0, semanticRole: 'EXAMPLE_SENTENCE' },
    ] },
  ],
};

it('prefills a scanned dictionary word without generating empty examples', () => {
  const result = prefillLookup(scanSchema, { examples: [] }, {
    ...word,
    word: 'apple',
    translations: [],
    pronunciations: [{ ipa: ' ' }, { ipa: '/apple/' }],
    meanings: Array.from({ length: 10 }, () => ({ definition: 'a fruit', definitionLang: 'vi' })),
  });
  expect(result).toEqual({ main: { word: 'apple', phonetic: '/apple/', translation: 'a fruit' }, examples: [] });
  expect(validateAddWordForm(scanSchema, result).hasError).toBe(false);
  expect(buildAddWordPayload(scanSchema, result)).toEqual({ main: result.main });
});

it('uses only actual examples and preserves existing edits when lookup runs again', () => {
  const result = prefillLookup(scanSchema, { main: { phonetic: 'my IPA' }, examples: [{ content: 'my sentence' }] }, {
    ...word,
    meanings: [{ definition: 'one' }, { example: '  a real sentence  ' }, { example: ' ' }, { example: 'another sentence' }],
  });
  expect(result.main.phonetic).toBe('my IPA');
  expect(result.examples).toEqual([{ content: 'my sentence' }, { content: 'another sentence' }]);
});

it('does not use a definition in another language as a native translation', () => {
  const result = prefillLookup(scanSchema, {}, { ...word, translations: [], meanings: [{ definition: 'a fruit', definitionLang: 'en' }] });
  expect(result.main.translation).toBeUndefined();
});

it('an unbound duplicate field on the other card side does not erase a role', () => {
  const duplicate = { ...template, elements: [...template.elements, {
    id: 5,
    position: 4,
    type: 'FIELD' as const,
    field: { schemaAttributeId: 1, semanticRole: null, hideIfEmpty: false, audioAction: false },
  }] };
  expect(prefillLookup(withTemplateRoles(schema, duplicate), {}, word).custom.term42).toBe('mug');
});

it('never prefills fields named word, translation or ipa without explicit roles', () => {
  const fields = ['word', 'translation', 'definition', 'example', 'ipa', 'phonetic'];
  const unbound: TopicSchemaDTO = { topicId: 1, groups: [{
    groupId: 1,
    name: 'main',
    label: 'Main',
    multiple: false,
    position: 0,
    attributes: fields.map((name, index) => ({
      attributeId: index + 1,
      name,
      label: name,
      dataType: 'TEXT',
      required: true,
      position: index,
    })),
  }] };
  expect(prefillLookup(unbound, {}, { ...word, pronunciations: [{ ipa: '/mʌɡ/' }] })).toEqual({ main: {} });
});

it('adds a sentence repeated under several senses only once to an examples-only group', () => {
  const examplesOnly: TopicSchemaDTO = {
    topicId: 7,
    groups: [{ groupId: 3, name: 'examples', label: 'Examples', multiple: true, position: 0, attributes: [
      { attributeId: 9, name: 'sentence', label: 'Example', dataType: 'TEXT', required: false, position: 0, semanticRole: 'EXAMPLE_SENTENCE' },
    ] }],
  };
  const result = prefillLookup(examplesOnly, {}, {
    ...word,
    meanings: [
      { definition: 'a bottle', example: 'a bottle of water' },
      { definition: 'courage', example: 'A bottle of water.' },
      { definition: 'to bottle', example: 'they bottle wine' },
    ],
  });
  expect(result.examples).toEqual([{ sentence: 'a bottle of water' }, { sentence: 'they bottle wine' }]);
});
