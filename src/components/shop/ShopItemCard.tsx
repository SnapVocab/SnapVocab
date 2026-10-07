import type { ReactNode } from 'react';
import type { ShopItemDTO } from '@/features/shop/types';
import { CheckIcon } from 'lucide-react-native';
import * as React from 'react';
import { ActivityIndicator, Image, Pressable, Text, View } from 'react-native';
import { AvatarFrame, Coin3D } from '@/components/snapvocab';
import { useSurface } from '@/components/ui';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { cn } from '@/lib/utils';
import { SHOP_TYPE_LABEL } from './shop-category-tabs';

type CardItem = Pick<ShopItemDTO, 'type' | 'code' | 'name' | 'iconUrl' | 'config' | 'quantity' | 'equipped'>;

const ARTWORK_BG = { THEME: 'bg-purple-50', AVATAR_FRAME: 'bg-amber-50', XP_BOOSTER: 'bg-emerald-50' } as const;

/** Item artwork: frames on the learner's own avatar (Snapy fallback), otherwise icon or bundled art. */
export function ItemArtwork({ item, size = 76, onFrameError }: { item: Omit<CardItem, 'quantity' | 'equipped'>; size?: number; onFrameError?: () => void }) {
  const avatarUrl = useAuthStore(s => s.user?.avatarUrl);
  // A signed icon URL can expire or 404: fall back to the bundled art instead of a blank tile.
  const [iconFailed, setIconFailed] = React.useState(false);
  if (item.type === 'AVATAR_FRAME') {
    return (
      <AvatarFrame
        frameId={item.code}
        frameUrl={item.config?.frameUrl}
        avatarUri={avatarUrl}
        avatarSource={require('../../assets/images/snapy-happy.png')}
        size={size + 12}
        animated
        showGlow={false}
        onFrameError={onFrameError}
      />
    );
  }
  const fallback = item.type === 'THEME'
    ? require('../../assets/images/shop/icon8_clean.png')
    : require('../../assets/images/shop/icon1_clean.png');
  return (
    <Image
      source={item.iconUrl && !iconFailed ? { uri: item.iconUrl } : fallback}
      style={{ width: size, height: size }}
      resizeMode="contain"
      onError={() => setIconFailed(true)}
    />
  );
}

/** Card shell shared by Shop and Kho đồ: same artwork, type label, 2-line name; only description and action differ. */
export function ItemCard({
  item,
  description,
  maxQuantity,
  onPress,
  onFrameError,
  children,
}: {
  item: CardItem;
  description?: string | null;
  maxQuantity?: number | null;
  onPress?: () => void;
  onFrameError?: () => void;
  children: ReactNode;
}) {
  const surfaceTokens = useSurface();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={{ backgroundColor: surfaceTokens.surface, borderColor: item.equipped ? '#58CC02' : surfaceTokens.border }}
      className="mb-3.5 w-[48%] overflow-hidden rounded-[22px] border border-b-[3px] shadow-sm shadow-black/5 active:opacity-95"
    >
      <View style={{ height: 100 }} className={cn('relative items-center justify-center p-2', ARTWORK_BG[item.type])}>
        {item.equipped && (
          <View className="absolute top-2 left-2 z-10 flex-row items-center gap-1 rounded-full bg-primary-500 px-2 py-0.5">
            <CheckIcon size={12} color="white" />
            <Text className="font-nunito text-[11px] font-extrabold text-white">Đang dùng</Text>
          </View>
        )}
        {item.type === 'XP_BOOSTER' && item.quantity > 0 && (
          <View className="absolute top-2 right-2 z-10 rounded-full bg-mascot-navy px-2 py-0.5">
            <Text className="font-nunito text-[12px] font-extrabold text-white tabular-nums">
              {`×${item.quantity}${maxQuantity ? `/${maxQuantity}` : ''}`}
            </Text>
          </View>
        )}
        <ItemArtwork item={item} onFrameError={onFrameError} />
      </View>

      <View className="flex-1 justify-between gap-2.5 p-2.5 pt-2">
        <View>
          <Text style={{ color: surfaceTokens.textMuted }} className="mb-0.5 font-inter text-[11px] font-bold tracking-wide uppercase" numberOfLines={1}>
            {SHOP_TYPE_LABEL[item.type]}
          </Text>
          <Text
            style={{ color: surfaceTokens.text, minHeight: 38 }}
            className="font-nunito text-[15px] leading-tight font-extrabold"
            numberOfLines={2}
          >
            {item.name}
          </Text>
          {description ? (
            <Text style={{ color: surfaceTokens.textMuted }} className="mt-1 font-inter text-[12px] leading-snug" numberOfLines={2}>
              {description}
            </Text>
          ) : null}
        </View>
        {children}
      </View>
    </Pressable>
  );
}

const ACTION_TONE = {
  primary: { box: 'border-b-[3px] border-primary-700 bg-primary-500 active:translate-y-0.5 active:border-b', text: 'text-white' },
  secondary: { box: 'border-b-[3px] active:translate-y-0.5 active:border-b', text: '' },
  warning: { box: 'border-b-[3px] border-amber-300 bg-amber-50 active:translate-y-0.5 active:border-b', text: 'text-amber-800' },
  done: { box: 'border-b-2 border-primary-200 bg-primary-50', text: 'text-primary-700' },
  disabled: { box: 'border-b-2', text: '' },
} as const;

/** The one card button: 40px, raised bottom border, Nunito 13px. `done`/`disabled` render as status, not buttons. */
export function CardAction({
  label,
  tone,
  onPress,
  loading,
  coin,
}: {
  label: string;
  tone: keyof typeof ACTION_TONE;
  onPress?: () => void;
  loading?: boolean;
  coin?: number;
}) {
  const style = ACTION_TONE[tone];
  const s = useSurface();
  // Neutral tones sit on the area's muted surface; colored tones are fixed semantic colors.
  const neutral = tone === 'secondary' || tone === 'disabled';
  const interactive = Boolean(onPress) && tone !== 'done' && tone !== 'disabled';
  return (
    <Pressable
      accessibilityRole={interactive ? 'button' : undefined}
      onPress={interactive ? onPress : undefined}
      disabled={!interactive || loading}
      style={neutral ? { backgroundColor: s.surfaceMuted, borderColor: s.border } : undefined}
      className={cn('h-10 flex-row items-center justify-center gap-1 rounded-xl', style.box)}
    >
      {loading ? (
        <ActivityIndicator size="small" color={tone === 'primary' ? 'white' : '#757793'} />
      ) : (
        <>
          {tone === 'done' && <CheckIcon size={14} color="#3C8C00" />}
          <Text style={neutral ? { color: tone === 'disabled' ? s.textMuted : s.text } : undefined} className={cn('font-nunito text-[13px] font-extrabold', style.text)}>{label}</Text>
          {coin !== undefined && (
            <>
              <Coin3D size="xs" />
              <Text className={cn('font-nunito text-[13px] font-extrabold tabular-nums', style.text)}>{coin.toLocaleString('vi-VN')}</Text>
            </>
          )}
        </>
      )}
    </Pressable>
  );
}

export type ShopItemCardProps = {
  item: ShopItemDTO;
  onPress: (item: ShopItemDTO) => void;
  onPreview?: (item: ShopItemDTO) => void;
  userCoins: number;
};

/** Shop variant: card body previews cosmetics; the button buys, equips/applies, or shows status. */
export function ShopItemCard({ item, onPress, onPreview, userCoins }: ShopItemCardProps) {
  const isCosmetic = item.type === 'THEME' || item.type === 'AVATAR_FRAME';
  const isOutOfCoin = item.blockReason === 'INSUFFICIENT_COINS' || userCoins < item.price;

  return (
    <ItemCard
      item={item}
      description={item.description}
      maxQuantity={item.config?.maxQuantity}
      onPress={() => (isCosmetic && onPreview ? onPreview(item) : onPress(item))}
    >
      {item.equipped ? (
        <CardAction tone="done" label="Đang dùng" />
      ) : isCosmetic && item.owned ? (
        <CardAction tone="primary" label={item.type === 'THEME' ? 'Áp dụng' : 'Trang bị'} onPress={() => onPress(item)} />
      ) : item.type === 'XP_BOOSTER' && item.blockReason === 'MAX_QUANTITY_REACHED' ? (
        <CardAction tone="disabled" label="Đã đạt tối đa" />
      ) : (
        // A theme is bought from its preview sheet (shop.md §11.1): the palette is seen before Coin is spent.
        <CardAction
          tone={isOutOfCoin ? 'warning' : 'primary'}
          label="Mua ·"
          coin={item.price}
          onPress={() => (item.type === 'THEME' && onPreview ? onPreview(item) : onPress(item))}
        />
      )}
    </ItemCard>
  );
}
