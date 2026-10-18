/* eslint-disable max-lines-per-function */
import type {
  ActivationResultDTO,
  EquipmentDTO,
  InventoryDTO,
  PurchaseResultDTO,
  ShopItemDTO,
  WalletDTO,
} from '../types';
import { client } from '@/lib/api';
import {
  activateItem,
  equipItem,
  getInventory,
  getShopItems,
  getWallet,
  parseShopError,
  purchaseShopItem,
  unequipItem,
} from '../api';

jest.mock('@/lib/api', () => ({
  client: jest.fn(),
}));
jest.mock('@/lib/i18n', () => require('./vi-translate'));

const mockedClient = client as unknown as jest.Mock;

describe('shop API layer and backend contracts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('1. GET /api/shop/items', () => {
    it('fetches shop catalog with ownership and eligibility', async () => {
      const mockCatalog: ShopItemDTO[] = [
        {
          itemId: 101,
          code: 'frame_bronze_learner',
          type: 'AVATAR_FRAME',
          name: 'Khung Đồng Mở Lối',
          description: 'Khung avatar tân thủ',
          iconUrl: 'https://example.com/icon.png',
          price: 350,
          availableUntil: null,
          config: { frameUrl: 'https://example.com/frame.png' },
          owned: false,
          quantity: 0,
          equipped: false,
          canPurchase: true,
          blockReason: null,
        },
        {
          itemId: 102,
          code: 'booster_xp_2x_30m',
          type: 'XP_BOOSTER',
          name: 'Nhân Đôi KN',
          description: 'x2 kinh nghiệm trong 30 phút',
          iconUrl: null,
          price: 250,
          availableUntil: null,
          config: { multiplier: 2, durationMinutes: 30, maxQuantity: 5 },
          owned: true,
          quantity: 2,
          equipped: false,
          canPurchase: true,
          blockReason: null,
        },
        {
          itemId: 103,
          code: 'theme_midnight_neon',
          type: 'THEME',
          name: 'Đêm Neon Huyền Ảo',
          description: 'Giao diện bóng đêm neon',
          iconUrl: null,
          price: 500,
          availableUntil: null,
          config: { themeKey: 'MIDNIGHT_NEON' },
          owned: true,
          quantity: 1,
          equipped: true,
          canPurchase: false,
          blockReason: 'ALREADY_OWNED',
        },
      ];

      mockedClient.mockResolvedValueOnce({
        data: { statusCode: 200, data: mockCatalog, error: null },
      });

      const result = await getShopItems();
      expect(result).toHaveLength(3);
      expect(result[0].itemId).toBe(101);
      expect(result[0].type).toBe('AVATAR_FRAME');
      expect(result[1].type).toBe('XP_BOOSTER');
      expect(result[2].type).toBe('THEME');
      expect(result[2].blockReason).toBe('ALREADY_OWNED');
      expect(mockedClient).toHaveBeenCalledWith({
        url: '/api/shop/items',
        method: 'GET',
        params: undefined,
      });
    });

    it('filters by ShopItemType when provided', async () => {
      mockedClient.mockResolvedValueOnce({
        data: { statusCode: 200, data: [], error: null },
      });

      await getShopItems('XP_BOOSTER');
      expect(mockedClient).toHaveBeenCalledWith({
        url: '/api/shop/items',
        method: 'GET',
        params: { type: 'XP_BOOSTER' },
      });
    });
  });

  describe('2. POST /api/shop/items/{itemId}/purchase', () => {
    it('sends purchase with expectedPrice body and Idempotency-Key header', async () => {
      const mockResult: PurchaseResultDTO = {
        transactionId: 9991,
        itemId: 102,
        quantity: 3,
        owned: true,
        coinBalance: 1200,
        replayed: false,
      };

      mockedClient.mockResolvedValueOnce({
        data: { statusCode: 200, data: mockResult, error: null },
      });

      const idempotencyKey = 'uuid-purchase-12345';
      const result = await purchaseShopItem(102, 250, idempotencyKey);

      expect(result.coinBalance).toBe(1200);
      expect(result.quantity).toBe(3);
      expect(result.replayed).toBe(false);

      expect(mockedClient).toHaveBeenCalledWith({
        url: '/api/shop/items/102/purchase',
        method: 'POST',
        data: { expectedPrice: 250 },
        headers: {
          'Idempotency-Key': 'uuid-purchase-12345',
        },
      });
    });
  });

  describe('3. GET /api/me/items', () => {
    it('fetches inventory items and active booster', async () => {
      const mockInventory: InventoryDTO = {
        serverNow: '2026-09-25T08:00:00Z',
        activeBooster: {
          activationId: 55,
          itemId: 102,
          multiplier: 2,
          startedAt: '2026-09-25T07:50:00Z',
          expiresAt: '2026-09-25T08:20:00Z',
        },
        items: [
          {
            itemId: 102,
            code: 'booster_xp_2x_30m',
            type: 'XP_BOOSTER',
            status: 'PUBLISHED',
            name: 'Nhân Đôi KN',
            iconUrl: null,
            quantity: 2,
            equipped: false,
            config: { multiplier: 2, durationMinutes: 30, maxQuantity: 5 },
          },
        ],
      };

      mockedClient.mockResolvedValueOnce({
        data: { statusCode: 200, data: mockInventory, error: null },
      });

      const result = await getInventory();
      expect(result.serverNow).toBe('2026-09-25T08:00:00Z');
      expect(result.activeBooster?.multiplier).toBe(2);
      expect(result.items[0].code).toBe('booster_xp_2x_30m');
      expect(mockedClient).toHaveBeenCalledWith({
        url: '/api/me/items',
        method: 'GET',
      });
    });
  });

  describe('4. PUT & DELETE /api/me/equipment/{slot}', () => {
    it('equips item into slot via PUT /api/me/equipment/{slot}', async () => {
      const mockEquip: EquipmentDTO = {
        slot: 'THEME',
        item: {
          itemId: 103,
          code: 'theme_midnight_neon',
          type: 'THEME',
          status: 'PUBLISHED',
          name: 'Đêm Neon Huyền Ảo',
          iconUrl: null,
          quantity: 1,
          equipped: true,
          config: { themeKey: 'MIDNIGHT_NEON' },
        },
      };

      mockedClient.mockResolvedValueOnce({
        data: { statusCode: 200, data: mockEquip, error: null },
      });

      const result = await equipItem('THEME', 103);
      expect(result.slot).toBe('THEME');
      expect(result.item?.equipped).toBe(true);
      expect(mockedClient).toHaveBeenCalledWith({
        url: '/api/me/equipment/THEME',
        method: 'PUT',
        data: { itemId: 103 },
      });
    });

    it('unequips slot back to default via DELETE /api/me/equipment/{slot}', async () => {
      const mockUnequip: EquipmentDTO = {
        slot: 'AVATAR_FRAME',
        item: null,
      };

      mockedClient.mockResolvedValueOnce({
        data: { statusCode: 200, data: mockUnequip, error: null },
      });

      const result = await unequipItem('AVATAR_FRAME');
      expect(result.slot).toBe('AVATAR_FRAME');
      expect(result.item).toBeNull();
      expect(mockedClient).toHaveBeenCalledWith({
        url: '/api/me/equipment/AVATAR_FRAME',
        method: 'DELETE',
      });
    });
  });

  describe('5. POST /api/me/items/{itemId}/activate', () => {
    it('activates booster with Idempotency-Key', async () => {
      const mockActivation: ActivationResultDTO = {
        activation: {
          activationId: 77,
          itemId: 102,
          multiplier: 2,
          startedAt: '2026-09-25T08:00:00Z',
          expiresAt: '2026-09-25T08:30:00Z',
        },
        quantity: 1,
        serverNow: '2026-09-25T08:00:00Z',
        replayed: false,
      };

      mockedClient.mockResolvedValueOnce({
        data: { statusCode: 200, data: mockActivation, error: null },
      });

      const idempotencyKey = 'uuid-activate-67890';
      const result = await activateItem(102, idempotencyKey);
      expect(result.activation.multiplier).toBe(2);
      expect(result.quantity).toBe(1);
      expect(mockedClient).toHaveBeenCalledWith({
        url: '/api/me/items/102/activate',
        method: 'POST',
        headers: {
          'Idempotency-Key': 'uuid-activate-67890',
        },
      });
    });
  });

  describe('6. GET /api/me/wallet', () => {
    it('fetches wallet balance with cursor and size', async () => {
      const mockWallet: WalletDTO = {
        balance: 1500,
        transactions: [
          {
            id: 1,
            amount: -250,
            balanceAfter: 1500,
            sourceType: 'SHOP_PURCHASE',
            referenceId: 'item-102',
            description: 'Mua Nhân Đôi KN',
            createdAt: '2026-09-25T07:30:00Z',
          },
          {
            id: 2,
            amount: 50,
            balanceAfter: 1750,
            sourceType: 'MISSION_REWARD',
            referenceId: 'mission-4',
            description: 'Hoàn thành nhiệm vụ',
            createdAt: '2026-09-25T07:00:00Z',
          },
        ],
        nextCursor: 2,
      };

      mockedClient.mockResolvedValueOnce({
        data: { statusCode: 200, data: mockWallet, error: null },
      });

      const result = await getWallet(5, 20);
      expect(result.balance).toBe(1500);
      expect(result.transactions).toHaveLength(2);
      expect(result.nextCursor).toBe(2);
      expect(mockedClient).toHaveBeenCalledWith({
        url: '/api/me/wallet',
        method: 'GET',
        params: { cursor: 5, size: 20 },
      });
    });
  });

  describe('7. Error mapping and parsing', () => {
    it('parses PRICE_CHANGED error and extracts currentPrice detail', () => {
      const priceError = {
        response: {
          status: 409,
          data: {
            statusCode: 409,
            error: 'PRICE_CHANGED',
            data: { currentPrice: 300 },
          },
        },
      };

      const parsed = parseShopError(priceError);
      expect(parsed.code).toBe('PRICE_CHANGED');
      expect(parsed.statusCode).toBe(409);
      expect(parsed.details?.currentPrice).toBe(300);
      expect(parsed.message).toContain('300');
    });

    it('parses INSUFFICIENT_COINS error correctly', () => {
      const coinError = {
        response: {
          status: 409,
          data: {
            statusCode: 409,
            error: 'INSUFFICIENT_COINS',
            data: null,
          },
        },
      };

      const parsed = parseShopError(coinError);
      expect(parsed.code).toBe('INSUFFICIENT_COINS');
      expect(parsed.message).toContain('không có đủ Coin');
    });

    it('parses CONCURRENT_MODIFICATION error correctly', () => {
      const raceError = {
        response: {
          status: 409,
          data: {
            statusCode: 409,
            error: 'CONCURRENT_MODIFICATION',
          },
        },
      };

      const parsed = parseShopError(raceError);
      expect(parsed.code).toBe('CONCURRENT_MODIFICATION');
      expect(parsed.message).toContain('bận xử lý giao dịch');
    });
  });
});
