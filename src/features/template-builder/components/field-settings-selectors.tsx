import type { Alignment, FontSize, SemanticRole } from '../types';
import * as React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { COLOR_PALETTE, DEFAULT_SEMANTIC_ROLES } from '../types';

export { DataTypeSelector, ToggleSection } from './field-settings-schema-selectors';

export function RoleSelector({
  role,
  onSelect,
}: {
  role: SemanticRole | null;
  onSelect: (r: SemanticRole) => void;
}) {
  return (
    <View className="mb-4">
      <Text
        tx="template_builder.field_settings.semantic_role"
        className="mb-1.5 font-inter text-xs font-bold text-neutral-600 uppercase dark:text-neutral-300"
      />
      <View className="flex-row flex-wrap gap-2">
        {DEFAULT_SEMANTIC_ROLES.map(r => (
          <TouchableOpacity
            key={r.role}
            onPress={() => onSelect(r.role)}
            className={`rounded-xl border px-3 py-2 ${
              role === r.role
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40'
                : 'border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800'
            }`}
          >
            <Text
              className={`font-inter text-xs font-semibold ${
                role === r.role
                  ? 'font-bold text-emerald-600 dark:text-emerald-400'
                  : 'text-neutral-700 dark:text-neutral-300'
              }`}
            >
              {r.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export function ColumnSelector({
  column,
  onSelect,
}: {
  column: 1 | 2;
  onSelect: (c: 1 | 2) => void;
}) {
  return (
    <View className="mb-4">
      <Text
        tx="template_builder.field_settings.column_position"
        className="mb-1.5 font-inter text-xs font-bold text-neutral-600 uppercase dark:text-neutral-300"
      />
      <View className="flex-row gap-2">
        <TouchableOpacity
          onPress={() => onSelect(1)}
          className={`flex-1 items-center rounded-xl border py-2.5 ${
            column === 1
              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40'
              : 'border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800'
          }`}
        >
          <Text
            tx="template_builder.col1_left"
            className={`font-inter text-xs font-bold ${
              column === 1 ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-700 dark:text-neutral-300'
            }`}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onSelect(2)}
          className={`flex-1 items-center rounded-xl border py-2.5 ${
            column === 2
              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40'
              : 'border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800'
          }`}
        >
          <Text
            tx="template_builder.col2_right"
            className={`font-inter text-xs font-bold ${
              column === 2 ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-700 dark:text-neutral-300'
            }`}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function FontSizeSelector({
  fontSize,
  onSelect,
}: {
  fontSize: FontSize;
  onSelect: (s: FontSize) => void;
}) {
  const sizes: FontSize[] = ['S', 'M', 'L', 'XL'];
  return (
    <View className="mb-4">
      <Text
        tx="template_builder.field_settings.font_size"
        className="mb-1.5 font-inter text-xs font-bold text-neutral-600 uppercase dark:text-neutral-300"
      />
      <View className="flex-row gap-2">
        {sizes.map(size => (
          <TouchableOpacity
            key={size}
            onPress={() => onSelect(size)}
            className={`flex-1 items-center rounded-xl border py-2.5 ${
              fontSize === size
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40'
                : 'border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800'
            }`}
          >
            <Text
              className={`font-inter text-xs font-bold ${
                fontSize === size ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-700 dark:text-neutral-300'
              }`}
            >
              {size}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export function AlignmentSelector({
  alignment,
  onSelect,
}: {
  alignment: Alignment;
  onSelect: (a: Alignment) => void;
}) {
  const alignments: { key: Alignment; labelKey: 'template_builder.align_left' | 'template_builder.align_center' | 'template_builder.align_right' }[] = [
    { key: 'LEFT', labelKey: 'template_builder.align_left' },
    { key: 'CENTER', labelKey: 'template_builder.align_center' },
    { key: 'RIGHT', labelKey: 'template_builder.align_right' },
  ];
  return (
    <View className="mb-4">
      <Text
        tx="template_builder.field_settings.text_alignment"
        className="mb-1.5 font-inter text-xs font-bold text-neutral-600 uppercase dark:text-neutral-300"
      />
      <View className="flex-row gap-2">
        {alignments.map(item => (
          <TouchableOpacity
            key={item.key}
            onPress={() => onSelect(item.key)}
            className={`flex-1 items-center rounded-xl border py-2.5 ${
              alignment === item.key
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40'
                : 'border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800'
            }`}
          >
            <Text
              tx={item.labelKey}
              className={`font-inter text-xs font-bold ${
                alignment === item.key
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-neutral-700 dark:text-neutral-300'
              }`}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export function ColorPicker({
  color,
  onSelect,
}: {
  color: string;
  onSelect: (c: string) => void;
}) {
  return (
    <View className="mb-6">
      <Text
        tx="template_builder.field_settings.text_color"
        className="mb-2 font-inter text-xs font-bold text-neutral-600 uppercase dark:text-neutral-300"
      />
      <View className="flex-row flex-wrap gap-3">
        {COLOR_PALETTE.map(c => (
          <TouchableOpacity
            key={c.hex}
            onPress={() => onSelect(c.hex)}
            className={`size-9 items-center justify-center rounded-full border-2 ${
              color === c.hex
                ? 'scale-110 border-emerald-500'
                : 'border-transparent'
            }`}
            style={{ backgroundColor: c.hex }}
          />
        ))}
      </View>
    </View>
  );
}
