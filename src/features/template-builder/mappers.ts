export {
  type ParseElementsOptions,
  parseElementsToSections,
  templateDTOToBuilderSections,
} from './mappers/backend-to-client';

export {
  builderSectionsToTemplateElements,
  createFieldElement,
  type CreateFieldElementParams,
} from './mappers/client-to-backend';

export {
  createDefaultFallbackSections,
  createEmptySection,
  type CreateEmptySectionParams,
  findAttributeInSchema,
  type FindAttributeResult,
  generateClientId,
  isFrontElementFallback,
  resolveFontSizeKey,
} from './mappers/helpers';
