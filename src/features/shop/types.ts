/**
 * Canonical Shop types and DTOs according to docs/decisions/shop.md
 * ONLY 3 types: THEME, AVATAR_FRAME, XP_BOOSTER.
 */

export type ShopItemType = 'THEME' | 'AVATAR_FRAME' | 'XP_BOOSTER';

export type ThemeKey = 'DEFAULT' | 'MIDNIGHT_NEON' | 'SUNSET_AMBER' | 'FOREST_MINT';

export type ShopItemStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

/** Catalog eligibility (ShopItemDTO.BlockReason); purchase rejections use ShopErrorCode instead. */
export type BlockReason =
  | 'ALREADY_OWNED'
  | 'MAX_QUANTITY_REACHED'
  | 'INSUFFICIENT_COINS';

export type EquipmentSlot = 'THEME' | 'AVATAR_FRAME';

export type ItemConfig = {
  themeKey?: ThemeKey | string | null;
  frameUrl?: string | null;
  multiplier?: number | null;
  durationMinutes?: number | null;
  maxQuantity?: number | null;
};

export type ShopItemDTO = {
  itemId: number;
  code: string;
  type: ShopItemType;
  name: string;
  description: string | null;
  iconUrl: string | null;
  price: number;
  availableUntil: string | null;
  config: ItemConfig;
  owned: boolean;
  quantity: number;
  equipped: boolean;
  canPurchase: boolean;
  blockReason: BlockReason | null;
};

export type PurchaseRequest = {
  expectedPrice: number;
};

export type PurchaseResultDTO = {
  transactionId: number;
  itemId: number;
  quantity: number;
  owned: boolean;
  coinBalance: number;
  replayed: boolean;
};

export type InventoryItemDTO = {
  itemId: number;
  code: string;
  type: ShopItemType;
  status: ShopItemStatus;
  name: string;
  iconUrl: string | null;
  quantity: number;
  equipped: boolean;
  config: ItemConfig;
};

export type ActiveBoosterDTO = {
  activationId: number;
  itemId: number;
  multiplier: number;
  startedAt: string;
  expiresAt: string;
};

export type InventoryDTO = {
  serverNow: string;
  activeBooster: ActiveBoosterDTO | null;
  items: InventoryItemDTO[];
};

export type EquipmentDTO = {
  slot: EquipmentSlot;
  item: InventoryItemDTO | null;
};

export type EquipRequest = {
  itemId: number;
};

export type ActivationResultDTO = {
  activation: ActiveBoosterDTO;
  quantity: number;
  serverNow: string;
  replayed: boolean;
};

export type CoinSourceType =
  | 'MISSION_REWARD'
  | 'SHOP_PURCHASE'
  | 'ADMIN_ADJUSTMENT';

export type WalletTransactionDTO = {
  id: number;
  amount: number;
  balanceAfter: number;
  sourceType: CoinSourceType;
  referenceId: string | null;
  description: string | null;
  createdAt: string;
};

export type WalletDTO = {
  balance: number;
  transactions: WalletTransactionDTO[];
  nextCursor: number | null;
};

export type ShopErrorCode =
  | 'IDEMPOTENCY_KEY_REQUIRED'
  | 'IDEMPOTENCY_KEY_REUSED'
  | 'SHOP_ITEM_NOT_FOUND'
  | 'ITEM_NOT_AVAILABLE'
  | 'PRICE_CHANGED'
  | 'ITEM_ALREADY_OWNED'
  | 'MAX_QUANTITY_REACHED'
  | 'INSUFFICIENT_COINS'
  | 'ITEM_NOT_OWNED'
  | 'INVALID_EQUIPMENT_SLOT'
  | 'ITEM_NOT_EQUIPPABLE'
  | 'ITEM_NOT_ACTIVATABLE'
  | 'ITEM_QUANTITY_EMPTY'
  | 'BOOSTER_ALREADY_ACTIVE'
  | 'VALIDATION_ERROR'
  | 'FIELD_LOCKED'
  | 'VERSION_CONFLICT'
  | 'CONCURRENT_MODIFICATION';

export type ShopErrorDetails = {
  currentPrice?: number;
  allowed?: string[];
  [key: string]: unknown;
};

export type ParsedShopError = {
  code: ShopErrorCode | string;
  message: string;
  statusCode: number;
  details?: ShopErrorDetails;
};
