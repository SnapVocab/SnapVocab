import type { BuilderSection, SchemaDTO, TopicSchemaDTO } from './types';
import { useNavigation, usePreventRemove } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { showDialog, showErrorMessage, showSuccessMessage } from '@/components/ui';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { translate } from '@/lib/i18n/utils';
import { useCreateTemplate, useForkTopicSchema, useMyTemplates, useSetActiveTemplate, useUpdateTemplate } from './api';
import { builderSectionsToTemplateElements } from './mappers';
import { useTemplateBuilderStore } from './use-template-builder-store';

function summarizeSections(sections: BuilderSection[], fallback: string) {
  return sections
    .flatMap(s => s.fields)
    .map(f => f.fieldLabel)
    .filter(Boolean)
    .slice(0, 3)
    .join(', ') || fallback;
}

type Params = {
  topicId?: number;
  templateId?: number;
  /** The topic being created picks the saved template up from the store. */
  forCreateTopic: boolean;
  fullSchema?: SchemaDTO;
  topicSchema?: TopicSchemaDTO;
  /** Schema the builder shows (the topic's, the template's, or the system default). */
  schemaId?: number;
  /** The template loaded into the builder. */
  loadedTemplate?: { id: number; name: string };
};

/**
 * Saving in Template Builder (template library): "Cập nhật mẫu này" rewrites the learner's own template for every
 * topic using it; "Lưu thành mẫu mới" adds one to "Mẫu thẻ của tôi" and leaves the current one alone.
 */
export function useSaveTemplate({ topicId, templateId, forCreateTopic, fullSchema, topicSchema, schemaId, loadedTemplate }: Params) {
  const router = useRouter();
  const userId = useAuthStore(s => s.user?.id);
  const frontSections = useTemplateBuilderStore(s => s.frontSections);
  const backSections = useTemplateBuilderStore(s => s.backSections);
  const isDirty = useTemplateBuilderStore(s => s.isDirty);
  const setSavedCustomTemplate = useTemplateBuilderStore(s => s.setSavedCustomTemplate);
  const markSaved = useTemplateBuilderStore(s => s.markSaved);

  const forkMutation = useForkTopicSchema();
  const createTemplateMutation = useCreateTemplate();
  const updateTemplateMutation = useUpdateTemplate();
  const setActiveTemplateMutation = useSetActiveTemplate();

  // "Cập nhật mẫu này" only for a template of the learner's own schema; a system one is saved as new.
  const ownsSchema = !!fullSchema && !fullSchema.isSystem && fullSchema.userId != null && fullSchema.userId === userId;
  const editingOwnTemplate = ownsSchema && templateId !== undefined && loadedTemplate?.id === templateId;
  const myTemplates = useMyTemplates(editingOwnTemplate);
  const usageCount = myTemplates.data?.find(item => item.id === templateId)?.usageCount ?? 0;
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState<'update' | 'new' | null>(null);
  const navigation = useNavigation();
  // Set right before leaving after a save: the store is clean by then, but this render still sees it dirty.
  const leaving = React.useRef(false);

  // Back (header, gesture or hardware) with an unsaved layout asks before throwing the edits away.
  usePreventRemove(isDirty, ({ data }) => {
    if (leaving.current) {
      navigation.dispatch(data.action);
      return;
    }
    showDialog({ title: translate('learn.add_word.discard_title'), message: translate('template_builder.discard_body'), buttons: [
      { text: translate('template_builder.keep_editing'), style: 'cancel' },
      { text: translate('learn.add_word.discard'), style: 'destructive', onPress: () => navigation.dispatch(data.action) },
    ] });
  });

  const elements = () => builderSectionsToTemplateElements(frontSections, backSections);

  const start = () => {
    if (!isDirty || elements().length === 0) {
      router.back();
      return;
    }
    setOpen(true);
  };

  const offerToCreateTopic = (saved: { schemaId: number; id: number; name: string }) => {
    if (!forCreateTopic)
      return;
    setSavedCustomTemplate({
      schemaId: saved.schemaId,
      templateId: saved.id,
      name: saved.name,
      frontSummary: summarizeSections(frontSections, translate('learn.create_topic.layout_front_value')),
      backSummary: summarizeSections(backSections, translate('learn.create_topic.layout_back_value')),
    });
  };

  const finish = (messageTx: 'template_builder.save_sheet.updated' | 'template_builder.save_sheet.created') => {
    markSaved();
    setOpen(false);
    showSuccessMessage(translate(messageTx));
    leaving.current = true;
    router.back();
  };

  const fail = (error: any) => {
    const code = error?.response?.data?.error;
    showErrorMessage(translate(code === 'TEMPLATE_IN_USE' ? 'template_builder.library.in_use' : 'template_builder.save_sheet.error'));
  };

  const update = async (name: string) => {
    if (!fullSchema || templateId === undefined)
      return;
    setSaving('update');
    try {
      const updated = await updateTemplateMutation.mutateAsync({ schemaId: fullSchema.id, templateId, name, elements: elements() });
      offerToCreateTopic(updated);
      finish('template_builder.save_sheet.updated');
    }
    catch (error) {
      fail(error);
    }
    finally {
      setSaving(null);
    }
  };

  const saveAsNew = async (name: string) => {
    setSaving('new');
    try {
      let targetSchemaId = schemaId;
      // A topic's layout must live on the topic's schema: a shared one is forked for this topic first.
      if (topicId && topicSchema?.shared) {
        const forked = await forkMutation.mutateAsync({ topicId });
        targetSchemaId = forked.schemaId;
      }
      if (!targetSchemaId) {
        showErrorMessage(translate('template_builder.save_sheet.error'));
        return;
      }
      // A system schema lands in the learner's single personal copy of it (server side).
      const created = await createTemplateMutation.mutateAsync({ schemaId: targetSchemaId, name, elements: elements() });
      if (topicId)
        await setActiveTemplateMutation.mutateAsync({ topicId, templateId: created.id });
      offerToCreateTopic(created);
      finish('template_builder.save_sheet.created');
    }
    catch (error) {
      fail(error);
    }
    finally {
      setSaving(null);
    }
  };

  return {
    start,
    saving,
    modal: {
      visible: open,
      initialName: editingOwnTemplate ? loadedTemplate?.name ?? '' : '',
      update: editingOwnTemplate ? { usageCount } : undefined,
      saving,
      onUpdate: (name: string) => void update(name),
      onSaveAsNew: (name: string) => void saveAsNew(name),
      onClose: () => setOpen(false),
    },
  };
}
