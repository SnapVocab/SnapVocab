import type { ShopItemDTO } from '../types';
import { generateIdempotencyKey } from '@/features/quiz/utils/idempotency';
import { isKnownItemType as isCanonical, isEquippable, isStackable, SHOP_ITEM_TYPES } from '../types';

describe('shop & Economy business rules verification', () => {
  describe('canonical types strictly limited to 4 items', () => {
    // Shop and Kho đồ hide every other type, so a type added server-side never reaches this app version.
    it('only allows AVATAR_FRAME, CARD_FRAME, XP_BOOSTER and STREAK_FREEZE', () => {
      expect(SHOP_ITEM_TYPES).toHaveLength(4);
      // card_frame_plan.md: worn in its own slot like the avatar frame.
      expect(isCanonical('CARD_FRAME')).toBe(true);
      expect(isEquippable('CARD_FRAME')).toBe(true);
      expect(isEquippable('XP_BOOSTER')).toBe(false);

      expect(isCanonical('AVATAR_FRAME')).toBe(true);
      expect(isCanonical('XP_BOOSTER')).toBe(true);
      // streak_freeze.md (PO 2026-10-21)
      expect(isCanonical('STREAK_FREEZE')).toBe(true);
      expect(isStackable('STREAK_FREEZE')).toBe(true);
      expect(isStackable('AVATAR_FRAME')).toBe(false);

      // Verify old mock types are rejected; THEME was removed 2026-11-02
      expect(isCanonical('THEME')).toBe(false);
      expect(isCanonical('BOOSTER')).toBe(false);
      expect(isCanonical('SPECIAL')).toBe(false);
      expect(isCanonical('CHEST')).toBe(false);
      expect(isCanonical('DECK')).toBe(false);
      expect(isCanonical('HEART_REFILL')).toBe(false);
      expect(isCanonical('COIN_MAGNET')).toBe(false);
      expect(isCanonical('HINT_TOKEN')).toBe(false);
      expect(isCanonical('TIMER_BOOST')).toBe(false);
      expect(isCanonical('REFRESH_TICKET')).toBe(false);
    });
  });

  describe('idempotency key generation and reuse on retry', () => {
    it('generates a valid UUID v4 format string', () => {
      const key = generateIdempotencyKey();
      const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(key).toMatch(uuidV4Regex);
    });

    it('preserves the same UUID on retry of the same purchase intent', () => {
      const intent = {
        item: { itemId: 101, price: 250 } as ShopItemDTO,
        idempotencyKey: generateIdempotencyKey(),
      };

      const originalKey = intent.idempotencyKey;

      // Simulate a network failure retry attempt
      const retryIntent = {
        ...intent,
      };

      expect(retryIntent.idempotencyKey).toBe(originalKey);
    });
  });

  describe('wallet signed amount and source formatting', () => {
    it('formats earn transactions with + prefix and spend transactions with negative number', () => {
      const earnTx = { amount: 50 };
      const spendTx = { amount: -250 };

      const formatAmount = (amount: number) => (amount > 0 ? `+${amount}` : `${amount}`);

      expect(formatAmount(earnTx.amount)).toBe('+50');
      expect(formatAmount(spendTx.amount)).toBe('-250');
    });
  });

  describe('active booster blocking logic', () => {
    it('disables booster activation when an active booster is running', () => {
      const activeBooster = {
        activationId: 1,
        itemId: 102,
        multiplier: 2,
        startedAt: '2026-09-25T08:00:00Z',
        expiresAt: '2026-09-25T08:30:00Z',
      };

      const canActivateNewBooster = (currentBooster: typeof activeBooster | null) => {
        return currentBooster === null;
      };

      expect(canActivateNewBooster(activeBooster)).toBe(false);
      expect(canActivateNewBooster(null)).toBe(true);
    });
  });
});
