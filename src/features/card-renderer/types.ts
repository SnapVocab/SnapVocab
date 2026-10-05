import type { TopicItemData } from '@/features/learn/types';
import type {
  Alignment,
  BuilderField,
  BuilderSection,
  CardSide,
  DataType,
  FontSize,
  SchemaAttributeDTO,
  SchemaAttributeGroupDTO,
  SchemaDTO,
  SemanticRole,
  TemplateDTO,
  TemplateElementDTO,
  TemplateFieldDTO,
  TopicSchemaDTO,
} from '@/features/template-builder/types';

export type {
  Alignment,
  BuilderField,
  BuilderSection,
  CardSide,
  DataType,
  FontSize,
  SchemaAttributeDTO,
  SchemaAttributeGroupDTO,
  SchemaDTO,
  SemanticRole,
  TemplateDTO,
  TemplateElementDTO,
  TemplateFieldDTO,
  TopicItemData,
  TopicSchemaDTO,
};

export {
  COLOR_PALETTE,
  DEFAULT_SEMANTIC_ROLES,
  FONT_SIZE_MAP,
  REVERSE_FONT_SIZE_MAP,
} from '@/features/template-builder/types';

export type DynamicCardRendererProps = {
  template?: TemplateDTO;
  schema?: TopicSchemaDTO | SchemaDTO;
  frontSections?: BuilderSection[];
  backSections?: BuilderSection[];
  data?: TopicItemData | Record<string, any> | null;
  side?: CardSide;
  onFlip?: (side: CardSide) => void;
  isInteractive?: boolean; // Tap card surface to 3D flip
  autoPlayAudio?: boolean;
  className?: string;
  minHeight?: number;
};

export type StudyCardItem = {
  id: string | number;
  data: TopicItemData | Record<string, any>;
  state?: 'UNSEEN' | 'KNOWN' | 'LEARNING';
};

export type StudySessionResult = {
  totalCards: number;
  rememberedCount: number;
  forgotCount: number;
  xpEarned: number;
};

export type CardStudyViewProps = {
  items: TopicItemData[];
  template?: TemplateDTO;
  schema?: TopicSchemaDTO | SchemaDTO;
  topicName?: string;
  onComplete?: (result: StudySessionResult) => void;
  onExit?: () => void;
};

export type CardPreviewViewProps = {
  template?: TemplateDTO;
  schema?: TopicSchemaDTO | SchemaDTO;
  frontSections?: BuilderSection[];
  backSections?: BuilderSection[];
  data?: TopicItemData | Record<string, any> | null;
  initialSide?: CardSide;
  showSideSwitch?: boolean;
  className?: string;
};
