import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { withUniwind } from 'uniwind';
import { z } from 'zod';
import { BackButton, Button, FocusAwareStatusBar, Input, SafeAreaView, showErrorMessage, showSuccessMessage, Text, View } from '@/components/ui';
import { translate } from '@/lib/i18n';
import { useCollectionStudySettings, useSaveCollectionStudySettings } from './api';

const StyledSafeAreaView = withUniwind(SafeAreaView);
const StyledKeyboardAvoidingView = withUniwind(KeyboardAvoidingView);

function limitSchema(max: number) {
  return z.string().trim().regex(/^\d+$/, translate('study_limits.whole_number')).refine(value => Number(value) <= max, translate('study_limits.maximum', { count: max })).transform(Number);
}

export function CollectionStudySettingsScreen() {
  const { collectionId, name } = useLocalSearchParams<{ collectionId: string; name?: string }>();
  const id = Number(collectionId);
  const router = useRouter();
  const settings = useCollectionStudySettings(id);
  const save = useSaveCollectionStudySettings(id);
  const initialized = useRef<number | null>(null);
  const schema = z.object({ newCardsPerDay: limitSchema(9999), reviewCardsPerDay: limitSchema(99999) });
  const { control, reset, handleSubmit } = useForm<z.input<typeof schema>, unknown, z.output<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { newCardsPerDay: '20', reviewCardsPerDay: '200' },
  });
  useEffect(() => {
    if (settings.data && initialized.current !== id) {
      reset({ newCardsPerDay: String(settings.data.newCardsPerDay), reviewCardsPerDay: String(settings.data.reviewCardsPerDay) });
      initialized.current = id;
    }
  }, [id, settings.data, reset]);

  const persist = (values: z.output<typeof schema> | null) => save.mutate(values, {
    onSuccess: () => {
      showSuccessMessage(translate('study_limits.saved'));
      router.back();
    },
    onError: () => showErrorMessage(translate('study_limits.save_error')),
  });

  return (
    <StyledSafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <FocusAwareStatusBar />
      <View className="flex-row items-center gap-3 border-b border-line px-4 py-3">
        <BackButton onPress={() => router.back()} />
        <View className="flex-1">
          <Text className="font-nunito text-xl font-black text-mascot-navy dark:text-white" tx="study_limits.title" />
          {!!name && <Text numberOfLines={1} className="text-sm text-neutral-600 dark:text-neutral-300">{name}</Text>}
        </View>
      </View>
      {settings.isPending && id > 0
        ? <View className="flex-1 items-center justify-center"><ActivityIndicator /></View>
        : settings.isError || !settings.data
          ? (
              <View className="flex-1 justify-center gap-4 px-5">
                <Text className="text-center text-base" tx="study_limits.load_error" />
                <Button tx="study_limits.retry" onPress={() => void settings.refetch()} />
              </View>
            )
          : (
              <StyledKeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView className="flex-1" contentContainerClassName="w-full max-w-2xl self-center gap-5 px-5 py-6" keyboardShouldPersistTaps="handled">
                  <Text className="text-base/6 text-neutral-600 dark:text-neutral-300" tx="study_limits.description" />
                  <Controller
                    control={control}
                    name="newCardsPerDay"
                    render={({ field, fieldState }) => (
                      <Input
                        label={translate('study_limits.new_limit')}
                        accessibilityLabel={translate('study_limits.new_limit')}
                        editable={!save.isPending}
                        selectTextOnFocus
                        keyboardType="number-pad"
                        value={field.value}
                        onChangeText={field.onChange}
                        onBlur={field.onBlur}
                        error={fieldState.error?.message}
                        testID="collection-new-limit"
                        maxLength={5}
                      />
                    )}
                  />
                  <Controller
                    control={control}
                    name="reviewCardsPerDay"
                    render={({ field, fieldState }) => (
                      <Input
                        label={translate('study_limits.review_limit')}
                        accessibilityLabel={translate('study_limits.review_limit')}
                        editable={!save.isPending}
                        selectTextOnFocus
                        keyboardType="number-pad"
                        value={field.value}
                        onChangeText={field.onChange}
                        onBlur={field.onBlur}
                        error={fieldState.error?.message}
                        testID="collection-review-limit"
                        maxLength={6}
                      />
                    )}
                  />
                  <Text className="text-sm/5 text-neutral-600 dark:text-neutral-300" tx="study_limits.hint" />
                  <Text className="text-sm/5 text-neutral-600 dark:text-neutral-300" tx="study_limits.learning_hint" />
                  <Button tx="study_limits.save" onPress={handleSubmit(values => persist(values))} loading={save.isPending} testID="collection-limits-save" />
                  <Button
                    tx="study_limits.reset"
                    variant="white"
                    onPress={() => persist(null)}
                    disabled={!settings.data.customized || save.isPending}
                    testID="collection-limits-reset"
                  />
                </ScrollView>
              </StyledKeyboardAvoidingView>
            )}
    </StyledSafeAreaView>
  );
}
