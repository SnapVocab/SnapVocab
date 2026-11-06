import { Pressable, Text, View } from '@/components/ui';
import { BookIcon, CheckIcon, ChevronRightIcon, FolderIcon } from '@/components/ui/icons';
import { useColorMode } from '@/components/ui/surface';
import { translate } from '@/lib/i18n';

type Props = {
  title: string;
  description?: string;
  folder?: boolean;
  selected?: boolean;
  onPress: () => void;
  onBrowse?: () => void;
  testID: string;
  browseTestID?: string;
};

export function DestinationRow({ title, description, folder, selected, onPress, onBrowse, testID, browseTestID }: Props) {
  const dark = useColorMode() === 'dark';
  const color = dark ? '#B5D894' : '#4E7A25';
  const Icon = folder ? FolderIcon : BookIcon;
  return (
    <View className={`flex-row items-center border-b border-line pr-2 pl-4 ${selected ? 'bg-primary-50 dark:bg-primary-900/40' : 'bg-surface'}`}>
      <Pressable
        accessibilityRole={selected === undefined ? 'button' : 'radio'}
        accessibilityState={selected === undefined ? undefined : { checked: selected }}
        accessibilityLabel={description ? `${title}, ${description}` : title}
        onPress={onPress}
        testID={testID}
        className="min-h-20 flex-1 flex-row items-center gap-3 py-3 pr-3 active:opacity-70"
      >
        <View className="size-10 items-center justify-center rounded-xl bg-surface-raised">
          <Icon width={21} height={21} color={color} />
        </View>
        <View className="flex-1">
          <Text numberOfLines={2} className="font-nunito text-base font-extrabold text-mascot-navy dark:text-white">{title}</Text>
          {!!description && <Text numberOfLines={2} className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">{description}</Text>}
        </View>
        {selected !== undefined
          ? (
              <View className={`size-6 items-center justify-center rounded-full border-2 ${selected ? 'border-primary-700 bg-primary-700 dark:border-primary-300 dark:bg-primary-300' : 'border-edge'}`}>
                {selected && <CheckIcon width={15} height={15} color={dark ? '#1B2416' : '#FFFFFF'} />}
              </View>
            )
          : <ChevronRightIcon width={19} height={19} color={dark ? '#B5B8C4' : '#73758F'} />}
      </Pressable>
      {onBrowse && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={translate('my_words.browse_topic_named', { name: title })}
          testID={browseTestID}
          onPress={onBrowse}
          className="size-12 items-center justify-center rounded-xl bg-surface-raised active:bg-pressed"
        >
          <ChevronRightIcon width={21} height={21} color={dark ? '#B5B8C4' : '#565879'} />
        </Pressable>
      )}
    </View>
  );
}
