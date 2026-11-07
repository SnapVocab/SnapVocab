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
import { useSchema, useTopicSchema } from '@/features/template-builder/api';
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
import { withTemplateRoles } from './components/add-word/lookup-prefill';

export function AddWordScreen() {
  const router = useRouter();
  const { topicId, topicName = '', itemId, word, wordId, activeTemplateId, scanRequestId } = useLocalSearchParams<{
    topicId?: string;
    topicName?: string;
    collectionId?: string;
    itemId?: string;
    /** From a scan result: prefilled and looked up once the schema loads. */
    word?: string;
    wordId?: string;
    activeTemplateId?: string;
    scanRequestId?: string;
  }>();

  const numTopicId = topicId ? Number(topicId) : undefined;
  const numItemId = itemId ? Number(itemId) : undefined;
  const isEditing = numItemId !== undefined;

  const {
    data: rawTopicSchema,
    isLoading: isSchemaLoading,
    isError: isSchemaError,
    refetch: refetchSchema,
  } = useTopicSchema(numTopicId);
  const schemaQuery = useSchema(rawTopicSchema?.schemaId);
  const topicSchema = React.useMemo(() => {
    if (!rawTopicSchema)
      return undefined;
    const templates = schemaQuery.data?.templates ?? [];
    const template = activeTemplateId
      ? templates.find(item => item.id === Number(activeTemplateId))
      : templates.find(item => item.isDefault);
    return withTemplateRoles(rawTopicSchema, template);
  }, [rawTopicSchema, schemaQuery.data, activeTemplateId]);

  const {
    data: topicItem,
    isLoading: isItemLoading,
    isError: isItemError,
    refetch: refetchItem,
  } = useTopicItem(numTopicId, numItemId);
  const { mutate: addTopicItem, isPending: isAdding } = useAddTopicItem();
  const { mutate: updateTopicItem, isPending: isUpdating } = useUpdateTopicItem();
  const isSubmitting = isAdding || isUpdating;
  // Only the topic's schema determines whether the form can be used.
  // Template metadata is optional enrichment for dictionary prefilling.
  const isFormLoading = isSchemaLoading || (isEditing && isItemLoading);
  const isFormError = isSchemaError || (isEditing && isItemError);
  const { speak } = useTts();
  const isResolvingPrefill = !!rawTopicSchema?.schemaId && schemaQuery.isPending;
  const canPrefill = !!topicSchema?.groups.some(group => group.attributes.some(attribute =>
    attribute.dataType === 'TEXT' && ['TARGET_WORD', 'PHONETIC', 'DEFINITION', 'NATIVE_TRANSLATION', 'EXAMPLE_SENTENCE'].includes(attribute.semanticRole ?? '')));

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

  const prefilled = React.useRef(false);
  React.useEffect(() => {
    if (!word || prefilled.current || !canPrefill || isResolvingPrefill)
      return;
    prefilled.current = true;
    void handleQuickLookup(word, wordId ? Number(wordId) : undefined);
  }, [word, wordId, canPrefill, isResolvingPrefill, handleQuickLookup]);

  const handleSubmit = () => {
    if (!numTopicId) {
      showErrorMessage(translate('learn.add_word.missing_topic_id'));
      return;
    }

    if (!topicSchema?.groups.length) {
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
      addTopicItem({ topicId: numTopicId, data: payload, scanRequestId }, mutationCallbacks);
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
                void schemaQuery.refetch();
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
                  void schemaQuery.refetch();
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
              {word && (
                <View className="mb-5 gap-3">
                  <Text className="font-nunito text-2xl font-extrabold text-mascot-navy dark:text-white">{word}</Text>
                  {!isResolvingPrefill && <Text className="text-sm text-neutral-600 dark:text-neutral-300" tx={canPrefill ? 'my_words.prefill_hint' : 'my_words.no_mapping'} />}
                  {(canPrefill || isResolvingPrefill) && <Button tx="my_words.prefill_retry" variant="white" loading={isLookingUp || isResolvingPrefill} onPress={() => void handleQuickLookup(word, wordId ? Number(wordId) : undefined)} />}
                </View>
              )}
              {sortedGroups.length === 0 && <Text className="py-6 text-center text-base text-neutral-600 dark:text-neutral-300" tx="my_words.no_schema" />}
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
              disabled={isSubmitting || isFormLoading || isLookingUp || sortedGroups.length === 0}
              onPress={handleSubmit}
            />
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default AddWordScreen;
