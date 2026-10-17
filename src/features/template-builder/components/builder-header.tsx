import { useRouter } from 'expo-router';
import * as React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { BackButton } from '@/components/ui';
import { EyeIcon } from '@/components/ui/icons';
import { Text } from '@/components/ui/text';
import { translate } from '@/lib/i18n/utils';
import { useTemplateBuilderStore } from '../use-template-builder-store';

type BuilderHeaderProps = {
  templateName?: string;
  onPreviewPress: () => void;
  onSavePress?: () => void;
};

export function BuilderHeader({
  templateName,
  onPreviewPress,
}: BuilderHeaderProps) {
  const router = useRouter();
  const isDirty = useTemplateBuilderStore(s => s.isDirty);
  const displayName = templateName ?? translate('template_builder.default_template_name');

  return (
    <View className="flex-row items-center justify-between border-b border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900">
      <View className="flex-row items-center">
        <BackButton onPress={() => router.back()} />

        <View className="ml-3">
          <View className="flex-row items-center">
            <Text
              tx="template_builder.header_title"
              className="font-nunito text-base font-black text-mascot-navy dark:text-white"
            />
            {isDirty && (
              <View className="ml-2 size-2 rounded-full bg-amber-500" />
            )}
          </View>
          <Text className="font-inter text-xs font-semibold text-neutral-400 dark:text-neutral-400">
            {displayName}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={onPreviewPress}
        className="flex-row items-center rounded-xl border border-emerald-500/30 bg-emerald-50 px-3.5 py-2 active:opacity-80 dark:border-emerald-700/50 dark:bg-emerald-950/40"
      >
        <EyeIcon color="#16A34A" width={16} height={16} />
        <Text
          tx="template_builder.preview"
          className="ml-1.5 font-inter text-xs font-bold text-emerald-600 dark:text-emerald-400"
        />
      </TouchableOpacity>
    </View>
  );
}
