import type { ReactNode } from 'react';
import type { ShopItemDTO } from '@/features/shop/types';
import { XIcon } from 'lucide-react-native';
import * as React from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { AvatarFrame, getAvatarFrame } from '@/components/snapvocab';
import { Button, useColorMode, useSurface } from '@/components/ui';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { getThemeDefinition } from '@/features/shop/theme/theme-context';
import { translate } from '@/lib/i18n';
import { shopTypeLabel } from './shop-category-tabs';

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
  /** Buy when not owned, equip/apply when owned. Not called for the equipped item. */
  onAction: () => void;
};

function PreviewSheet({ item, onClose, onAction, children }: PreviewModalProps & { item: PreviewItem; children: ReactNode }) {
  const isTheme = item.type === 'THEME';
  const s = useSurface();
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/60">
        <View style={{ backgroundColor: s.surface }} className="rounded-t-[32px] px-5 pt-4 pb-8">
          <View className="mb-4 flex-row items-center justify-between">
            <Text style={{ color: s.text }} className="font-nunito text-[18px] font-extrabold">
              {translate(isTheme ? 'shop.preview.theme_title' : 'shop.preview.frame_title')}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={translate('shop.close')}
              onPress={onClose}
              style={{ backgroundColor: s.surfaceMuted }}
              className="size-9 items-center justify-center rounded-full active:opacity-70"
            >
              <XIcon size={18} color={s.textMuted} />
            </Pressable>
          </View>

          {children}

          <Text style={{ color: s.text }} className="mt-4 text-center font-nunito text-[18px] font-extrabold">{item.name}</Text>
          {item.description ? (
            <Text style={{ color: s.textMuted }} className="my-1 text-center font-inter text-[13px] leading-relaxed">{item.description}</Text>
          ) : null}
          {isTheme && (
            <Text style={{ color: s.text }} className="mt-1 text-center font-inter text-[13px] font-semibold">{translate('shop.theme.scope')}</Text>
          )}

          <View className="mt-4">
            {item.equipped ? (
              <Button variant="secondary" label={translate('shop.actions.in_use')} textClassName="font-nunito" disabled />
            ) : item.owned ? (
              <Button variant="primary" label={translate(isTheme ? 'shop.actions.apply_theme' : 'shop.actions.equip_frame')} textClassName="font-nunito" onPress={onAction} />
            ) : (
              <Button variant="primary" label={translate('shop.actions.buy_for', { price: (item.price ?? 0).toLocaleString('vi-VN') })} textClassName="font-nunito" onPress={onAction} />
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

/**
 * A miniature Shop screen (header, item card with text and button, wallet row) in the theme's real
 * tokens for the user's current light/dark mode. No tab bar: the theme never reaches it.
 */
export function ThemePreviewModal({ item, ...props }: PreviewModalProps) {
  const mode = useColorMode();
  if (!item) {
    return null;
  }
  const t = getThemeDefinition(item.config?.themeKey).palette[mode];
  return (
    <PreviewSheet item={item} {...props}>
      <View style={{ backgroundColor: t.background, borderColor: t.border }} className="overflow-hidden rounded-3xl border">
        <View style={{ backgroundColor: t.headerBg, borderColor: t.border }} className="flex-row items-center justify-between border-b px-4 py-3">
          <Text style={{ color: t.text }} className="font-nunito text-[15px] font-extrabold">{translate('shop.title')}</Text>
          <View className="rounded-full border border-reward-200 bg-reward-50 px-2.5 py-0.5">
            <Text className="font-nunito text-[12px] font-extrabold text-reward-700">1.250</Text>
          </View>
        </View>
        <View className="gap-3 p-4">
          <View style={{ backgroundColor: t.surface, borderColor: t.border }} className="gap-1 rounded-2xl border p-3">
            <Text style={{ color: t.textMuted }} className="font-inter text-[11px] font-bold uppercase">{shopTypeLabel('XP_BOOSTER')}</Text>
            <Text style={{ color: t.text }} className="font-nunito text-[14px] font-extrabold">{translate('shop.preview.sample_item')}</Text>
            <Text style={{ color: t.textMuted }} className="font-inter text-[12px]">{translate('shop.preview.sample_effect')}</Text>
            <View className="mt-2 h-8 items-center justify-center rounded-xl border-b-[3px] border-primary-700 bg-primary-500">
              <Text className="font-nunito text-[12px] font-extrabold text-white">{`${translate('shop.actions.buy')} · 100`}</Text>
            </View>
          </View>
          <View style={{ backgroundColor: t.surfaceMuted }} className="flex-row items-center justify-between rounded-2xl px-3 py-2.5">
            <Text style={{ color: t.text }} className="font-inter text-[13px] font-bold">{translate('shop.wallet.source.mission_reward')}</Text>
            <Text className="font-nunito text-[13px] font-extrabold text-success-600">+40</Text>
          </View>
        </View>
      </View>
    </PreviewSheet>
  );
}
