import type { SchemaAttributeGroupDTO, TopicSchemaDTO } from '@/features/template-builder/types';
import * as React from 'react';
import { showErrorMessage, showSuccessMessage } from '@/components/ui';
import { client } from '@/lib/api';
import { translate } from '@/lib/i18n';
import { initializeFormData } from './add-word-helpers';
import { prefillLookup } from './lookup-prefill';

type MultipleFieldChangeParams = {
  groupName: string;
  index: number;
  fieldName: string;
  value: any;
};

export function useAddWordForm(
  topicSchema?: TopicSchemaDTO,
  existingGroups?: Record<string, any>,
  itemId?: number | string,
) {
  const [formData, setFormData] = React.useState<Record<string, any>>(() =>
    initializeFormData(topicSchema),
  );
  const [errors, setErrors] = React.useState<Record<string, any>>({});
  const [isLookingUp, setIsLookingUp] = React.useState(false);

  const initializedFormKeyRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!topicSchema) {
      return;
    }
    if (itemId !== undefined && !existingGroups) {
      return;
    }

    const formKey = `${topicSchema.topicId}:${itemId ?? 'new'}`;
    if (formKey === initializedFormKeyRef.current) {
      return;
    }
    initializedFormKeyRef.current = formKey;
    setFormData(initializeFormData(topicSchema, existingGroups));
    setErrors({});
  }, [topicSchema, existingGroups, itemId]);

  const handleSingleFieldChange = React.useCallback(
    (groupName: string, fieldName: string, value: any) => {
      setFormData(prev => ({
        ...prev,
        [groupName]: {
          ...(prev[groupName] || {}),
          [fieldName]: value,
        },
      }));

      setErrors((prev) => {
        if (!prev[groupName]?.[fieldName])
          return prev;
        const groupErrors = { ...prev[groupName] };
        delete groupErrors[fieldName];
        return { ...prev, [groupName]: groupErrors };
      });
    },
    [],
  );

  const handleMultipleFieldChange = React.useCallback(
    ({ groupName, index, fieldName, value }: MultipleFieldChangeParams) => {
      setFormData((prev) => {
        const currentList = Array.isArray(prev[groupName]) ? [...prev[groupName]] : [];
        if (!currentList[index]) {
          currentList[index] = {};
        }
        currentList[index] = {
          ...currentList[index],
          [fieldName]: value,
        };
        return {
          ...prev,
          [groupName]: currentList,
        };
      });

      setErrors((prev) => {
        if (!prev[groupName]?.[index]?.[fieldName])
          return prev;
        const groupErrors = { ...(prev[groupName] || {}) };
        const itemErrors = { ...(groupErrors[index] || {}) };
        delete itemErrors[fieldName];
        groupErrors[index] = itemErrors;
        return { ...prev, [groupName]: groupErrors };
      });
    },
    [],
  );

  const handleAddInstance = React.useCallback((group: SchemaAttributeGroupDTO) => {
    setFormData((prev) => {
      const currentList = Array.isArray(prev[group.name]) ? [...prev[group.name]] : [];
      const emptyItem: Record<string, any> = {};
      for (const attr of group.attributes || []) {
        emptyItem[attr.name] = attr.dataType === 'BOOLEAN' ? false : '';
      }
      return {
        ...prev,
        [group.name]: [...currentList, emptyItem],
      };
    });
  }, []);

  const handleRemoveInstance = React.useCallback((groupName: string, index: number) => {
    setFormData((prev) => {
      const currentList = Array.isArray(prev[groupName]) ? [...prev[groupName]] : [];
      currentList.splice(index, 1);
      return {
        ...prev,
        [groupName]: currentList,
      };
    });

    setErrors((prev) => {
      if (!prev[groupName])
        return prev;
      const groupErrors = { ...prev[groupName] };
      delete groupErrors[index];
      return { ...prev, [groupName]: groupErrors };
    });
  }, []);

  const handleQuickLookup = React.useCallback(
    async (wordText: string, wordId?: number) => {
      if (!wordText?.trim() || !topicSchema?.groups)
        return;

      try {
        setIsLookingUp(true);
        const res = await client.get(wordId ? `/api/words/${wordId}` : '/api/words/lookup', {
          params: wordId ? undefined : { q: wordText.trim() },
        });

        const data = res.data?.data;
        if (!data) {
          showErrorMessage(translate('learn.add_word.lookup_not_found'));
          return;
        }

        setFormData(prev => prefillLookup(topicSchema, prev, data));

        showSuccessMessage(translate('learn.add_word.lookup_success'));
      }
      catch {
        showErrorMessage(translate('learn.add_word.lookup_error'));
      }
      finally {
        setIsLookingUp(false);
      }
    },
    [topicSchema],
  );

  return {
    formData,
    errors,
    setErrors,
    isLookingUp,
    handleSingleFieldChange,
    handleMultipleFieldChange,
    handleAddInstance,
    handleRemoveInstance,
    handleQuickLookup,
  };
}
