import type { ShopItemDTO } from '@/features/shop/types';
import { XIcon } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useSurface } from '@/components/ui';
import { shopItemDescription, shopItemTitle } from '@/features/shop/utils/item-presentation';
import { CardAction, ItemArtwork } from './ShopItemCard';

export function ShopItemDetailModal({ item, onClose, onBuy, purchaseDisabled = false }: {
  item: ShopItemDTO | null;
  onClose: () => void;
  onBuy: (item: ShopItemDTO) => void;
  purchaseDisabled?: boolean;
}) {
  const s = useSurface();
  const { t } = useTranslation();
  if (!item)
    return null;
  const title = shopItemTitle(item, t);
  const description = shopItemDescription(item, t);
  const maxed = item.blockReason === 'MAX_QUANTITY_REACHED';
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/60">
        <View style={{ backgroundColor: s.surface }} className="max-h-[85%] rounded-t-[28px] px-5 pt-4 pb-8">
          <View className="mb-2 flex-row items-center justify-between">
            <Text style={{ color: s.text }} className="font-nunito text-lg font-extrabold">{t('shopUi.itemDetails')}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={t('shopUi.close')} onPress={onClose} className="size-11 items-center justify-center rounded-full active:opacity-60">
              <XIcon size={22} color={s.textMuted} />
            </Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="items-center gap-4 pb-5">
            <View style={{ backgroundColor: s.surfaceMuted }} className="size-36 items-center justify-center rounded-full">
              <ItemArtwork item={item} size={108} />
            </View>
            <Text style={{ color: s.text }} className="text-center font-nunito text-2xl font-black">{title}</Text>
            {item.type === 'XP_BOOSTER' && (
              <Text style={{ color: s.textMuted }} className="font-nunito text-base font-bold">{t('shopUi.duration', { minutes: item.config?.durationMinutes ?? 30 })}</Text>
            )}
            {item.type === 'XP_BOOSTER' && item.description && (
              <Text style={{ color: s.textMuted }} className="text-center font-inter text-sm">{t('shopUi.boosterTiming')}</Text>
            )}
            {description && <Text style={{ color: s.textMuted }} className="w-full font-inter text-sm/relaxed">{description}</Text>}
            {item.quantity > 0 && <Text style={{ color: s.textMuted }} className="font-inter text-sm">{t('shopUi.ownedQuantity', { count: item.quantity })}</Text>}
          </ScrollView>
          <CardAction
            tone={maxed ? 'disabled' : 'primary'}
            label={maxed ? t('shopUi.actionMaxed') : undefined}
            coin={maxed ? undefined : item.price}
            accessibilityLabel={t('shopUi.buyItem', { name: title, price: item.price })}
            disabled={purchaseDisabled}
            onPress={() => onBuy(item)}
          />
        </View>
      </View>
    </Modal>
  );
}
