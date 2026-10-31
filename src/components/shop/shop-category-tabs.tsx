import type { ShopItemType } from '@/features/shop/types';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSurface } from '@/components/ui';
import { cn } from '@/lib/utils';

export type ShopCategory = 'all' | ShopItemType;

/** One vocabulary for item types across Shop, Kho đồ and modals. "Giao diện cửa hàng": not "Chủ đề" (= vocabulary topic) nor Settings → Giao diện (light/dark). */
export const SHOP_TYPE_LABEL: Record<ShopItemType, string> = {
  XP_BOOSTER: 'shopUi.categories.boosters',
  AVATAR_FRAME: 'shopUi.categories.frames',
  THEME: 'shopUi.categories.themes',
  STREAK_FREEZE: 'shopUi.categories.streakFreezes',
};

const CATEGORIES: ShopCategory[] = ['all', 'XP_BOOSTER', 'AVATAR_FRAME', 'THEME', 'STREAK_FREEZE'];

export function ShopCategoryTabs({ value, onChange }: { value: ShopCategory; onChange: (value: ShopCategory) => void }) {
  const s = useSurface();
  const { t } = useTranslation();
  return (
    <View
      style={{ backgroundColor: s.surface }}
      className="px-4 py-2"
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {CATEGORIES.map((id) => {
          const isActive = value === id;
          return (
            <Pressable
              key={id}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              onPress={() => onChange(id)}
              style={isActive ? undefined : { backgroundColor: s.surfaceMuted }}
              className={cn(
                'rounded-full px-4 py-1.5',
                isActive ? 'bg-brand' : 'active:opacity-70',
              )}
            >
              <Text style={isActive ? undefined : { color: s.textMuted }} className={cn('font-nunito text-[13px] font-extrabold', isActive && 'text-on-brand')}>
                {id === 'all' ? t('shopUi.categories.all') : t(SHOP_TYPE_LABEL[id])}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
