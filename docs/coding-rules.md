# Quy chuẩn Viết Code (Coding Rules & Conventions) — SnapVocab

Bảng quy tắc bắt buộc áp dụng cho toàn bộ thành viên phát triển SnapVocab. Mục đích: **code đồng nhất, dễ đọc, hạn chế tối đa bug**.

---

## 1. Bảng Quy tắc Tổng quát (Do's & Don'ts)

| Hạng mục | NÊN LÀM (DO ✅) | TUYỆT ĐỐI TRÁNH (DON'T ❌) |
|---|---|---|
| **Đường dẫn Import** | Dùng alias `@/components/ui/button` | Dùng đường dẫn tương đối `../../components/ui/button` |
| **Màn hình & Routes** | `src/app/` chỉ re-export màn hình từ `src/features/` | Viết UI, state, useEffect, fetch API trong `src/app/` |
| **Giao diện (Styling)** | Dùng class Tailwind: `className="h-14 bg-white"` | Viết inline style: `style={{ height: 56, backgroundColor: '#fff' }}` |
| **Xử lý Form** | Dùng React Hook Form + Zod resolver | Dùng nhiều `useState` rời rạc cho từng ô input |
| **Mật khẩu** | Dùng `<Input isPassword />` tự có nút mắt | Tự viết `useState(showPassword)` và nút bấm toggle |
| **Gọi API** | Dùng custom hook qua TanStack Query (`api.ts`) | Gọi trực tiếp `axios.get()` hoặc `fetch()` trong component |
| **Auth Header** | Để Axios Interceptor tự động gắn token | Tự viết `headers: { Authorization: 'Bearer ...' }` |
| **Global State** | Dùng Zustand với selector: `useStore(s => s.data)` | Lấy cả store: `const store = useStore()` (gây re-render thừa) |
| **Chia sẻ State** | Dùng Zustand store cho data dùng chung | Dùng React Context Provider bọc chằng chịt |
| **Văn bản (Text)** | Dùng `tx="key"` hoặc `translate('key')` | Hardcode chuỗi hiển thị: `<Text>Đăng nhập</Text>` |
| **Icon** | Dùng thư viện `@/components/ui/icons` hoặc `createIcon` | Tự dán mã SVG dài ngoằng trực tiếp vào file màn hình |

---

## 2. Chi tiết từng Quy chuẩn

### Quy chuẩn 1: Đường dẫn Import (Absolute Path)
Luôn dùng `@/` đại diện cho thư mục `src/`.
```tsx
// ✅ ĐÚNG
import { Button, Input, View } from '@/components/ui';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { translate } from '@/lib/i18n';

// ❌ SAI
import { Button } from '../../../components/ui/button';
```

---

### Quy chuẩn 2: Styling với Tailwind (Uniwind)
* Chỉ dùng class Tailwind qua prop `className`.
* Dark mode dùng tiền tố `dark:`.
* Chỉ dùng inline `style={{ ... }}` cho các thuộc tính native bắt buộc (ví dụ: `elevation`, `writingDirection`).

```tsx
// ✅ ĐÚNG
<View className="flex-1 bg-white p-4 dark:bg-neutral-900">
  <Text className="text-xl font-bold text-mascot-navy dark:text-white" />
</View>

// ❌ SAI
<View style={{ flex: 1, backgroundColor: '#ffffff', padding: 16 }}>
  <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1E2A44' }} />
</View>
```

---

### Quy chuẩn 3: Quản lý Form với React Hook Form + Zod
Mọi màn hình nhập liệu đều phải định nghĩa Zod Schema rõ ràng.

```tsx
// ✅ ĐÚNG
const schema = z.object({
  email: z.string().email(translate('validation.email_invalid')),
  password: z.string().min(6, translate('validation.password_min')),
});

const { control, handleSubmit } = useForm({
  resolver: zodResolver(schema),
  defaultValues: { email: '', password: '' },
});
```

---

### Quy chuẩn 4: Lấy dữ liệu Zustand Store (Standard Selectors)
Luôn truyền selector `s => s.tên_biến` để component chỉ re-render khi đúng biến đó thay đổi.

```tsx
// ✅ ĐÚNG
const user = useAuthStore(s => s.user);
const logout = useAuthStore(s => s.logout);

// ❌ SAI (Cả component sẽ re-render khi bất kỳ biến nào trong store đổi!)
const { user, logout } = useAuthStore();
```

---

### Quy chuẩn 5: Đa ngôn ngữ (i18n)
Mọi chữ hiển thị trên app phải được khai báo trong file từ điển:
* `src/translations/en.json` (Tiếng Anh)
* `src/translations/vi.json` (Tiếng Việt)

> **Quy tắc**: Thêm key mới vào `en.json` thì **bắt buộc** phải thêm cùng key đó vào `vi.json`.

```tsx
// ✅ ĐÚNG
<Text tx="login.title" className="text-2xl font-bold" />
<Text>{translate('login.welcome_user', { name: user.name })}</Text>

// ❌ SAI
<Text className="text-2xl font-bold">Chào mừng bạn quay lại</Text>
```

---

### Quy chuẩn 6: Đặt tên File và Thư mục (Naming Conventions)
* **Thư mục feature:** `kebab-case` (ví dụ: `edit-profile`, `flash-cards`).
* **File component & screen:** `kebab-case` kèm hậu tố (ví dụ: `login-screen.tsx`, `login-form.tsx`).
* **Tên Component (Function):** `PascalCase` (ví dụ: `LoginScreen`, `LoginForm`).
* **Hook:** `camelCase` bắt đầu bằng `use` (ví dụ: `useAuthStore`, `useLogin`).

---

## 3. Quy trình Kiểm tra trước khi Commit (Checklist)

Trước khi tạo commit hoặc hoàn thành một tính năng, bạn chạy 2 lệnh sau trên terminal:

```bash
# 1. Kiểm tra lỗi kiểu dữ liệu TypeScript
pnpm type-check

# 2. Kiểm tra lỗi cú pháp & định dạng ESLint
pnpm lint

# Hoặc tự động sửa định dạng:
pnpm lint:fix
```

Nếu cả 2 lệnh đều trả về **0 errors**, code của bạn đã hoàn toàn đạt chuẩn!
