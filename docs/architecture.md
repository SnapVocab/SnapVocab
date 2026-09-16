# Hướng dẫn Kiến trúc Dự án (Architecture Guide) — SnapVocab

Tài liệu quy chuẩn kiến trúc codebase SnapVocab. Mục tiêu: **dễ đọc, dễ viết, không thừa thãi**, phù hợp cho người phát triển ứng dụng nhanh và chuẩn xác.

---

## 1. Mô hình Kiến trúc 3 Tầng (3-Tier Structure)

Dự án được chia làm 3 tầng rõ rệt:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Routing Layer (src/app/)                                 │
│    - Chỉ định nghĩa đường dẫn (URL).                        │
│    - Không chứa logic, chỉ 1 dòng re-export màn hình.       │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│ 2. Feature Layer (src/features/<tên-tính-năng>/)           │
│    - Nơi chứa 90% code dự án.                               │
│    - Mỗi thư mục là 1 tính năng độc lập:                     │
│      ├── api.ts              (React Query hooks)            │
│      ├── use-*-store.ts      (Zustand store nếu cần)        │
│      ├── *-screen.tsx        (Màn hình chính)               │
│      └── components/         (Component con riêng màn đó)   │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│ 3. Shared Layer (src/components/ui/ & src/lib/)             │
│    - UI primitives: Button, Card, Input, OtpInput, Text.     │
│    - Shared libs: Axios client, i18n, MMKV storage.         │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Quy chuẩn Form: React Hook Form + Zod

Mọi form trong dự án đều dùng chung một công thức: **Zod Schema + useForm + Controller**.

### Mẫu Form chuẩn (Copy & Dùng ngay):
```tsx
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button, Input, View } from '@/components/ui';
import { translate } from '@/lib/i18n/utils';

// 1. Khai báo Schema bằng Zod
const formSchema = z.object({
  email: z.string().email(translate('validation.email_invalid')),
  password: z.string().min(6, translate('validation.password_min')),
});

type FormValues = z.infer<typeof formSchema>;

export function MyForm() {
  // 2. Khởi tạo form
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = (data: FormValues) => {
    console.log('Form Submit:', data);
  };

  return (
    <View className="gap-3">
      {/* Ô Email */}
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Email"
            placeholder="Nhập email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            error={errors.email?.message}
          />
        )}
      />

      {/* Ô Mật khẩu: Tự có nút ẩn/hiện mắt bằng prop `isPassword` */}
      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Mật khẩu"
            placeholder="Nhập mật khẩu"
            isPassword
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            error={errors.password?.message}
          />
        )}
      />

      {/* Nút bấm Submit 3D */}
      <Button
        label="Xác nhận"
        variant="primary"
        loading={isSubmitting}
        onPress={handleSubmit(onSubmit)}
      />
    </View>
  );
}
```

---

## 3. Quy chuẩn Gọi API: TanStack Query (React Query)

Mọi API call đều viết thành Custom Hooks nằm tại file `api.ts` trong từng feature.

* **Axios Client (`client`)** đã tự động:
  * Gắn `Bearer <token>` từ Zustand store vào Header.
  * Tự động Refresh Token khi gặp lỗi 401.
  * Bạn **không cần** tự set `headers: { Authorization: ... }`.

### Mẫu Mutation (POST / PUT / DELETE):
```tsx
// src/features/vocabulary/api.ts
import { useMutation } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { client } from '@/lib/api';

type CreateWordRequest = { word: string; meaning: string };
type WordResponse = { id: string; word: string; meaning: string };

export function useCreateWord() {
  return useMutation<WordResponse, AxiosError, CreateWordRequest>({
    mutationFn: async (variables) => {
      const { data } = await client.post('/api/words', variables);
      return data;
    },
  });
}

// Cách dùng trong component:
const { mutate, isPending } = useCreateWord();

mutate({ word: 'Apple', meaning: 'Quả táo' }, {
  onSuccess: (data) => {
    showSuccessMessage('Thêm từ thành công!');
  },
  onError: () => {
    showErrorMessage('Thất bại, vui lòng thử lại');
  },
});
```

### Mẫu Query (GET data):
```tsx
// src/features/vocabulary/api.ts
import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { client } from '@/lib/api';

export function useWords() {
  return useQuery<WordResponse[], AxiosError>({
    queryKey: ['words'],
    queryFn: async () => {
      const { data } = await client.get('/api/words');
      return data;
    },
  });
}

// Cách dùng trong component:
const { data, isLoading, refetch } = useWords();
```

---

## 4. Quy chuẩn Global State: Zustand

Dùng Zustand theo cách cơ bản, trực quan với **Standard Selectors**:

```tsx
// 1. Tạo Store
import { create } from 'zustand';

type State = {
  selectedTopic: string | null;
  setTopic: (topic: string) => void;
};

export const useTopicStore = create<State>((set) => ({
  selectedTopic: null,
  setTopic: (topic) => set({ selectedTopic: topic }),
}));

// 2. Sử dụng trong Component (Chuẩn selector)
const topic = useTopicStore(s => s.selectedTopic);
const setTopic = useTopicStore(s => s.setTopic);
```

> **Lưu ý**: KHÔNG dùng `createSelectors` hoặc `.use.foo()` rườm rà. Dùng thẳng `s => s.foo`.

---

## 5. Hệ thống UI 3D Gamification (Duolingo Style)

Toàn bộ UI nằm tại `@/components/ui`. Đã được thiết kế sẵn theo chuẩn gamified:

### 1. Nút bấm 3D (`Button`)
Có viền đáy dày 4px và hiệu ứng nảy xuống 2px khi bấm:
```tsx
import { Button } from '@/components/ui';

<Button label="Bắt đầu học" variant="primary" />   {/* Xanh lá Duolingo */}
<Button label="Thử thách" variant="purple" />     {/* Tím Gamification */}
<Button label="Mascot Cam" variant="mascot" />     {/* Cam Mascot */}
<Button label="Xoá tài khoản" variant="danger" />  {/* Đỏ */}
<Button label="Đăng nhập" variant="secondary" />   {/* Nút trắng viền xám */}
<Button label="Xem thêm" variant="ghost" />       {/* Không viền */}
```

### 2. Thẻ 3D (`Card` & `CardInteractive`)
```tsx
import { Card, CardInteractive, Text } from '@/components/ui';

// Thẻ tĩnh hiển thị thông tin
<Card>
  <Text>Nội dung bài học</Text>
</Card>

// Thẻ bấm được (có hiệu ứng lún 3D)
<CardInteractive onPress={() => console.log('clicked')}>
  <Text>Bài 1: Chào hỏi</Text>
</CardInteractive>
```

### 3. Nhập mã OTP 6 số (`OtpInput`)
Gồm 6 ô vuông khối 3D, tự nhảy ô khi gõ, tự lùi khi xoá, tự chia khi paste:
```tsx
import { OtpInput } from '@/components/ui';

<OtpInput value={otp} onChange={setOtp} />
```

---

## 6. Đa ngôn ngữ (i18n)

* File từ điển: `src/translations/en.json` và `src/translations/vi.json`.
* Khi thêm key mới, **bắt buộc thêm vào cả 2 file** với cấu trúc giống hệt nhau.

```tsx
// Cách 1: Dùng hàm translate()
import { translate } from '@/lib/i18n';
<Text>{translate('welcome.title')}</Text>

// Cách 2: Dùng prop tx của Text component
import { Text } from '@/components/ui';
<Text tx="welcome.title" />
```

---

## 7. Bảng quy tắc Không Nên / Nên (Quick Reference)

| KHÔNG NÊN ❌ | NÊN ✅ |
|---|---|
| Viết logic trong `src/app/` | Chỉ re-export màn hình từ `src/features/` |
| Viết inline style `style={{ ... }}` | Dùng Tailwind class: `className="p-4 bg-white"` |
| Tự viết `useState(showPassword)` | Dùng `<Input isPassword />` |
| Dùng `axios.get(...)` thẳng trong UI | Đóng gói qua `useQuery` / `useMutation` |
| Dùng React Context để share global state | Dùng Zustand store |
| Hardcode chuỗi hiển thị `"Đăng nhập"` | Dùng `translate('login.sign_in')` |
