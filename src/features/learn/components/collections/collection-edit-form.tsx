import type { Collection } from '../../types';
import type { CollectionFormValues } from './validation';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { zodResolver } from '@hookform/resolvers/zod';
import * as React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';
import { Button, Input, showErrorMessage, Text } from '@/components/ui';
import { translate } from '@/lib/i18n';
import { useUpdateCollection } from '../../api';
import { collectionFormSchema } from './validation';

type Props = {
  collection: Collection;
  onSuccess: (updatedCollection: Collection) => void;
  onCancel: () => void;
};

export function CollectionEditForm({ collection, onSuccess, onCancel }: Props) {
  const { mutate: updateCollection, isPending } = useUpdateCollection();

  const {
    control,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm<CollectionFormValues>({
    resolver: zodResolver(collectionFormSchema),
    mode: 'onChange',
    defaultValues: {
      name: collection.name,
      translation: collection.translation ?? '',
    },
  });

  const onSubmit = (values: CollectionFormValues) => {
    updateCollection(
      {
        id: collection.id,
        data: {
          name: values.name.trim(),
          translation: values.translation?.trim(),
        },
      },
      {
        onSuccess: (updatedData) => {
          onSuccess(updatedData);
        },
        onError: (error) => {
          const message = error.response?.data?.error || translate('learn.collections.update_error');
          showErrorMessage(message);
        },
      },
    );
  };

  const isLoading = isPending || isSubmitting;

  return (
    <View className="gap-3 pt-1">
      <Text className="mb-1 text-center font-nunito text-lg font-extrabold text-mascot-navy dark:text-white">
        {translate('learn.collections.edit_title')}
      </Text>

      {/* Tên bộ sưu tập (*) */}
      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            inputComponent={BottomSheetTextInput}
            label={translate('learn.collections.name_label')}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder={translate('learn.collections.name_placeholder')}
            error={errors.name?.message}
          />
        )}
      />

      {/* Mô tả */}
      <Controller
        control={control}
        name="translation"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            inputComponent={BottomSheetTextInput}
            label={translate('learn.collections.description_label')}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder={translate('learn.collections.description_placeholder')}
            error={errors.translation?.message}
          />
        )}
      />

      <View className="mt-2 flex-row gap-3">
        <Button
          variant="white"
          label={translate('learn.collections.cancel')}
          disabled={isLoading}
          onPress={onCancel}
          className="flex-1"
        />
        <Button
          variant="primary"
          label={translate('learn.collections.save')}
          disabled={!isValid || isLoading}
          loading={isLoading}
          onPress={handleSubmit(onSubmit)}
          className="flex-1"
        />
      </View>
    </View>
  );
}
