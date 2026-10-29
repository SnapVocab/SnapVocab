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
import { useAddTopicItem, useTopicItem, useUpdateTopicItem } from './api';
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
  const { topicId, topicName = '', itemId } = useLocalSearchParams<{
    topicId?: string;
    topicName?: string;
    collectionId?: string;
    itemId?: string;
  }>();

  const numTopicId = topicId ? Number(topicId) : undefined;
  const numItemId = itemId ? Number(itemId) : undefined;
  const isEditing = numItemId !== undefined;

  const {
    data: topicSchema,
    isLoading: isSchemaLoading,
    isError: isSchemaError,
    refetch: refetchSchema,
  } = useTopicSchema(numTopicId);

  const {
    data: topicItem,
    isLoading: isItemLoading,
    isError: isItemError,
    refetch: refetchItem,
  } = useTopicItem(numTopicId, numItemId);
  const { mutate: addTopicItem, isPending: isAdding } = useAddTopicItem();
  const { mutate: updateTopicItem, isPending: isUpdating } = useUpdateTopicItem();
  const isSubmitting = isAdding || isUpdating;
  const isFormLoading = isSchemaLoading || (isEditing && isItemLoading);
  const isFormError = isSchemaError || (isEditing && isItemError);
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
  } = useAddWordForm(topicSchema, topicItem?.groups, numItemId);

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

    const mutationCallbacks = {
      onSuccess: () => {
        showSuccessMessage(translate(isEditing
          ? 'learn.add_word.update_success'
          : 'learn.add_word.add_success'));
        router.back();
      },
      onError: (err: any) => {
        const message
          = (err.response?.data as any)?.error
            || (err.response?.data as any)?.message
            || translate(isEditing
              ? 'learn.add_word.update_error'
              : 'learn.add_word.add_error');
        showErrorMessage(message);
      },
    };

    if (isEditing && numItemId !== undefined) {
      updateTopicItem({ topicId: numTopicId, itemId: numItemId, data: payload }, mutationCallbacks);
    }
    else {
      addTopicItem({ topicId: numTopicId, data: payload }, mutationCallbacks);
    }
  };

  const sortedGroups = React.useMemo(() => {
    return [...(topicSchema?.groups || [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  }, [topicSchema?.groups]);

  return (
    <SafeAreaView style={{ flex: 1 }} className="flex-1 bg-background">
      <FocusAwareStatusBar />

      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-line px-4 pt-1 pb-3">
        <BackButton onPress={() => router.back()} />

        <View className="flex-1 items-center px-2">
          <Text className="text-center font-nunito text-lg font-black text-mascot-navy dark:text-white">
            {translate(isEditing ? 'learn.add_word.edit_title' : 'learn.add_word.title')}
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
              refreshing={isFormLoading}
              onRefresh={() => {
                refetchSchema();
                if (isEditing) {
                  refetchItem();
                }
              }}
              colors={['#0284C7']}
            />
          )}
        >

          {isFormLoading && <AddWordSkeleton />}

          {isFormError && (
            <View className="items-center justify-center py-12">
              <AlertTriangleIcon width={40} height={40} color="#EF4444" />
              <Text className="mt-3 font-nunito text-base font-bold text-red-600">
                {translate('learn.add_word.schema_error')}
              </Text>
              <Pressable
                onPress={() => {
                  refetchSchema();
                  if (isEditing) {
                    refetchItem();
                  }
                }}
                className="mt-4 rounded-xl bg-primary-600 px-4 py-2"
              >
                <Text className="font-nunito text-sm font-bold text-white">
                  {translate('learn.add_word.retry')}
                </Text>
              </Pressable>
            </View>
          )}

          {!isFormLoading && !isFormError && (
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

        {!isFormLoading && !isFormError && (
          <View className="border-t border-line bg-surface px-4 pt-3 pb-4">
            <Button
              label={translate(isEditing
                ? 'learn.add_word.update_button'
                : 'learn.add_word.submit_button')}
              loading={isSubmitting}
              disabled={isSubmitting || isFormLoading}
              onPress={handleSubmit}
            />
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default AddWordScreen;
