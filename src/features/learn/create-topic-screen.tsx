import type { Href } from 'expo-router';
import type { CreateTopicFormValues } from './components/topic/create-topic-validation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView as NativeKeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { withUniwind } from 'uniwind';
import {
  BackButton,
  Button,
  FocusAwareStatusBar,
  Input,
  SafeAreaView,
  showErrorMessage,
  showSuccessMessage,
  Text,
} from '@/components/ui';
import { useTemplateBuilderStore } from '@/features/template-builder/use-template-builder-store';
import { apiErrorMessage } from '@/lib/api/error-message';
import { translate } from '@/lib/i18n';
import { useCreateTopic } from './api';
import { createTopicSchema } from './components/topic/create-topic-validation';
import { TemplatePicker } from './components/topic/template-picker';

const KeyboardAvoidingView = withUniwind(NativeKeyboardAvoidingView);

export function CreateTopicScreen() {
  const router = useRouter();
  const {
    collectionId,
    collectionName = '',
    parentId,
  } = useLocalSearchParams<{
    collectionId: string;
    collectionName?: string;
    parentId?: string;
  }>();

  const { mutate: createTopic, isPending } = useCreateTopic();
  const savedCustomTemplate = useTemplateBuilderStore(s => s.savedCustomTemplate);
  const setSavedCustomTemplate = useTemplateBuilderStore(s => s.setSavedCustomTemplate);

  React.useEffect(() => () => {
    setSavedCustomTemplate(null);
  }, [setSavedCustomTemplate]);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm<CreateTopicFormValues>({
    resolver: zodResolver(createTopicSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      translation: '',
      description: '',
    },
  });

  const onSubmit = (values: CreateTopicFormValues) => {
    if (!collectionId) {
      showErrorMessage(translate('learn.create_topic.create_error'));
      return;
    }

    createTopic(
      {
        collectionId,
        data: {
          name: values.name.trim(),
          translation: values.translation?.trim() || undefined,
          description: values.description?.trim() || undefined,
          parentId: parentId ? Number(parentId) : null,
          schemaId: savedCustomTemplate?.schemaId,
          activeTemplateId: savedCustomTemplate?.templateId,
        },
      },
      {
        onSuccess: () => {
          setSavedCustomTemplate(null);
          showSuccessMessage(translate('learn.create_topic.create_success'));
          router.back();
        },
        onError: (error) => {
          showErrorMessage(apiErrorMessage(error, 'learn.create_topic.create_error'));
        },
      },
    );
  };

  const isLoading = isPending || isSubmitting;

  return (
    <SafeAreaView style={{ flex: 1 }} className="flex-1 bg-background">
      <FocusAwareStatusBar />

      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-line px-4 pt-1 pb-3">
        <BackButton onPress={() => router.back()} />

        <View className="flex-1 items-center px-2">
          <Text className="text-center font-nunito text-lg font-black text-mascot-navy dark:text-white">
            {translate('learn.create_topic.title')}
          </Text>
          {collectionName
            ? (
                <Text
                  numberOfLines={1}
                  className="mt-0.5 text-center font-inter text-xs font-semibold text-neutral-400 dark:text-neutral-400"
                >
                  {translate('learn.create_topic.collection_label', { name: collectionName })}
                </Text>
              )
            : null}
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
        >
          {/* Info Banner */}
          <View className="mb-5 rounded-2xl border border-success-100 bg-success-50 p-4 dark:border-emerald-800/40 dark:bg-emerald-950/30">
            <Text className="mb-1 font-nunito text-sm font-black text-success-700 dark:text-success-400">
              {translate('learn.create_topic.banner_title')}
            </Text>
            <Text className="font-inter text-xs/relaxed font-medium text-[#475569] dark:text-neutral-300">
              {translate('learn.create_topic.banner_desc')}
            </Text>
          </View>

          {/* Form Fields */}
          {/* Tên chủ đề * */}
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label={translate('learn.create_topic.name_label')}
                placeholder={translate('learn.create_topic.name_placeholder')}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.name?.message}
              />
            )}
          />

          {/* Bản dịch tiếng Việt */}
          <Controller
            control={control}
            name="translation"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label={translate('learn.create_topic.translation_label')}
                placeholder={translate('learn.create_topic.translation_placeholder')}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.translation?.message}
              />
            )}
          />

          {/* Mô tả ghi chú (Không bắt buộc) */}
          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label={translate('learn.create_topic.description_label')}
                placeholder={translate('learn.create_topic.description_placeholder')}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                multiline
                numberOfLines={3}
                className="h-24 py-3 text-start"
                style={{ textAlignVertical: 'top' }}
                error={errors.description?.message}
              />
            )}
          />

          {/* Bố cục thẻ học */}
          <View className="mt-1 mb-2">
            <Text className="mb-2 font-inter text-sm font-bold text-mascot-navy dark:text-neutral-100">
              {translate('learn.create_topic.layout_section_title')}
            </Text>

            <TemplatePicker
              selected={savedCustomTemplate}
              onSelect={setSavedCustomTemplate}
              onCreateNew={() => router.push({ pathname: '/template-builder', params: { from: 'create-topic' } })}
              onEdit={template => router.push({
                pathname: '/template-builder',
                params: { from: 'create-topic', schemaId: String(template.schemaId), templateId: String(template.templateId) },
              })}
              onManage={() => router.push('/template-library' as Href)}
            />

            <View className="mt-3 rounded-2xl border-2 border-line bg-surface p-4">
              {/* Front / back of the chosen layout */}
              <View className="flex-row gap-2.5">
                <View className="flex-1 rounded-xl bg-neutral-100/90 p-3 dark:bg-neutral-700/60">
                  <Text className="font-inter text-[10px] font-extrabold tracking-wider text-neutral-400 uppercase">
                    {translate('learn.create_topic.layout_front_label')}
                  </Text>
                  <Text className="mt-1 font-inter text-xs font-bold text-mascot-navy dark:text-neutral-100">
                    {savedCustomTemplate?.frontSummary ?? translate('learn.create_topic.layout_front_value')}
                  </Text>
                </View>

                <View className="flex-1 rounded-xl bg-neutral-100/90 p-3 dark:bg-neutral-700/60">
                  <Text className="font-inter text-[10px] font-extrabold tracking-wider text-neutral-400 uppercase">
                    {translate('learn.create_topic.layout_back_label')}
                  </Text>
                  <Text className="mt-1 font-inter text-xs font-bold text-mascot-navy dark:text-neutral-100">
                    {savedCustomTemplate?.backSummary ?? translate('learn.create_topic.layout_back_value')}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Bottom CTA Button */}
        <View className="border-t border-line bg-surface px-4 pt-3 pb-4">
          <Button
            label={translate('learn.create_topic.submit_button')}
            disabled={!isValid || isLoading}
            loading={isLoading}
            onPress={handleSubmit(onSubmit)}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default CreateTopicScreen;
