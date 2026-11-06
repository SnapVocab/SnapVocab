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
    rows: [{ custom_content: '' }],
  });
});

it('validates required attributes in single and repeating schema groups', () => {
  const empty = validateAddWordForm(schema, initializeFormData(schema));
  expect(empty.hasError).toBe(true);
  expect(empty.validationErrors.arbitrary.custom_term).toBeDefined();
  expect(empty.validationErrors.rows[0].custom_content).toBeDefined();
  expect(validateAddWordForm(schema, {
    arbitrary: { custom_term: 'mug', enabled: false, quantity: 0 },
    rows: [{ custom_content: 'tea' }],
  }).hasError).toBe(false);
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
