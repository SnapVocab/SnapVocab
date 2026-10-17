import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, View } from 'react-native';
import {
  BackButton,
  Button,
  FocusAwareStatusBar,
  Pressable,
  SafeAreaView,
  showErrorMessage,
  showSuccessMessage,
  Text,
} from '@/components/ui';
import { AlertTriangleIcon } from '@/components/ui/icons';
import { useTopicSchema } from '@/features/template-builder/api';
import { useTts } from '@/lib/hooks/use-tts';
import { translate } from '@/lib/i18n';
import { useAddTopicItem } from './api';
import {
  AddWordSkeleton,
  buildAddWordPayload,
  MultipleGroupSection,
  SingleGroupSection,
  useAddWordForm,
  validateAddWordForm,
} from './components/add-word';

export function AddWordScreen() {
  const router = useRouter();
  const { topicId, topicName = '' } = useLocalSearchParams<{
    topicId?: string;
    topicName?: string;
    collectionId?: string;
  }>();

  const numTopicId = topicId ? Number(topicId) : undefined;

  const {
    data: topicSchema,
    isLoading: isSchemaLoading,
    isError: isSchemaError,
    refetch: refetchSchema,
  } = useTopicSchema(numTopicId);

  const { mutate: addTopicItem, isPending: isSubmitting } = useAddTopicItem();
  const { speak } = useTts();

  const {
    formData,
    errors,
    setErrors,
    isLookingUp,
    handleSingleFieldChange,
    handleMultipleFieldChange,
    handleAddInstance,
    handleRemoveInstance,
    handleQuickLookup,
  } = useAddWordForm(topicSchema);

  const handleSubmit = () => {
    if (!numTopicId) {
      showErrorMessage(translate('learn.add_word.missing_topic_id'));
      return;
    }

    if (!topicSchema?.groups) {
      showErrorMessage(translate('learn.add_word.schema_not_ready'));
      return;
    }

    const { hasError, validationErrors } = validateAddWordForm(topicSchema, formData);
    setErrors(validationErrors);

    if (hasError) {
      showErrorMessage(translate('learn.add_word.validation_failed'));
      return;
    }

    const payload = buildAddWordPayload(topicSchema, formData);

    addTopicItem(
      { topicId: numTopicId, data: payload },
      {
        onSuccess: () => {
          showSuccessMessage(translate('learn.add_word.add_success'));
          router.back();
        },
        onError: (err) => {
          const message
            = (err.response?.data as any)?.error
              || (err.response?.data as any)?.message
              || translate('learn.add_word.add_error');
          showErrorMessage(message);
        },
      },
    );
  };

  const sortedGroups = React.useMemo(() => {
    return [...(topicSchema?.groups || [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  }, [topicSchema?.groups]);

  return (
    <SafeAreaView style={{ flex: 1 }} className="flex-1 bg-white dark:bg-neutral-900">
      <FocusAwareStatusBar />

      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-neutral-100 px-4 pt-1 pb-3 dark:border-neutral-800">
        <BackButton onPress={() => router.back()} />

        <View className="flex-1 items-center px-2">
          <Text className="text-center font-nunito text-lg font-black text-mascot-navy dark:text-white">
            {translate('learn.add_word.title')}
          </Text>
          {topicName ? (
            <Text
              numberOfLines={1}
              className="mt-0.5 text-center font-inter text-xs font-semibold text-neutral-400 dark:text-neutral-400"
            >
              {translate('learn.add_word.topic_label', { name: topicName })}
            </Text>
          ) : null}
        </View>

        <View className="size-10" />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={(
            <RefreshControl
              refreshing={isSchemaLoading}
              onRefresh={refetchSchema}
              colors={['#0284C7']}
            />
          )}
        >

          {isSchemaLoading && <AddWordSkeleton />}

          {isSchemaError && (
            <View className="items-center justify-center py-12">
              <AlertTriangleIcon width={40} height={40} color="#EF4444" />
              <Text className="mt-3 font-nunito text-base font-bold text-red-600">
                {translate('learn.add_word.schema_error')}
              </Text>
              <Pressable
                onPress={() => refetchSchema()}
                className="mt-4 rounded-xl bg-primary-600 px-4 py-2"
              >
                <Text className="font-nunito text-sm font-bold text-white">
                  {translate('learn.add_word.retry')}
                </Text>
              </Pressable>
            </View>
          )}

          {!isSchemaLoading && !isSchemaError && (
            <View>
              {sortedGroups.map((group) => {
                if (!group.multiple) {
                  return (
                    <SingleGroupSection
                      key={group.groupId || group.name}
                      group={group}
                      values={formData[group.name] || {}}
                      onChangeField={(fieldName, value) =>
                        handleSingleFieldChange(group.name, fieldName, value)}
                      errors={errors[group.name]}
                      onSpeak={speak}
                      onLookup={handleQuickLookup}
                      isLookupLoading={isLookingUp}
                    />
                  );
                }
                return (
                  <MultipleGroupSection
                    key={group.groupId || group.name}
                    group={group}
                    instances={formData[group.name] || []}
                    onChangeInstanceField={(index, fieldName, value) =>
                      handleMultipleFieldChange({
                        groupName: group.name,
                        index,
                        fieldName,
                        value,
                      })}
                    onAddInstance={() => handleAddInstance(group)}
                    onRemoveInstance={idx => handleRemoveInstance(group.name, idx)}
                    errors={errors[group.name]}
                    onSpeak={speak}
                  />
                );
              })}
            </View>
          )}
        </ScrollView>

        {!isSchemaLoading && !isSchemaError && (
          <View className="border-t border-neutral-100 bg-white px-4 pt-3 pb-4 dark:border-neutral-800 dark:bg-neutral-900">
            <Button
              label={translate('learn.add_word.submit_button')}
              loading={isSubmitting}
              disabled={isSubmitting || isSchemaLoading}
              onPress={handleSubmit}
            />
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default AddWordScreen;
