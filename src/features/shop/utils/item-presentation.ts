import type { TFunction } from 'i18next';
import type { ShopItemDTO } from '../types';

type Item = Pick<ShopItemDTO, 'type' | 'name' | 'config'>;

export function shopItemTitle(item: Item, t: TFunction): string {
  if (item.type === 'XP_BOOSTER')
    return t('shopUi.xpMultiplier', { multiplier: item.config?.multiplier ?? 2 });
  if (item.type === 'STREAK_FREEZE')
    return t('shopUi.streakFreezeName');
  return item.name;
}

export function shopItemDescription(item: Item & { description?: string | null }, t: TFunction): string | null {
  // Catalog descriptions are authored content: never discard details when moving them off the card.
  if (item.description?.trim())
    return item.description;
  if (item.type === 'XP_BOOSTER') {
    return t('shopUi.boosterDetails', {
      multiplier: item.config?.multiplier ?? 2,
      minutes: item.config?.durationMinutes ?? 30,
    });
  }
  return item.description ?? null;
}
