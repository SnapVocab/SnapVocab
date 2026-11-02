import type { ReactNode } from 'react';
import type { ShopItemDTO } from '@/features/shop/types';
import { XIcon } from 'lucide-react-native';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { AvatarFrame, getAvatarFrame } from '@/components/snapvocab';
import { useSurface } from '@/components/ui';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { shopItemDescription, shopItemTitle } from '@/features/shop/utils/item-presentation';
import { ShopButton as Button } from './shop-button';

/** What a preview needs; Shop passes a catalog item, Kho đồ an owned inventory item (no price). */
export type PreviewItem = Pick<ShopItemDTO, 'type' | 'code' | 'name' | 'config'> & {
  description?: string | null;
  price?: number;
  owned: boolean;
  equipped: boolean;
};

type PreviewModalProps = {
  item: PreviewItem | null;
  onClose: () => void;
  /** Buy when not owned, equip when owned. Not called for the equipped item. */
  onAction: () => void;
};

function PreviewSheet({ item, onClose, onAction, children }: PreviewModalProps & { item: PreviewItem; children: ReactNode }) {
  const s = useSurface();
  const { t, i18n } = useTranslation();
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/60">
        <View style={{ backgroundColor: s.surface }} className="max-h-[90%] rounded-t-[28px] px-5 pt-4 pb-8">
          <View className="mb-4 flex-row items-center justify-between">
            <Text style={{ color: s.text }} className="font-nunito text-[18px] font-extrabold">
              {t('shopUi.previewFrame')}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('shopUi.close')}
              onPress={onClose}
              style={{ backgroundColor: s.surfaceMuted }}
              className="size-9 items-center justify-center rounded-full active:opacity-70"
            >
              <XIcon size={18} color={s.textMuted} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {children}

            <Text style={{ color: s.text }} className="mt-4 text-center font-nunito text-[18px] font-extrabold">{shopItemTitle(item, t)}</Text>
            {shopItemDescription(item, t) ? (
              <Text style={{ color: s.textMuted }} className="my-1 text-center font-inter text-[13px] leading-relaxed">{shopItemDescription(item, t)}</Text>
            ) : null}
          </ScrollView>

          <View className="mt-4">
            {item.equipped ? (
              <Button variant="secondary" label={t('shopUi.actionEquipped')} textClassName="font-nunito" disabled />
            ) : item.owned ? (
              <Button variant="primary" label={t('shopUi.actionEquip')} textClassName="font-nunito" onPress={onAction} />
            ) : (
              <Button variant="primary" label={`${t('shopUi.actionBuy')} ${(item.price ?? 0).toLocaleString(i18n.language)} Coin`} textClassName="font-nunito" onPress={onAction} />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

/** The tapped frame on the learner's own avatar, at profile size. */
export function FramePreviewModal({ item, ...props }: PreviewModalProps) {
  const avatarUrl = useAuthStore(state => state.user?.avatarUrl);
  const s = useSurface();
  if (!item) {
    return null;
  }
  const description = item.description || getAvatarFrame(item.code)?.description;
  return (
    <PreviewSheet item={{ ...item, description }} {...props}>
      <View style={{ backgroundColor: s.background }} className="items-center rounded-3xl py-6">
        <AvatarFrame
          frameId={item.code}
          frameUrl={item.config?.frameUrl}
          avatarUri={avatarUrl}
          avatarSource={require('../../assets/images/snapy-happy.png')}
          size="hero"
          animated
          showGlow
        />
      </View>
    </PreviewSheet>
  );
}
