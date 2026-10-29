import type { SchemaAttributeDTO } from '@/features/template-builder/types';
import * as React from 'react';
import { View } from 'react-native';
import { Image, Input, Pressable, Text } from '@/components/ui';
import colors from '@/components/ui/colors';
import { Volume2Icon } from '@/components/ui/icons';
import { Switch } from '@/components/ui/switch';
import { translate } from '@/lib/i18n';

type Props = {
  attribute: SchemaAttributeDTO;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  onSpeak?: (text: string) => void;
  onLookup?: (text: string) => void;
  isLookupLoading?: boolean;
};

export function DynamicFormField({
  attribute,
  value,
  onChange,
  error,
  onSpeak,
  onLookup: _onLookup,
  isLookupLoading: _isLookupLoading,
}: Props) {
  const isMultiline
    = attribute.name.includes('description')
      || attribute.name.includes('example')
      || attribute.name.includes('definition')
      || attribute.name.includes('note');

  // Render based on data type
  switch (attribute.dataType) {
    case 'NUMBER':
      return (
        <View className="mb-4">
          <Input
            label={`${attribute.label}${attribute.required ? ' *' : ''}`}
            placeholder={`${translate('learn.add_word.enter')} ${attribute.label.toLowerCase()}...`}
            value={value !== undefined && value !== null ? String(value) : ''}
            onChangeText={onChange}
            keyboardType="numeric"
            error={error}
          />
        </View>
      );

    case 'BOOLEAN': {
      const boolValue = Boolean(value === true || value === 'true');
      return (
        <View className="mb-4">
          <View className="flex-row items-center justify-between rounded-2xl border border-line bg-neutral-50/50 p-4 dark:bg-neutral-800/40">
            <View className="mr-3 flex-1">
              <Text className="font-nunito text-sm font-bold text-mascot-navy dark:text-white">
                {attribute.label}
                {attribute.required && <Text className="text-red-500"> *</Text>}
              </Text>
              <Text className="mt-0.5 font-inter text-xs text-neutral-400">
                {boolValue ? translate('learn.add_word.boolean_enabled') : translate('learn.add_word.boolean_disabled')}
              </Text>
            </View>
            <Switch
              value={boolValue}
              onValueChange={onChange}
            />
          </View>
          {error && <Text className="mt-1 font-inter text-xs text-red-500">{error}</Text>}
        </View>
      );
    }

    case 'AUDIO':
      return (
        <View className="mb-4">
          <View className="relative">
            <Input
              label={`${attribute.label}${attribute.required ? ' *' : ''}`}
              placeholder={translate('learn.add_word.audio_placeholder')}
              value={value || ''}
              onChangeText={onChange}
              error={error}
            />
            {onSpeak && value ? (
              <Pressable
                onPress={() => onSpeak(value)}
                hitSlop={8}
                className="absolute top-9 right-3 size-8 items-center justify-center rounded-xl bg-primary-100 active:opacity-70 dark:bg-primary-900/60"

              >
                <Volume2Icon width={16} height={16} color={colors.primary[600]} />
              </Pressable>
            ) : null}
          </View>
        </View>
      );

    case 'IMAGE':
      return (
        <View className="mb-4">
          <Input
            label={`${attribute.label}${attribute.required ? ' *' : ''}`}
            placeholder="https://example.com/image.jpg"
            value={value || ''}
            onChangeText={onChange}
            error={error}
          />
          {value && typeof value === 'string' && value.startsWith('http') ? (
            <View className="mt-2 overflow-hidden rounded-xl border border-line bg-neutral-100 dark:bg-neutral-800">
              <Image
                source={{ uri: value }}
                className="h-36 w-full"
                contentFit="cover"
              />
            </View>
          ) : null}
        </View>
      );

    case 'DATE':
      return (
        <View className="mb-4">
          <Input
            label={`${attribute.label}${attribute.required ? ' *' : ''}`}
            placeholder="YYYY-MM-DD"
            value={value || ''}
            onChangeText={onChange}
            error={error}
          />
        </View>
      );

    case 'TEXT':
    default:
      return (
        <View className="mb-4">
          <View className="relative">
            <Input
              label={`${attribute.label}${attribute.required ? ' *' : ''}`}
              placeholder={`${translate('learn.add_word.enter')} ${attribute.label.toLowerCase()}...`}
              value={value || ''}
              onChangeText={onChange}
              multiline={isMultiline}
              numberOfLines={isMultiline ? 3 : 1}
              className={isMultiline ? 'h-20 py-2.5 text-start' : undefined}
              style={isMultiline ? { textAlignVertical: 'top' } : undefined}
              error={error}
            />
          </View>
        </View>
      );
  }
}
