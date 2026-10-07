import type { SchemaAttributeGroupDTO, TopicSchemaDTO } from '@/features/template-builder/types';
import * as React from 'react';
import { showErrorMessage, showSuccessMessage } from '@/components/ui';
import { client } from '@/lib/api';
import { translate } from '@/lib/i18n';
import { initializeFormData } from './add-word-helpers';

type MultipleFieldChangeParams = {
  groupName: string;
  index: number;
  fieldName: string;
  value: any;
};

export function useAddWordForm(topicSchema?: TopicSchemaDTO) {
  const [formData, setFormData] = React.useState<Record<string, any>>(() =>
    initializeFormData(topicSchema),
  );
  const [errors, setErrors] = React.useState<Record<string, any>>({});
  const [isLookingUp, setIsLookingUp] = React.useState(false);

  const prevSchemaIdRef = React.useRef<number | undefined>(topicSchema?.topicId);

  React.useEffect(() => {
    if (topicSchema && topicSchema.topicId !== prevSchemaIdRef.current) {
      prevSchemaIdRef.current = topicSchema.topicId;
      setFormData(initializeFormData(topicSchema));
    }
  }, [topicSchema]);

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
    async (wordText: string) => {
      if (!wordText?.trim() || !topicSchema?.groups)
        return;

      try {
        setIsLookingUp(true);
        const res = await client.get('/api/words/lookup', {
          params: { q: wordText.trim() },
        });

        const data = res.data?.data;
        if (!data) {
          showErrorMessage(translate('learn.add_word.lookup_not_found'));
          return;
        }

        const ipa = data.pronunciations?.[0]?.ipa || '';
        const meaningsList = data.meanings || [];
        const translationsList = data.translations || [];
        const nativeTranslation = translationsList.find((t: { translation?: string }) => t.translation?.trim())?.translation?.trim() || '';

        setFormData((prev) => {
          const updated: Record<string, any> = { ...prev };

          for (const group of topicSchema.groups) {
            if (!group.multiple) {
              const currentGroup = { ...(updated[group.name] || {}) };
              for (const attr of group.attributes || []) {
                if (group.name === 'main' && attr.name === 'translation' && nativeTranslation && !String(currentGroup[attr.name] ?? '').trim()) {
                  currentGroup[attr.name] = nativeTranslation;
                }
                if (
                  (attr.name === 'phonetic' || attr.name === 'ipa')
                  && ipa
                  && !currentGroup[attr.name]
                ) {
                  currentGroup[attr.name] = ipa;
                }
              }
              updated[group.name] = currentGroup;
            }
            else if (
              group.name.includes('meaning')
              || group.name.includes('definition')
              || group.name.includes('nghia')
            ) {
              const newItems: Record<string, any>[] = [];

              if (meaningsList.length > 0) {
                for (const m of meaningsList.slice(0, 3)) {
                  const item: Record<string, any> = {};
                  for (const attr of group.attributes || []) {
                    if (attr.name.includes('def') || attr.name.includes('meaning')) {
                      item[attr.name] = m.definition || '';
                    }
                    else if (attr.name.includes('example')) {
                      item[attr.name] = m.example || '';
                    }
                    else if (attr.name.includes('pos') || attr.name.includes('part')) {
                      item[attr.name] = m.pos || '';
                    }
                    else {
                      item[attr.name] = '';
                    }
                  }
                  newItems.push(item);
                }
              }
              else if (translationsList.length > 0) {
                for (const t of translationsList.slice(0, 3)) {
                  const item: Record<string, any> = {};
                  for (const attr of group.attributes || []) {
                    if (
                      attr.name.includes('meaning')
                      || attr.name.includes('translation')
                      || attr.name.includes('def')
                    ) {
                      item[attr.name] = t.translation || '';
                    }
                    else {
                      item[attr.name] = '';
                    }
                  }
                  newItems.push(item);
                }
              }

              if (newItems.length > 0) {
                updated[group.name] = newItems;
              }
            }
          }

          return updated;
        });

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
