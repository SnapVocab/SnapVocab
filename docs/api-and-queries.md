# Hướng dẫn Gọi API & Custom Hooks với TanStack Query — SnapVocab

Tài liệu hướng dẫn chuẩn hóa cách gọi API, quản lý cache và tách Custom Hook bằng TanStack Query (React Query v5).

---

## 1. Cơ chế Axios Client tự động (`src/lib/api/client.tsx`)

Mọi request đều sử dụng instance `client` từ `@/lib/api`.

### Những điều `client` đã tự động xử lý cho bạn:
1. **Tự gắn Token:** Đọc `accessToken` từ Zustand store và đính kèm vào Header `Authorization: Bearer ...`.
2. **Tự Refresh Token:** Khi server trả về lỗi `401 Unauthorized`, client tự động gọi ngầm `/api/auth/refresh`, lưu token mới và gửi lại request vừa thất bại.
3. **Tự Đăng xuất:** Nếu refresh token cũng hết hạn, client tự động kích hoạt `logout()` và đưa người dùng về màn hình đăng nhập.

> ➡️ **Bạn không bao giờ phải viết header `Authorization` thủ công.**

---

## 2. Quy tắc Tổ chức File API

Mỗi feature có một file `api.ts` (ví dụ: `src/features/vocabulary/api.ts`).
File này chứa:
1. **Types / DTO:** Kiểu dữ liệu gửi đi (Request) và nhận về (Response).
2. **Custom Hooks:** Đóng gói `useQuery` hoặc `useMutation`.

---

## 3. Mẫu Tạo Custom Hook cho `useMutation` (POST / PUT / DELETE)

Dùng khi bạn muốn **thay đổi dữ liệu trên server** (Thêm từ, Đăng nhập, Cập nhật hồ sơ, Xóa thẻ).

```tsx
// src/features/vocabulary/api.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { client } from '@/lib/api';

// 1. Khai báo Types
export type CreateFlashcardRequest = {
  word: string;
  translation: string;
  exampleSentence?: string;
};

export type FlashcardResponse = {
  id: number;
  word: string;
  translation: string;
  createdAt: string;
};

// 2. Custom Hook bọc useMutation
export function useCreateFlashcard() {
  const queryClient = useQueryClient();

  return useMutation<FlashcardResponse, AxiosError, CreateFlashcardRequest>({
    mutationFn: async (payload) => {
      const { data } = await client.post('/api/flashcards', payload);
      return data;
    },
    onSuccess: () => {
      // Làm mới danh sách flashcards sau khi tạo thành công
      queryClient.invalidateQueries({ queryKey: ['flashcards'] });
    },
  });
}
```

### Cách dùng trong Component:
```tsx
import { useCreateFlashcard } from '../api';
import { showErrorMessage, showSuccessMessage } from '@/components/ui';

export function AddWordModal() {
  const { mutate, isPending } = useCreateFlashcard();

  const handleSave = () => {
    mutate(
      { word: 'Apple', translation: 'Quả táo' },
      {
        onSuccess: (data) => {
          showSuccessMessage('Thêm từ thành công!');
        },
        onError: (error) => {
          showErrorMessage('Không thể thêm từ, vui lòng thử lại');
        },
      },
    );
  };

  return (
    <Button label="Lưu từ vựng" loading={isPending} onPress={handleSave} />
  );
}
```

---

## 4. Mẫu Tạo Custom Hook cho `useQuery` (Lấy dữ liệu GET)

Dùng khi bạn muốn **lấy danh sách hoặc chi tiết dữ liệu từ server**.

```tsx
// src/features/vocabulary/api.ts
import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { client } from '@/lib/api';

export type GetFlashcardsParams = {
  page?: number;
  limit?: number;
  topic?: string;
};

export function useFlashcards(params?: GetFlashcardsParams) {
  return useQuery<FlashcardResponse[], AxiosError>({
    queryKey: ['flashcards', params], // Query key duy nhất theo params
    queryFn: async () => {
      const { data } = await client.get('/api/flashcards', { params });
      return data;
    },
    staleTime: 1000 * 60 * 5, // Dữ liệu được coi là mới trong 5 phút, không fetch lại thừa thãi
  });
}
```

### Cách dùng trong Component:
```tsx
import { useFlashcards } from '../api';
import { View, Text, ActivityIndicator } from '@/components/ui';

export function FlashcardList() {
  const { data: flashcards, isLoading, isError, refetch } = useFlashcards({ page: 1, limit: 20 });

  if (isLoading) {
    return <ActivityIndicator size="large" color="#58CC02" />;
  }

  if (isError) {
    return <Text>Có lỗi xảy ra khi tải dữ liệu.</Text>;
  }

  return (
    <View>
      {flashcards?.map(card => (
        <Text key={card.id}>{card.word}: {card.translation}</Text>
      ))}
    </View>
  );
}
```

---

## 5. Kết hợp React Query với Zustand Store

Khi bạn có bộ lọc (ví dụ: ô tìm kiếm, chọn topic) lưu trong Zustand và cần dùng để query dữ liệu:

```tsx
// Custom hook kết hợp:
export function useFilteredFlashcards() {
  // 1. Lấy filter từ Zustand store
  const selectedTopic = useFilterStore(s => s.selectedTopic);

  // 2. Gọi React Query với tham số filter đó
  const query = useFlashcards({ topic: selectedTopic });

  return {
    ...query,
    flashcards: query.data ?? [],
  };
}
```
Component chỉ cần gọi `useFilteredFlashcards()` là có ngay danh sách sạch sẽ mà không phải ghép nối thủ công!
