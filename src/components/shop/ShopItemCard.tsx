import type { ReactNode } from 'react';
import type { ShopItemDTO } from '@/features/shop/types';
import { CheckIcon, SnowflakeIcon } from 'lucide-react-native';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, Text, View } from 'react-native';
import { AvatarFrame, Coin3D } from '@/components/snapvocab';
import { BouncingDots, useSurface } from '@/components/ui';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { isStackable } from '@/features/shop/types';
import { shopItemTitle } from '@/features/shop/utils/item-presentation';
import { cn } from '@/lib/utils';
import { SHOP_TYPE_LABEL } from './shop-category-tabs';

type CardItem = Pick<ShopItemDTO, 'type' | 'code' | 'name' | 'iconUrl' | 'config' | 'quantity' | 'equipped'>;

const ARTWORK_BG = {
  AVATAR_FRAME: 'bg-amber-50 dark:bg-amber-400/10',
  XP_BOOSTER: 'bg-emerald-50 dark:bg-emerald-400/10',
  STREAK_FREEZE: 'bg-sky-50 dark:bg-sky-400/10',
} as const;

/** Item artwork: frames on the learner's own avatar (Snapy fallback), otherwise icon or bundled art. */
export function ItemArtwork({ item, size = 76, onFrameError }: { item: Omit<CardItem, 'quantity' | 'equipped'>; size?: number; onFrameError?: () => void }) {
  const avatarUrl = useAuthStore(s => s.user?.avatarUrl);
  // A signed icon URL can expire or 404: fall back to the bundled art instead of a blank tile.
  const [iconFailed, setIconFailed] = React.useState(false);
  if (item.type === 'STREAK_FREEZE' && (!item.iconUrl || iconFailed)) {
    return <SnowflakeIcon size={size} color="#0284C7" />;
  }
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
  const fallback = require('../../assets/images/shop/icon1_clean.png');
  return (
    <Image
      source={item.iconUrl && !iconFailed ? { uri: item.iconUrl } : fallback}
      style={{ width: size, height: size }}
      resizeMode="contain"
      onError={() => setIconFailed(true)}
    />
  );
}

/** Compact collectible tile; long descriptions belong in the item's detail sheet. */
export function ItemCard({
  item,
  showType = true,
  maxQuantity,
  onPress,
  onFrameError,
  children,
}: {
  item: CardItem;
  showType?: boolean;
  maxQuantity?: number | null;
  onPress?: () => void;
  onFrameError?: () => void;
  children: ReactNode;
}) {
  const surfaceTokens = useSurface();
  const { t } = useTranslation();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={{ backgroundColor: surfaceTokens.surface, borderColor: item.equipped ? '#58CC02' : surfaceTokens.border }}
      className="mb-4 w-[48%] overflow-hidden rounded-2xl border-2 border-b-4 active:translate-y-[2px] active:border-b-2"
    >
      <View style={{ height: 96 }} className={cn('relative items-center justify-center p-2', ARTWORK_BG[item.type])}>
        {item.equipped && (
          <View className="absolute top-2 left-2 z-10 flex-row items-center gap-1 rounded-full bg-brand px-2 py-0.5">
            <CheckIcon size={12} color="white" />
            <Text className="font-nunito text-[11px] font-extrabold text-on-brand">{t('shopUi.actionEquipped')}</Text>
          </View>
        )}
        {isStackable(item.type) && item.quantity > 0 && (
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
          {showType && (
            <Text style={{ color: surfaceTokens.textMuted }} className="mb-1 font-inter text-[11px] font-bold" numberOfLines={1}>
              {t(SHOP_TYPE_LABEL[item.type])}
            </Text>
          )}
          <Text
            style={{ color: surfaceTokens.text, minHeight: item.type === 'XP_BOOSTER' ? undefined : 38 }}
            className="font-nunito text-[16px] leading-tight font-black"
            numberOfLines={2}
          >
            {shopItemTitle(item, t)}
          </Text>
          {item.type === 'XP_BOOSTER' && <Text style={{ color: surfaceTokens.textMuted }} className="mt-1 font-nunito text-[13px] font-bold">{t('shopUi.duration', { minutes: item.config?.durationMinutes ?? 30 })}</Text>}
        </View>
        {children}
      </View>
    </Pressable>
  );
}

const ACTION_TONE = {
  primary: { box: 'border-brand-edge bg-brand active:bg-brand-pressed', text: 'text-[#17330B]' },
  secondary: { box: 'active:opacity-70', text: '' },
  warning: { box: 'border-reward-700 bg-reward-400 active:opacity-80 dark:border-[#8A6E22] dark:bg-[#E6C25E]', text: 'text-[#4A3300] dark:text-[#2A2006]' },
  done: { box: 'bg-primary-50 dark:bg-primary-400/15', text: 'text-primary-700 dark:text-primary-300' },
  disabled: { box: '', text: '' },
} as const;

/** Raised action matching Home; done/disabled tones render a flat status. */
export function CardAction({
  label,
  tone,
  onPress,
  loading,
  coin,
  accessibilityLabel,
  disabled = false,
}: {
  label?: string;
  tone: keyof typeof ACTION_TONE;
  onPress?: () => void;
  loading?: boolean;
  coin?: number;
  accessibilityLabel?: string;
  disabled?: boolean;
}) {
  const style = ACTION_TONE[tone];
  const s = useSurface();
  const { i18n } = useTranslation();
  // Neutral tones sit on the area's muted surface; colored tones are fixed semantic colors.
  const neutral = tone === 'secondary' || tone === 'disabled';
  const interactive = Boolean(onPress) && tone !== 'done' && tone !== 'disabled';
  return (
    <Pressable
      accessibilityRole={interactive ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel}
      onPress={interactive ? onPress : undefined}
      disabled={!interactive || loading || disabled}
      accessibilityState={{ disabled: !interactive || loading || disabled, busy: loading }}
      style={neutral ? { backgroundColor: s.surfaceMuted, borderColor: s.border } : undefined}
      className={cn('h-12 flex-row items-center justify-center gap-1.5 rounded-xl', style.box, interactive && 'border-b-4 active:translate-y-[2px] active:border-b-2', disabled && 'opacity-50')}
    >
      {loading ? (
        <BouncingDots size={6} gap={4} color={tone === 'primary' ? '#17330B' : s.textMuted} />
      ) : (
        <>
          {tone === 'done' && <CheckIcon size={14} color="#3C8C00" />}
          {label && <Text style={neutral ? { color: tone === 'disabled' ? s.textMuted : s.text } : undefined} className={cn('font-nunito text-[13px] font-extrabold', style.text)}>{label}</Text>}
          {coin !== undefined && (
            <>
              <Coin3D size="xs" />
              <Text className={cn('font-nunito text-[13px] font-extrabold tabular-nums', style.text)}>{coin.toLocaleString(i18n.language)}</Text>
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
  showType?: boolean;
  purchaseDisabled?: boolean;
};

/** Shop variant: card body previews cosmetics; the button buys, equips, or shows status. */
export function ShopItemCard({ item, onPress, onPreview, userCoins, showType, purchaseDisabled }: ShopItemCardProps) {
  const { t } = useTranslation();
  const isCosmetic = item.type === 'AVATAR_FRAME';
  const isOutOfCoin = item.blockReason === 'INSUFFICIENT_COINS' || userCoins < item.price;

  return (
    <ItemCard
      item={item}
      showType={showType}
      maxQuantity={item.config?.maxQuantity}
      onPress={() => (onPreview ? onPreview(item) : onPress(item))}
    >
      {item.equipped ? (
        <CardAction tone="done" label={t('shopUi.actionEquipped')} />
      ) : isCosmetic && item.owned ? (
        <CardAction tone="primary" label={t('shopUi.actionEquip')} onPress={() => onPress(item)} />
      ) : isStackable(item.type) && item.blockReason === 'MAX_QUANTITY_REACHED' ? (
        <CardAction tone="disabled" label={t('shopUi.actionMaxed')} />
      ) : (
        <CardAction
          tone={isOutOfCoin ? 'warning' : 'primary'}
          accessibilityLabel={t('shopUi.buyItem', { name: shopItemTitle(item, t), price: item.price })}
          disabled={purchaseDisabled}
          coin={item.price}
          onPress={() => onPress(item)}
        />
      )}
    </ItemCard>
  );
}
