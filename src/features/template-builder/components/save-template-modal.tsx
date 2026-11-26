import * as React from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, View } from 'react-native';
import { Button, Input, Text } from '@/components/ui';
import { translate } from '@/lib/i18n';

type Props = {
  visible: boolean;
  initialName: string;
  /** Present when the learner owns the template being edited: "Cập nhật mẫu này" is then offered. */
  update?: { usageCount: number };
  saving: 'update' | 'new' | null;
  onUpdate: (name: string) => void;
  onSaveAsNew: (name: string) => void;
  onClose: () => void;
};

const MAX_NAME = 100;

/**
 * "Cập nhật mẫu này" changes every topic showing the template; "Lưu thành mẫu mới" keeps it for them and starts a
 * new one in "Mẫu thẻ của tôi".
 */
export function SaveTemplateModal({ visible, initialName, update, saving, onUpdate, onSaveAsNew, onClose }: Props) {
  const [name, setName] = React.useState(initialName);
  React.useEffect(() => {
    if (visible)
      setName(initialName);
  }, [visible, initialName]);

  const trimmed = name.trim();
  const error = trimmed.length === 0 ? translate('template_builder.save_sheet.name_required') : undefined;
  const busy = saving !== null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={busy ? undefined : onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <Pressable accessibilityRole="button" accessibilityLabel={translate('template_builder.save_sheet.cancel')} onPress={busy ? undefined : onClose} className="flex-1 justify-end bg-black/40">
          <Pressable onPress={() => {}} className="gap-3 rounded-t-3xl bg-surface px-5 pt-5 pb-8">
            <Text className="font-nunito text-lg font-black text-mascot-navy dark:text-white" tx="template_builder.save_sheet.title" />
            <Input
              label={translate('template_builder.save_sheet.name_label')}
              value={name}
              onChangeText={setName}
              maxLength={MAX_NAME}
              editable={!busy}
              error={name.length > 0 ? error : undefined}
              testID="template-name-input"
            />
            {update && (
              <View className="gap-1">
                <Button
                  tx="template_builder.save_sheet.update"
                  onPress={() => onUpdate(trimmed)}
                  loading={saving === 'update'}
                  disabled={!!error || busy}
                  testID="template-save-update"
                />
                <Text className="text-center text-xs text-neutral-500 dark:text-neutral-400">
                  {update.usageCount > 0
                    ? translate('template_builder.save_sheet.update_hint', { count: update.usageCount })
                    : translate('template_builder.save_sheet.update_hint_unused')}
                </Text>
              </View>
            )}
            <View className="gap-1">
              <Button
                tx="template_builder.save_sheet.save_new"
                variant={update ? 'white' : 'primary'}
                onPress={() => onSaveAsNew(trimmed)}
                loading={saving === 'new'}
                disabled={!!error || busy}
                testID="template-save-new"
              />
              <Text className="text-center text-xs text-neutral-500 dark:text-neutral-400" tx="template_builder.save_sheet.save_new_hint" />
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
