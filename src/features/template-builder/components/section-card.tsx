import type { BuilderField, BuilderSection, CardSide } from '../types';
import * as React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { PlusIcon, SettingsIcon } from '@/components/ui/icons';
import { Text } from '@/components/ui/text';
import { FieldItemCard } from './field-item-card';

type SectionCardProps = {
  section: BuilderSection;
  side: CardSide;
  onSectionSettingsPress: (section: BuilderSection) => void;
  onFieldPress: (field: BuilderField, sectionId: string) => void;
  onAddFieldPress: (sectionId: string, column?: 1 | 2) => void;
};

export function SectionCard({
  section,
  side,
  onSectionSettingsPress,
  onFieldPress,
  onAddFieldPress,
}: SectionCardProps) {
  const isTwoColumns = section.columns === 2;
  const col1Fields = isTwoColumns ? section.fields.filter(f => f.column === 1) : section.fields;
  const col2Fields = isTwoColumns ? section.fields.filter(f => f.column === 2) : [];

  return (
    <View className="mb-4 rounded-2xl border-2 border-line bg-white p-4 shadow-sm dark:bg-neutral-800/90">
      {/* Section Header */}
      <View className="flex-row items-center justify-between border-b border-line pb-3">
        <View className="flex-1 flex-row items-center">
          <Text
            className="font-nunito text-base font-black text-mascot-navy dark:text-white"
            numberOfLines={1}
          >
            {section.name}
          </Text>

          {section.repeatable && (
            <View className="ml-2 rounded-md bg-purple-100 px-2 py-0.5 dark:bg-purple-950/50">
              <Text
                tx="template_builder.repeatable_badge"
                className="font-inter text-[10px] font-extrabold text-purple-700 dark:text-purple-300"
              />
            </View>
          )}

          <View className="ml-2 rounded-md bg-neutral-100 px-1.5 py-0.5 dark:bg-neutral-700">
            <Text
              tx={isTwoColumns ? 'template_builder.two_column_badge' : 'template_builder.one_column_badge'}
              className="font-inter text-[10px] font-semibold text-neutral-500 dark:text-neutral-400"
            />
          </View>
        </View>

        <TouchableOpacity
          onPress={() => onSectionSettingsPress(section)}
          className="size-8 items-center justify-center rounded-xl bg-neutral-100 active:opacity-70 dark:bg-neutral-700"
          activeOpacity={0.7}
        >
          <SettingsIcon color="#6B7280" width={16} height={16} />
        </TouchableOpacity>
      </View>

      {/* Section Fields Area */}
      <View className="mt-3">
        {isTwoColumns ? (
          <View className="flex-row gap-3">
            {/* Column 1 */}
            <View className="flex-1">
              <Text
                tx="template_builder.col1_left"
                className="mb-2 font-inter text-[11px] font-extrabold tracking-wider text-neutral-400 uppercase"
              />
              <View className="gap-2">
                {col1Fields.map(field => (
                  <FieldItemCard
                    key={field.id}
                    field={field}
                    sectionId={section.id}
                    side={side}
                    onPress={() => onFieldPress(field, section.id)}
                    isCompact
                  />
                ))}
              </View>
              <TouchableOpacity
                onPress={() => onAddFieldPress(section.id, 1)}
                className="mt-2 flex-row items-center justify-center rounded-xl border border-dashed border-edge py-2.5 active:opacity-70"
                activeOpacity={0.7}
              >
                <PlusIcon color="#9CA3AF" width={14} height={14} />
                <Text
                  tx="template_builder.add_to_col1"
                  className="ml-1 font-inter text-[11px] font-bold text-neutral-500 dark:text-neutral-400"
                />
              </TouchableOpacity>
            </View>

            {/* Column 2 */}
            <View className="flex-1">
              <Text
                tx="template_builder.col2_right"
                className="mb-2 font-inter text-[11px] font-extrabold tracking-wider text-neutral-400 uppercase"
              />
              <View className="gap-2">
                {col2Fields.map(field => (
                  <FieldItemCard
                    key={field.id}
                    field={field}
                    sectionId={section.id}
                    side={side}
                    onPress={() => onFieldPress(field, section.id)}
                    isCompact
                  />
                ))}
              </View>
              <TouchableOpacity
                onPress={() => onAddFieldPress(section.id, 2)}
                className="mt-2 flex-row items-center justify-center rounded-xl border border-dashed border-edge py-2.5 active:opacity-70"
                activeOpacity={0.7}
              >
                <PlusIcon color="#9CA3AF" width={14} height={14} />
                <Text
                  tx="template_builder.add_to_col2"
                  className="ml-1 font-inter text-[11px] font-bold text-neutral-500 dark:text-neutral-400"
                />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View className="gap-2">
            {col1Fields.map(field => (
              <FieldItemCard
                key={field.id}
                field={field}
                sectionId={section.id}
                side={side}
                onPress={() => onFieldPress(field, section.id)}
              />
            ))}
            <TouchableOpacity
              onPress={() => onAddFieldPress(section.id, 1)}
              className="mt-1 flex-row items-center justify-center rounded-xl border border-dashed border-emerald-500/40 bg-emerald-50/50 py-3 active:opacity-70 dark:border-emerald-700/50 dark:bg-emerald-950/30"
              activeOpacity={0.7}
            >
              <PlusIcon color="#16A34A" width={16} height={16} />
              <Text
                tx="template_builder.add_field_to_section"
                className="ml-1.5 font-inter text-xs font-black text-emerald-600 dark:text-emerald-400"
              />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}
