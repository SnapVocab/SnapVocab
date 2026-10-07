import type { AxiosError } from 'axios';
import type { ApiResponse } from '../auth/api';
import type {
  ActivationResultDTO,
  EquipmentDTO,
  EquipmentSlot,
  EquipRequest,
  InventoryDTO,
  ParsedShopError,
  PurchaseRequest,
  PurchaseResultDTO,
  ShopErrorCode,
  ShopItemDTO,
  ShopItemType,
  WalletDTO,
} from './types';
import { client } from '@/lib/api';

/**
 * Parses any Axios or network error into a structured ParsedShopError.
 */
export function parseShopError(error: unknown): ParsedShopError {
  const axiosError = error as AxiosError<ApiResponse<any>>;
  if (axiosError?.response?.data) {
    const errorBody = axiosError.response.data;
    const code = (errorBody.error || 'UNKNOWN_ERROR') as ShopErrorCode;
    const statusCode = axiosError.response.status || errorBody.statusCode || 500;
    const details = typeof errorBody.data === 'object' && errorBody.data !== null
      ? (errorBody.data as Record<string, unknown>)
      : undefined;

    return {
      code,
      message: (errorBody as any).message || getFriendlyErrorMessage(code, details),
      statusCode,
      details,
    };
  }

  // Network / timeout error: the raw axios text ("Network Error", "timeout of …") is not user copy.
  return {
    code: 'NETWORK_ERROR',
    message: 'Không kết nối được máy chủ. Vui lòng kiểm tra mạng và thử lại.',
    statusCode: 0,
  };
}

/**
 * No response, or a 5xx: the server may have committed. Retry with the SAME Idempotency-Key
 * (it replays the committed result); a new key could buy/spend a second time (shop.md §11.1).
 */
export function isOutcomeUnknown(error: ParsedShopError): boolean {
  return error.statusCode === 0 || error.statusCode >= 500;
}

/**
 * User-friendly message for backend error codes
 */
export function getFriendlyErrorMessage(code: string, details?: Record<string, unknown>): string {
  switch (code) {
    case 'PRICE_CHANGED':
      return details?.currentPrice != null
        ? `Giá vật phẩm vừa thay đổi thành ${details.currentPrice} Coin.`
        : 'Giá vật phẩm vừa thay đổi.';
    case 'INSUFFICIENT_COINS':
      return 'Bạn không có đủ Coin để mua vật phẩm này.';
    case 'ITEM_ALREADY_OWNED':
    case 'ALREADY_OWNED':
      return 'Bạn đã sở hữu vật phẩm này rồi.';
    case 'MAX_QUANTITY_REACHED':
      return 'Đã đạt số lượng sở hữu tối đa cho vật phẩm này.';
    case 'ITEM_NOT_AVAILABLE':
      return 'Vật phẩm này hiện không còn bán trong Cửa hàng.';
    case 'SHOP_ITEM_NOT_FOUND':
      return 'Không tìm thấy vật phẩm yêu cầu.';
    case 'BOOSTER_ALREADY_ACTIVE':
      return 'Đang có một Thẻ nhân đôi kinh nghiệm hoạt động. Vui lòng chờ kết thúc!';
    case 'ITEM_QUANTITY_EMPTY':
      return 'Bạn đã dùng hết số lượng vật phẩm này.';
    case 'CONCURRENT_MODIFICATION':
      return 'Hệ thống đang bận xử lý giao dịch. Vui lòng thử lại sau ít giây.';
    case 'IDEMPOTENCY_KEY_REUSED':
      return 'Mã giao dịch không hợp lệ cho vật phẩm này. Vui lòng mở lại và thử lại.';
    case 'IDEMPOTENCY_KEY_REQUIRED':
      return 'Lỗi xác thực giao dịch, vui lòng thử lại.';
    default:
      return 'Có lỗi xảy ra, vui lòng thử lại sau.';
  }
}

/**
 * 1. GET /api/shop/items?type=
 * Catalog items on sale with current user's ownership and purchase eligibility.
 */
export async function getShopItems(type?: ShopItemType): Promise<ShopItemDTO[]> {
  const response = await client<ApiResponse<ShopItemDTO[]>>({
    url: '/api/shop/items',
    method: 'GET',
    params: type ? { type } : undefined,
  });
  return response.data.data;
}

/**
 * 2. POST /api/shop/items/{itemId}/purchase
 * Buy one unit with coin; replay-safe via Idempotency-Key.
 */
export async function purchaseShopItem(
  itemId: number,
  expectedPrice: number,
  idempotencyKey: string,
): Promise<PurchaseResultDTO> {
  const payload: PurchaseRequest = { expectedPrice };
  const response = await client<ApiResponse<PurchaseResultDTO>>({
    url: `/api/shop/items/${itemId}/purchase`,
    method: 'POST',
    data: payload,
    headers: {
      'Idempotency-Key': idempotencyKey,
    },
  });
  return response.data.data;
}

/**
 * 3. GET /api/me/items
 * Inventory: owned items, equipped state, active booster and server time.
 */
export async function getInventory(): Promise<InventoryDTO> {
  const response = await client<ApiResponse<InventoryDTO>>({
    url: '/api/me/items',
    method: 'GET',
  });
  return response.data.data;
}

/**
 * 4. PUT /api/me/equipment/{slot}
 * Equip a THEME or AVATAR_FRAME; replaces the item currently in the slot atomically.
 */
export async function equipItem(
  slot: EquipmentSlot,
  itemId: number,
): Promise<EquipmentDTO> {
  const payload: EquipRequest = { itemId };
  const response = await client<ApiResponse<EquipmentDTO>>({
    url: `/api/me/equipment/${slot}`,
    method: 'PUT',
    data: payload,
  });
  return response.data.data;
}

/**
 * 5. DELETE /api/me/equipment/{slot}
 * Unequip a slot (back to default).
 */
export async function unequipItem(
  slot: EquipmentSlot,
): Promise<EquipmentDTO> {
  const response = await client<ApiResponse<EquipmentDTO>>({
    url: `/api/me/equipment/${slot}`,
    method: 'DELETE',
  });
  return response.data.data;
}

/**
 * 6. POST /api/me/items/{itemId}/activate
 * Activate one XP Booster; replay-safe via Idempotency-Key.
 */
export async function activateItem(
  itemId: number,
  idempotencyKey: string,
): Promise<ActivationResultDTO> {
  const response = await client<ApiResponse<ActivationResultDTO>>({
    url: `/api/me/items/${itemId}/activate`,
    method: 'POST',
    headers: {
      'Idempotency-Key': idempotencyKey,
    },
  });
  return response.data.data;
}

/**
 * 7. GET /api/me/wallet?cursor=&size=
 * Coin balance and ledger history, newest first.
 */
export async function getWallet(
  cursor?: number | null,
  size: number = 20,
): Promise<WalletDTO> {
  const params: Record<string, any> = { size };
  if (cursor != null) {
    params.cursor = cursor;
  }
  const response = await client<ApiResponse<WalletDTO>>({
    url: '/api/me/wallet',
    method: 'GET',
    params,
  });
  return response.data.data;
}
