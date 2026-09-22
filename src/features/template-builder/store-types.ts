import type { FieldSlice } from './store/field-slice';
import type { SectionSlice } from './store/section-slice';
import type {
  BuilderSection,
  CardSide,
  ColumnLayout,
  CustomFieldInput,
  SchemaAttributeDTO,
  TemplateDTO,
  TemplateElementDTO,
  TopicSchemaDTO,
} from './types';

export type InitBuilderParams = {
  topicId?: number;
  topicName?: string;
  template?: TemplateDTO;
  schema?: TopicSchemaDTO;
};

export type SaveSectionParams = {
  name: string;
  columns: ColumnLayout;
  repeatable: boolean;
};

export type AddFieldParams = {
  sectionId: string;
  attribute?: SchemaAttributeDTO;
  customField?: CustomFieldInput;
  column?: 1 | 2;
};

export type CoreBuilderState = {
  topicId?: number;
  topicName: string;
  templateId?: number;
  templateName: string;
  activeSide: CardSide;
  frontSections: BuilderSection[];
  backSections: BuilderSection[];
  schema?: TopicSchemaDTO;
  availableAttributes: SchemaAttributeDTO[];
  isDirty: boolean;
  previewModalOpen: boolean;

  setActiveSide: (side: CardSide) => void;
  initBuilder: (params: InitBuilderParams) => void;
  setPreviewModalOpen: (open: boolean) => void;
  getElementsPayload: () => TemplateElementDTO[];
  reset: () => void;
};

export type TemplateBuilderState = CoreBuilderState & SectionSlice & FieldSlice;
