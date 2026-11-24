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
  force?: boolean;
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

export type SavedCustomTemplate = {
  schemaId: number;
  templateId: number;
  name: string;
  frontSummary: string;
  backSummary: string;
};

export type CoreBuilderState = {
  isInitialized: boolean;
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
  savedCustomTemplate: SavedCustomTemplate | null;

  setActiveSide: (side: CardSide) => void;
  initBuilder: (params: InitBuilderParams) => void;
  setPreviewModalOpen: (open: boolean) => void;
  setSavedCustomTemplate: (template: SavedCustomTemplate | null) => void;
  markSaved: () => void;
  getElementsPayload: () => TemplateElementDTO[];
  reset: () => void;
};

export type TemplateBuilderState = CoreBuilderState & SectionSlice & FieldSlice;
