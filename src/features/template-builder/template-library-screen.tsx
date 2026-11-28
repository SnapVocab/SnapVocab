import type { MyTemplateDTO } from './api';
import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, RefreshControl } from 'react-native';
import { Button, FocusAwareStatusBar, Mascot, Pressable, SafeAreaView, ScreenHeader, showDialog, showErrorMessage, showSuccessMessage, Text, View } from '@/components/ui';
import { LayoutGridIcon, TrashIcon } from '@/components/ui/icons';
import { translate } from '@/lib/i18n';
import { useDeleteTemplate, useMyTemplates } from './api';

const screenStyle = { flex: 1 };

/** "Mẫu thẻ của tôi": the card layouts the learner built, reusable for any new topic. */
export function TemplateLibraryScreen() {
  const router = useRouter();
  const library = useMyTemplates();
  const remove = useDeleteTemplate();

  const edit = (template: MyTemplateDTO) => router.push({
    pathname: '/template-builder',
    params: { schemaId: String(template.schemaId), templateId: String(template.id) },
  });

  const confirmDelete = (template: MyTemplateDTO) => showDialog({
    title: translate('template_builder.library.delete_title'),
    message: translate('template_builder.library.delete_body', { name: template.name }),
    cancelable: true,
    icon: TrashIcon,
    buttons: [
      { text: translate('template_builder.save_sheet.cancel'), style: 'cancel' },
      {
        text: translate('template_builder.library.delete'),
        style: 'destructive',
        onPress: () => remove.mutate({ schemaId: template.schemaId, templateId: template.id }, {
          onSuccess: () => showSuccessMessage(translate('template_builder.library.deleted')),
          onError: error => showErrorMessage(translate(error.response?.data?.error === 'TEMPLATE_IN_USE'
            ? 'template_builder.library.in_use'
            : 'template_builder.library.delete_error')),
        }),
      },
    ],
  });

  return (
    <SafeAreaView style={screenStyle} className="flex-1 bg-background" edges={['top', 'bottom']}>
      <FocusAwareStatusBar />
      <ScreenHeader title={translate('template_builder.library.title')} onBack={() => router.back()} />
      <FlatList
        data={library.data ?? []}
        keyExtractor={item => String(item.id)}
        contentContainerClassName="grow gap-3 p-4"
        refreshControl={<RefreshControl refreshing={library.isRefetching} onRefresh={() => void library.refetch()} />}
        ListHeaderComponent={<Text className="text-sm/5 text-neutral-600 dark:text-neutral-300" tx="template_builder.library.hint" />}
        ListEmptyComponent={library.isPending
          ? <ActivityIndicator className="mt-12" />
          : library.isError
            ? (
                <View className="gap-3 py-10">
                  <Text className="text-center text-base" tx="template_builder.library.load_error" />
                  <Button tx="template_builder.library.retry" variant="white" onPress={() => void library.refetch()} />
                </View>
              )
            : (
                <View className="flex-1 items-center justify-center gap-3 py-10">
                  <Mascot pose="read" className="size-28" />
                  <Text className="text-center font-nunito text-lg font-extrabold text-mascot-navy dark:text-white" tx="template_builder.library.empty_title" />
                  <Text className="text-center text-sm text-neutral-600 dark:text-neutral-300" tx="template_builder.library.empty_body" />
                </View>
              )}
        renderItem={({ item }) => (
          <View className="gap-3 rounded-2xl border-2 border-b-4 border-line border-b-edge bg-surface p-4" testID={`library-template-${item.id}`}>
            <View className="flex-row items-center gap-3">
              <View className="size-10 items-center justify-center rounded-xl bg-success-100/60 dark:bg-emerald-950/80">
                <LayoutGridIcon color="#16A34A" width={20} height={20} />
              </View>
              <View className="flex-1">
                <Text numberOfLines={1} className="font-nunito text-base font-black text-mascot-navy dark:text-white">{item.name}</Text>
                <Text className="text-xs text-neutral-500 dark:text-neutral-400">
                  {item.usageCount > 0
                    ? translate('template_builder.library.usage', { count: item.usageCount })
                    : translate('template_builder.library.unused')}
                </Text>
              </View>
            </View>
            <Text className="text-xs/5 text-neutral-600 dark:text-neutral-300">
              {translate('learn.create_topic.template_fields', {
                front: item.frontFields.slice(0, 4).join(', ') || '—',
                back: item.backFields.slice(0, 4).join(', ') || '—',
              })}
            </Text>
            <View className="flex-row gap-2">
              <Button tx="template_builder.library.edit" variant="white" onPress={() => edit(item)} className="flex-1" testID={`library-edit-${item.id}`} />
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: item.usageCount > 0 }}
                accessibilityHint={item.usageCount > 0 ? translate('template_builder.library.in_use') : undefined}
                disabled={remove.isPending}
                // Still tappable while in use, so the tap explains why it cannot be deleted instead of doing nothing.
                onPress={() => item.usageCount > 0
                  ? showErrorMessage(translate('template_builder.library.in_use'))
                  : confirmDelete(item)}
                testID={`library-delete-${item.id}`}
                className={`min-h-12 justify-center rounded-xl px-4 ${item.usageCount > 0 ? 'opacity-40' : 'active:bg-pressed'}`}
              >
                <Text className="text-sm font-bold text-danger-600 dark:text-danger-400" tx="template_builder.library.delete" />
              </Pressable>
            </View>
          </View>
        )}
        ListFooterComponent={(
          <Button
            tx="template_builder.library.create"
            onPress={() => router.push('/template-builder')}
            className="mt-2"
            testID="library-create"
          />
        )}
      />
    </SafeAreaView>
  );
}

export default TemplateLibraryScreen;
