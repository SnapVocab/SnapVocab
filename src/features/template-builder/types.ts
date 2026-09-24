export type CardSide = 'FRONT' | 'BACK';

export type ColumnLayout = 1 | 2;

export type FontSize = 'S' | 'M' | 'L' | 'XL';

export type Alignment = 'LEFT' | 'CENTER' | 'RIGHT';

export type SemanticRole
  = | 'TARGET_WORD' // Từ vựng chính
    | 'DEFINITION' // Giải nghĩa
    | 'NATIVE_TRANSLATION' // Bản dịch / Nghĩa
    | 'EXAMPLE_SENTENCE' // Câu ví dụ
    | 'AUDIO' // Âm thanh
    | 'IMAGE'; // Hình ảnh

export type DataType = 'TEXT' | 'AUDIO' | 'IMAGE' | 'NUMBER' | 'BOOLEAN' | 'DATE';

export type TemplateElementType = 'FIELD' | 'SECTION_BREAK' | 'COLUMN_BREAK';

export type SchemaAttributeDTO = {
  attributeId: number;
  name: string;
  label: string;
  dataType: DataType;
  required: boolean;
  position: number;
};

export type SchemaAttributeGroupDTO = {
  groupId: number;
  name: string;
  label: string;
  multiple: boolean;
  position: number;
  attributes: SchemaAttributeDTO[];
};

export type TopicSchemaDTO = {
  topicId: number;
  schemaId?: number;
  name?: string;
  shared?: boolean;
  usageCount?: number;
  groups: SchemaAttributeGroupDTO[];
};

export type TemplateFieldDTO = {
  id?: number;
  schemaAttributeId: number;
  semanticRole?: SemanticRole | null;
  fieldLabel?: string | null;
  hideIfEmpty: boolean;
  audioAction: boolean;
  fontSize?: number | null;
  alignment?: Alignment | null;
  color?: string | null;
};

export type TemplateElementDTO = {
  id?: number;
  position: number;
  type: TemplateElementType;
  side?: CardSide;
  sectionLabel?: string | null;
  repeatable?: boolean | null;
  field?: TemplateFieldDTO | null;
};

export type TemplateDTO = {
  id: number;
  schemaId: number;
  code?: string | null;
  name: string;
  isDefault: boolean;
  elements: TemplateElementDTO[];
  createdAt?: string;
  updatedAt?: string;
};

export type SchemaDTO = {
  id: number;
  code?: string | null;
  isSystem: boolean;
  userId?: number | null;
  name: string;
  description?: string | null;
  groups: SchemaAttributeGroupDTO[];
  templates: TemplateDTO[];
  createdAt?: string;
  updatedAt?: string;
};

export type UpdateTemplatePayload = {
  name?: string;
  elements: TemplateElementDTO[];
};

export type BuilderField = {
  id: string; // Unique Client ID (e.g. UUID)
  schemaAttributeId: number; // Linked attribute ID from backend schema
  attributeName: string; // e.g. 'word', 'phonetic', 'meaning', 'example'
  fieldLabel: string; // Display label (e.g. 'Từ vựng', 'Phiên âm', 'Bản dịch / Nghĩa')
  semanticRole: SemanticRole | null;
  required: boolean; // "Bắt buộc điền thông tin" toggle
  hideIfEmpty: boolean; // "Tự động ẩn ô này nếu để trống" toggle
  audioAction: boolean; // "Phát âm thanh khi chạm" toggle
  fontSize: FontSize; // 'S' | 'M' | 'L' | 'XL'
  alignment: Alignment; // 'LEFT' | 'CENTER' | 'RIGHT'
  color: string; // Hex color code (e.g. '#111827', '#16A34A')
  dataType?: DataType; // 'TEXT' | 'AUDIO' | 'IMAGE' | 'NUMBER' | 'BOOLEAN' | 'DATE'
  column: 1 | 2; // Column position within section (1: Left/Full, 2: Right)
  samplePlaceholder?: string; // Example text for live preview mockup
};

export type CustomFieldInput = {
  name?: string; // Attribute key (e.g. 'synonyms')
  label: string; // Display label (e.g. 'Từ đồng nghĩa')
  dataType: DataType; // 'TEXT' | 'AUDIO' | 'IMAGE' | 'NUMBER' | 'BOOLEAN'
  required: boolean;
  semanticRole?: SemanticRole | null;
};

export type BuilderSection = {
  id: string; // Unique Client ID (e.g. UUID)
  name: string; // Section name (e.g. 'Thông tin chung', 'Nghĩa & Ví dụ')
  side: CardSide; // 'FRONT' | 'BACK'
  columns: ColumnLayout; // 1 (100%) or 2 (50% - 50%)
  repeatable: boolean; // "Cho phép lặp lại (Danh sách 1-n)" toggle
  fields: BuilderField[]; // Fields belonging to this section
};

export const FONT_SIZE_MAP: Record<FontSize, number> = {
  S: 13,
  M: 16,
  L: 20,
  XL: 26,
};

export const REVERSE_FONT_SIZE_MAP: Record<number, FontSize> = {
  13: 'S',
  14: 'S',
  15: 'M',
  16: 'M',
  18: 'M',
  20: 'L',
  22: 'L',
  24: 'XL',
  26: 'XL',
  28: 'XL',
  32: 'XL',
};

export const COLOR_PALETTE = [
  { name: 'Dark Navy', hex: '#111827' },
  { name: 'Green', hex: '#16A34A' },
  { name: 'Orange', hex: '#EA580C' },
  { name: 'Blue', hex: '#0284C7' },
  { name: 'Yellow', hex: '#EAB308' },
  { name: 'Red', hex: '#DC2626' },
  { name: 'Purple', hex: '#9333EA' },
  { name: 'Gray', hex: '#6B7280' },
];

export const DEFAULT_SEMANTIC_ROLES: { role: SemanticRole; label: string }[] = [
  { role: 'TARGET_WORD', label: 'Từ vựng chính' },
  { role: 'DEFINITION', label: 'Giải nghĩa' },
  { role: 'NATIVE_TRANSLATION', label: 'Bản dịch / Nghĩa' },
  { role: 'EXAMPLE_SENTENCE', label: 'Câu ví dụ' },
  { role: 'AUDIO', label: 'Âm thanh' },
  { role: 'IMAGE', label: 'Hình ảnh' },
];
