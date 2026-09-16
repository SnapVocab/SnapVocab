# Hướng dẫn Xử lý Form với React Hook Form & Zod — SnapVocab

Tài liệu hướng dẫn cách tạo form chuẩn, bắt lỗi dữ liệu (validation) và quản lý trạng thái nhập liệu an toàn kiểu (Type-safe).

---

## 1. Tại sao dùng React Hook Form + Zod?

1. **Hiệu năng cao:** Chỉ ô input đang gõ được render lại, không re-render toàn bộ màn hình.
2. **Type-Safe tuyệt đối:** Tự động suy ra TypeScript Types từ Zod Schema qua `z.infer`.
3. **Tách biệt Logic:** Quy tắc kiểm tra tính hợp lệ (Validation) nằm độc lập với giao diện (JSX).

---

## 2. Công thức Chuẩn 4 Bước cho Mọi Form

```tsx
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button, Input, View } from '@/components/ui';
import { translate } from '@/lib/i18n';

// -------------------------------------------------------------
// BƯỚC 1: ĐỊNH NGHĨA VALIDATION SCHEMA
// -------------------------------------------------------------
const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, translate('validation.email_required'))
      .email(translate('validation.email_invalid')),
    password: z
      .string()
      .min(6, translate('validation.password_min')),
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'], // Báo lỗi cụ thể vào ô confirmPassword
  });

// Tự động suy diễn kiểu dữ liệu Form từ Schema:
type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  // -----------------------------------------------------------
  // BƯỚC 2: KHỞI TẠO FORM
  // -----------------------------------------------------------
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  // -----------------------------------------------------------
  // BƯỚC 3: HÀM XỬ LÝ KHI DỮ LIỆU ĐÃ HỢP LỆ
  // -----------------------------------------------------------
  const onSubmit = (values: RegisterFormValues) => {
    console.log('Dữ liệu hợp lệ:', values);
    // Gọi API tại đây...
  };

  // -----------------------------------------------------------
  // BƯỚC 4: RENDER CÁC TRƯỜNG VỚI CONTROLLER
  // -----------------------------------------------------------
  return (
    <View className="gap-3">
      {/* Ô Email */}
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Email"
            placeholder="Nhập địa chỉ email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            error={errors.email?.message}
          />
        )}
      />

      {/* Ô Password (tự động toggle mắt với isPassword) */}
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

      {/* Ô Xác nhận Password */}
      <Controller
        control={control}
        name="confirmPassword"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Xác nhận mật khẩu"
            placeholder="Nhập lại mật khẩu"
            isPassword
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            error={errors.confirmPassword?.message}
          />
        )}
      />

      {/* Nút Submit 3D */}
      <Button
        label="Đăng ký tài khoản"
        variant="primary"
        loading={isSubmitting}
        onPress={handleSubmit(onSubmit)}
        className="mt-4"
      />
    </View>
  );
}
```

---

## 3. Các hàm tiện ích thường dùng của `useForm`

Ngoài `control` và `handleSubmit`, bạn có thể lấy ra:

| Hàm / Biến | Mục đích | Cách dùng |
|---|---|---|
| `reset()` | Xóa trắng form hoặc gán lại giá trị mặc định | `reset()` sau khi gọi API thành công |
| `setValue(name, value)` | Gán giá trị thủ công cho 1 trường | `setValue('email', 'abc@gmail.com')` |
| `watch(name)` | Lắng nghe giá trị realtime của 1 trường | `const email = watch('email');` |
| `formState.errors` | Danh sách lỗi validation theo từng field | `errors.password?.message` |
| `formState.isSubmitting` | `true` khi hàm onSubmit đang chạy | Dùng để hiện loading trên nút bấm |
| `formState.isValid` | `true` khi tất cả các ô đều hợp lệ | Dùng để disable nút Submit nếu muốn |

---

## 4. Các mẫu Validation Zod thông dụng

### 1. Bắt buộc nhập chuỗi không rỗng:
```tsx
title: z.string().min(1, 'Vui lòng nhập tiêu đề'),
```

### 2. Số nguyên dương:
```tsx
coinAmount: z.number().int().positive('Số xu phải lớn hơn 0'),
```

### 3. Trường không bắt buộc (Optional):
```tsx
bio: z.string().optional(),
```
