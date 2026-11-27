import type { MyTemplateDTO } from '@/features/template-builder/api';
import type { SavedCustomTemplate } from '@/features/template-builder/store-types';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { Button, Text, useSurface } from '@/components/ui';
import { CheckIcon, LayoutGridIcon, SlidersIcon } from '@/components/ui/icons';
import { useMyTemplates } from '@/features/template-builder/api';
import { translate } from '@/lib/i18n';

type Props = {
  /** null = the system default layout. */
  selected: SavedCustomTemplate | null;
  onSelect: (template: SavedCustomTemplate | null) => void;
  onCreateNew: () => void;
  onEdit: (template: SavedCustomTemplate) => void;
  onManage: () => void;
};

function summary(fields: string[], fallback: string) {
  return fields.slice(0, 3).join(', ') || fallback;
}

export function toSavedTemplate(template: MyTemplateDTO): SavedCustomTemplate {
  return {
    schemaId: template.schemaId,
    templateId: template.id,
    name: template.name,
    frontSummary: summary(template.frontFields, translate('learn.create_topic.layout_front_value')),
    backSummary: summary(template.backFields, translate('learn.create_topic.layout_back_value')),
  };
}

/** "Bố cục thẻ" of a new topic: the default, one of "Mẫu thẻ của tôi", or a new one from Template Builder. */
export function TemplatePicker({ selected, onSelect, onCreateNew, onEdit, onManage }: Props) {
  const surface = useSurface();
  const library = useMyTemplates();
  // A template just made in the builder may not be in the (refetching) list yet: still show it.
  const templates = library.data ?? [];
  const pending = selected && !templates.some(item => item.id === selected.templateId) ? selected : null;

  return (
    <View className="gap-2">
      <Option
        title={translate('learn.create_topic.layout_name')}
        badge={translate('learn.create_topic.layout_badge_default')}
        description={translate('learn.create_topic.layout_desc')}
        selected={!selected}
        onPress={() => onSelect(null)}
        testID="template-option-default"
      />
      {pending && (
        <Option title={pending.name} description={`${pending.frontSummary} · ${pending.backSummary}`} selected onPress={() => {}} testID="template-option-pending" />
      )}
      {templates.map(template => (
        <Option
          key={template.id}
          title={template.name}
          description={translate('learn.create_topic.template_fields', {
            front: summary(template.frontFields, '—'),
            back: summary(template.backFields, '—'),
          })}
          meta={template.usageCount > 0 ? translate('template_builder.library.usage', { count: template.usageCount }) : undefined}
          selected={selected?.templateId === template.id}
          onPress={() => onSelect(toSavedTemplate(template))}
          testID={`template-option-${template.id}`}
        />
      ))}
      {library.isLoading && <ActivityIndicator className="py-2" />}
      {library.isError && (
        <Pressable accessibilityRole="button" onPress={() => void library.refetch()} className="min-h-11 justify-center">
          <Text className="text-sm text-danger-600 dark:text-danger-400" tx="template_builder.library.load_error" />
        </Pressable>
      )}
      <View className="mt-1 flex-row flex-wrap gap-2">
        <Button
          variant="white"
          fullWidth={false}
          label={translate('learn.create_topic.template_new')}
          icon={<SlidersIcon color={surface.textMuted} width={18} height={18} />}
          onPress={onCreateNew}
          className="h-auto min-h-12 px-4 py-3"
          textClassName="shrink text-xs"
          testID="template-create-new"
        />
        {selected && (
          <Button
            variant="white"
            fullWidth={false}
            label={translate('learn.create_topic.template_edit')}
            onPress={() => onEdit(selected)}
            className="h-auto min-h-12 px-4 py-3"
            textClassName="shrink text-xs"
            testID="template-edit-selected"
          />
        )}
        {templates.length > 0 && (
          <Button
            variant="ghost"
            fullWidth={false}
            label={translate('template_builder.library.manage')}
            onPress={onManage}
            className="h-auto min-h-12 p-3"
            textClassName="shrink text-xs"
          />
        )}
      </View>
    </View>
  );
}

function Option({ title, badge, description, meta, selected, onPress, testID }: {
  title: string;
  badge?: string;
  description: string;
  meta?: string;
  selected: boolean;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      testID={testID}
      className={`flex-row items-center gap-3 rounded-2xl border-2 p-3.5 ${selected ? 'border-primary-500 bg-primary-50 dark:bg-primary-400/10' : 'border-line bg-surface'}`}
    >
      <View className="size-10 items-center justify-center rounded-xl bg-success-100/60 dark:bg-emerald-950/80">
        <LayoutGridIcon color="#16A34A" width={20} height={20} />
      </View>
      <View className="flex-1">
        <View className="flex-row flex-wrap items-center gap-1.5">
          <Text numberOfLines={1} className="shrink font-nunito text-sm font-black text-mascot-navy dark:text-white">{title}</Text>
          {badge && (
            <View className="rounded-md bg-success-100 px-1.5 py-0.5 dark:bg-emerald-900/60">
              <Text className="font-inter text-[10px] font-extrabold text-success-700 dark:text-success-400">{badge}</Text>
            </View>
          )}
        </View>
        <Text numberOfLines={2} className="mt-0.5 font-inter text-xs text-neutral-500 dark:text-neutral-400">{description}</Text>
        {meta && <Text className="mt-0.5 font-inter text-[11px] font-semibold text-neutral-400">{meta}</Text>}
      </View>
      {selected && <CheckIcon width={18} height={18} color="#16A34A" />}
    </Pressable>
  );
}
