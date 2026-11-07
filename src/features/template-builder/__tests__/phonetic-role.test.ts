import type { TopicSchemaDTO } from '../types';
import { templateDTOToBuilderSections } from '../mappers/backend-to-client';
import { builderSectionsToTemplateElements } from '../mappers/client-to-backend';
import { createDefaultFallbackSections } from '../mappers/helpers';
import { createFieldFromAttribute, inferSemanticRole } from '../store-helpers';
import { DEFAULT_SEMANTIC_ROLES } from '../types';

jest.mock('@/lib/i18n', () => ({ translate: (key: string) => key }));

const schema: TopicSchemaDTO = { topicId: 1, groups: [{
  groupId: 1,
  name: 'main',
  label: 'Main',
  multiple: false,
  position: 0,
  attributes: [{ attributeId: 2, name: 'phonetic', label: 'IPA', dataType: 'TEXT', required: false, position: 0 }],
}] };

it('offers phonetic as a distinct role and infers it for text IPA fields', () => {
  expect(DEFAULT_SEMANTIC_ROLES.some(item => item.role === 'PHONETIC')).toBe(true);
  expect(inferSemanticRole('phonetic', 'TEXT')).toBe('PHONETIC');
  expect(inferSemanticRole('ipa', 'TEXT')).toBe('PHONETIC');
  expect(inferSemanticRole('pronunciation', 'TEXT')).toBe('PHONETIC');
  expect(inferSemanticRole('pronunciation', 'AUDIO')).toBe('AUDIO');
  expect(createFieldFromAttribute(schema.groups[0].attributes[0]).semanticRole).toBe('PHONETIC');
});

it('preserves the phonetic role through builder save and reload', () => {
  const sections = createDefaultFallbackSections(schema);
  const elements = builderSectionsToTemplateElements(sections.frontSections, sections.backSections);
  expect(elements.find(element => element.field?.schemaAttributeId === 2)?.field?.semanticRole).toBe('PHONETIC');
  const reloaded = templateDTOToBuilderSections({ id: 1, schemaId: 1, name: 'Test', isDefault: true, elements }, schema);
  expect(reloaded.frontSections.flatMap(section => section.fields).find(field => field.schemaAttributeId === 2)?.semanticRole).toBe('PHONETIC');
});
