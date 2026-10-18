import type { ShopItemType } from '@/features/shop/types';
import * as React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSurface } from '@/components/ui';
import { cn } from '@/lib/utils';

export type ShopCategory = 'all' | ShopItemType;

/** One vocabulary for item types across Shop, Kho đồ and modals. "Giao diện cửa hàng": not "Chủ đề" (= vocabulary topic) nor Settings → Giao diện (light/dark). */
export const SHOP_TYPE_LABEL: Record<ShopItemType, string> = {
  XP_BOOSTER: 'Bổ trợ',
  AVATAR_FRAME: 'Khung avatar',
  THEME: 'Giao diện cửa hàng',
};

const CATEGORIES: ShopCategory[] = ['all', 'XP_BOOSTER', 'AVATAR_FRAME', 'THEME'];

export function ShopCategoryTabs({ value, onChange }: { value: ShopCategory; onChange: (value: ShopCategory) => void }) {
  const s = useSurface();
  return (
    <View
      style={{ backgroundColor: s.surface, borderColor: s.border }}
      className="border-b px-4 py-2"
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
              style={isActive ? undefined : { backgroundColor: s.surfaceMuted, borderColor: s.border }}
              className={cn(
                'rounded-full px-4 py-1.5',
                isActive ? 'border-b-2 border-primary-700 bg-primary-500' : 'border active:opacity-70',
              )}
            >
              <Text style={isActive ? undefined : { color: s.textMuted }} className={cn('font-nunito text-[13px] font-extrabold', isActive && 'text-white')}>
                {id === 'all' ? 'Tất cả' : SHOP_TYPE_LABEL[id]}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
