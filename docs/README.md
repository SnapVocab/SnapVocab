# SnapVocab Developer Documentation

Bộ tài liệu hướng dẫn kỹ thuật chuẩn hóa dành cho lập trình viên dự án **SnapVocab**. Toàn bộ tài liệu được viết súc tích, thực tế, kèm mã nguồn mẫu copy-paste dùng ngay.

---

## 📚 Danh mục Hướng dẫn Kỹ thuật

### 1. Luồng Điều hướng & Giao diện
* **[Expo Router & Nested Stacks](./navigation.md)**
  * File-based Routing & Route Groups `(auth)`, `(app)`, `(tabs)`.
  * Cơ chế Auth Stack: Vì sao `(auth)` chung 1 stack & chuyển giao bằng `replace()`.
  * Cách chuyển trang với `useRouter`, truyền nhận params.
  * Bottom Tabs & Nút tròn Camera Scanner ở giữa.
* **[Khung Giao diện: SafeAreaView & Bàn phím](./layout-and-keyboard.md)**
  * Chống che Notch, Dynamic Island và thanh Home Bar bằng `SafeAreaView`.
  * Tự động đẩy nội dung khi mở bàn phím bằng `react-native-keyboard-controller`.
  * Khắc phục lỗi bấm Submit bị trượt với `keyboardShouldPersistTaps="handled"`.
  * Golden Screen Template (Mẫu khung màn hình chuẩn).
* **[Bộ UI 3D Gamification & Tùy biến Component](./components.md)**
  * Nút bấm 3D (`Button`): 9 biến thể màu, các kích cỡ, hiệu ứng cơ học nảy lún 3D.
  * Ô nhập liệu 3D (`Input`): Tích hợp sẵn `isPassword` toggle mắt, auto-error, `hint`.
  * Nhập mã OTP 6 số (`OtpInput`): 6 khối 3D tự nhảy ô, lùi ô, dán mã.
  * Thẻ 3D (`Card` & `CardInteractive`).
  * Linh vật 3D (`Mascot`), Chữ hiển thị (`Text`) & Thư viện Icon (`createIcon`).

### 2. Quản lý Dữ liệu & State
* **[Quản lý State (Zustand) & Bộ nhớ (MMKV)](./state-and-storage.md)**
  * In-Memory Store (state tạm thời) vs Persisted Store (lưu offline MMKV).
  * Quy tắc lấy state bằng Standard Selector (`s => s.foo`) tránh re-render thừa.
  * Đọc/ghi trực tiếp bộ nhớ siêu tốc MMKV (`storage.set`, `storage.getString`).
* **[Gọi API & Custom Hooks với React Query](./api-and-queries.md)**
  * Cơ chế Axios Client tự gắn Bearer Token & tự động refresh token khi 401.
  * Mẫu Custom Hook `useMutation` (Thêm/Sửa/Xóa) & tự làm mới cache với `invalidateQueries`.
  * Mẫu Custom Hook `useQuery` (Lấy dữ liệu GET).
  * Kỹ thuật kết hợp React Query với bộ lọc từ Zustand Store.
* **[Xử lý Form & Bắt lỗi với React Hook Form + Zod](./forms-and-validation.md)**
  * Công thức 4 bước cho mọi form: Zod Schema → useForm → Controller → handleSubmit.
  * Xác thực mật khẩu khớp nhau bằng `refine`.
  * Các hàm tiện ích: `reset()`, `setValue()`, `watch()`, `isSubmitting`.

### 3. Kiến trúc & Quy chuẩn
* **[Mô hình Kiến trúc 3 Tầng](./architecture.md)**
  * `src/app/` (Routing) → `src/features/` (Mô-đun độc lập) → `src/components/ui/` (Shared primitives).
* **[Quy chuẩn Viết Code (Coding Rules & Conventions)](./coding-rules.md)**
  * Bảng Do's & Don'ts bắt buộc.
  * Quy chuẩn Đường dẫn Import (`@/`), Styling Tailwind (Uniwind), Đa ngôn ngữ (i18n).
  * Checklist kiểm tra trước khi commit (`pnpm type-check`, `pnpm lint`).

---

## 🚀 Lệnh thường dùng (Cheat Sheet)

```bash
# Khởi động Expo dev server
pnpm start

# Chạy trên máy ảo / thiết bị thật
pnpm android
pnpm ios

# Kiểm tra lỗi TypeScript
pnpm type-check

# Kiểm tra & tự sửa lỗi định dạng ESLint
pnpm lint
pnpm lint:fix

# Chạy kiểm tra toàn diện
pnpm check-all
```
