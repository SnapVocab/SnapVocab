import type { TopicSchemaDTO } from '@/features/template-builder/types';
import { buildAddWordPayload, initializeFormData, validateAddWordForm } from '../add-word-helpers';

jest.mock('@/lib/i18n', () => ({ translate: (key: string) => key }));

const schema: TopicSchemaDTO = {
  topicId: 73,
  groups: [
    { groupId: 1, name: 'arbitrary', label: 'Custom', multiple: false, position: 0, attributes: [
      { attributeId: 1, name: 'custom_term', label: 'Term', dataType: 'TEXT', required: true, position: 0 },
      { attributeId: 2, name: 'enabled', label: 'Enabled', dataType: 'BOOLEAN', required: true, position: 1 },
      { attributeId: 3, name: 'quantity', label: 'Quantity', dataType: 'NUMBER', required: false, position: 2 },
    ] },
    { groupId: 2, name: 'rows', label: 'Rows', multiple: true, position: 1, attributes: [
      { attributeId: 4, name: 'custom_content', label: 'Content', dataType: 'TEXT', required: true, position: 0 },
    ] },
  ],
};

it('initializes exactly the topic schema without needing template metadata', () => {
  expect(initializeFormData(schema)).toEqual({
    arbitrary: { custom_term: '', enabled: false, quantity: '' },
    rows: [],
  });
});

it('validates required attributes in single and repeating schema groups', () => {
  const empty = validateAddWordForm(schema, initializeFormData(schema));
  expect(empty.hasError).toBe(true);
  expect(empty.validationErrors.arbitrary.custom_term).toBeDefined();
  expect(empty.validationErrors.rows).toBeUndefined();
  expect(validateAddWordForm(schema, {
    arbitrary: { custom_term: 'mug', enabled: false, quantity: 0 },
    rows: [{ custom_content: 'tea' }],
  }).hasError).toBe(false);
});

it('ignores entirely blank repeating rows in validation and payload', () => {
  const data = { arbitrary: { custom_term: 'apple', enabled: false }, rows: [{ custom_content: '   ' }] };
  expect(validateAddWordForm(schema, data).hasError).toBe(false);
  expect(buildAddWordPayload(schema, data)).toEqual({ arbitrary: { custom_term: 'apple', enabled: false } });
});

it('still validates a partially entered repeating row', () => {
  const expanded = { ...schema, groups: [schema.groups[0], {
    ...schema.groups[1],
    attributes: [...schema.groups[1].attributes, {
      attributeId: 5,
      name: 'note',
      label: 'Note',
      dataType: 'TEXT' as const,
      required: false,
      position: 1,
    }],
  }] };
  const result = validateAddWordForm(expanded, {
    arbitrary: { custom_term: 'apple' },
    rows: [{ custom_content: '', note: 'a note' }],
  });
  expect(result.validationErrors.rows[0].custom_content).toBeDefined();
});

it('submits only schema-declared groups and attributes, preserving false and zero', () => {
  expect(buildAddWordPayload(schema, {
    extra_group: { fake: 'not in schema' },
    arbitrary: { custom_term: 'mug', enabled: false, quantity: 0, extra_field: 'not in schema' },
    rows: [{ custom_content: 'tea', extra_field: 'not in schema' }],
  })).toEqual({
    arbitrary: { custom_term: 'mug', enabled: false, quantity: 0 },
    rows: [{ custom_content: 'tea' }],
  });
});

it('retains explicitly false and zero values in repeating groups', () => {
  const repeated = { ...schema, groups: [{ ...schema.groups[0], multiple: true }] };
  expect(buildAddWordPayload(repeated, { arbitrary: [{ enabled: false, quantity: 0 }] }))
    .toEqual({ arbitrary: [{ enabled: false, quantity: 0 }] });
});
