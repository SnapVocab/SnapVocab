# Hướng dẫn Navigation (Expo Router) — SnapVocab

Tài liệu hướng dẫn cách sử dụng Expo Router v4 trong dự án SnapVocab. Viết ngắn gọn, trực diện, không lý thuyết rườm rà.

---

## 1. Tư duy cốt lõi: File-Based Routing

Mỗi file đặt trong thư mục `src/app/` tự động trở thành một màn hình (route).

* **Tên file = Tên route**: `src/app/welcome.tsx` → route `/welcome`.
* **Thư mục ngoặc tròn `(...)` = Route Group**: Dùng để gom nhóm logic, **không ảnh hưởng đến URL**.
  * `src/app/(auth)/login.tsx` → route `/login` (không phải `/(auth)/login`).
  * `src/app/(app)/(tabs)/index.tsx` → route `/`.
* **File `_layout.tsx`**: File layout bọc tất cả các màn hình con cùng cấp (dùng để cấu hình Stack, Tabs, Auth Gate, Header).

---

## 2. Quy tắc vàng (The Golden Rule)

> **File trong `src/app/` CHỈ ĐƯỢC PHÉP re-export từ `src/features/`. TUYỆT ĐỐI KHÔNG viết UI, state, useEffect hoặc logic tại đây.**

### ❌ SAI (Viết logic trong route):
```tsx
// src/app/login.tsx
export default function Login() {
  const [email, setEmail] = useState('');
  return <View><Input value={email} /></View>; // SAI KIẾN TRÚC!
}
```

### ✅ ĐÚNG (Chỉ re-export 1 dòng):
```tsx
// src/app/(auth)/login.tsx
export { LoginScreen as default } from '@/features/auth/login-screen';
```

Mọi logic, UI, hooks, components đều nằm tại `src/features/<tên-feature>/`.

---

## 3. Cấu trúc điều hướng của dự án

```
src/app/
├── _layout.tsx                     # Root Layout (Providers: React Query, Theme, Toast)
├── welcome.tsx                     # Màn chào đón (/welcome)
├── (auth)/                         # Nhóm route chưa đăng nhập
│   ├── _layout.tsx                 # Stack navigator cho Auth (headerShown: false)
│   ├── login.tsx                   # /login
│   ├── register.tsx                # /register
│   ├── verify.tsx                  # /verify (nhập mã OTP kích hoạt)
│   ├── forgot-password.tsx         # /forgot-password
│   ├── verify-reset-code.tsx       # /verify-reset-code
│   └── reset-password.tsx          # /reset-password
└── (app)/                          # Nhóm route đã đăng nhập (CẦN AUTHEN)
    ├── _layout.tsx                 # Auth Gate (chưa login -> đá về /welcome)
    └── (tabs)/                     # Bottom Navigation (5 vị trí)
        ├── _layout.tsx             # Cấu hình thanh Bottom Tab Bar
        ├── index.tsx               # Tab 1: Home (/)
        ├── learn.tsx               # Tab 2: Learn (/learn)
        ├── camera.tsx              # Tab 3: Camera Scanner (Nút tròn nổi chính giữa)
        ├── community.tsx           # Tab 4: Community (/community)
        └── profile.tsx             # Tab 5: Profile (/profile)
```

### Cơ chế Auth Gate (`src/app/(app)/_layout.tsx`):
```tsx
export default function AppLayout() {
  const status = useAuthStore(s => s.status);

  // Nếu chưa đăng nhập, tự động chuyển về /welcome
  if (status !== 'signIn') {
    return <Redirect href="/welcome" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
```

---

## 3.1. Bản chất cơ chế Stack: Vì sao `(auth)` chung 1 Stack?

Dự án sử dụng cơ chế **Nested Stacks (Stack lồng Stack)**:

```
[ Root Stack (_layout.tsx) ]
  ├── welcome
  ├── [ (auth) Stack ] ─── Quản lý toàn bộ luồng xác thực
  │     ├── login
  │     ├── register
  │     ├── verify
  │     ├── forgot-password
  │     ├── verify-reset-code
  │     └── reset-password
  └── [ (app) Stack ] ──── Quản lý toàn bộ app sau đăng nhập
        └── (tabs) Bottom Navigation (Home, Learn, Camera, Community, Profile)
```

### 1. Luồng di chuyển bên trong `(auth)` Stack:
Tất cả màn hình Auth đều nằm chung trong `src/app/(auth)/_layout.tsx`:
* Khi ở `login` bấm sang `register` → dùng `router.push('/register')`. Màn `register` được đẩy lên đỉnh ngăn xếp.
* Ở `register` bấm nút quay lại → gọi `router.back()`. Ngăn xếp pop ra và người dùng trở về `login`.
* Luồng quên mật khẩu: `login` → `push('/forgot-password')` → `push('/verify-reset-code')` → `push('/reset-password')`. Người dùng có thể `back()` từng bước một cách tự nhiên.

### 2. Chuyển giao giữa 2 Stack khi Đăng nhập / Đăng xuất:
* **Khi Đăng nhập thành công:** BẮT BUỘC dùng `router.replace('/')` (hoặc `router.replace('/(app)')`).
  * ⚠️ **Lý do:** `replace` sẽ hủy toàn bộ ngăn xếp Auth. Nếu bạn dùng `push('/')`, người dùng bấm phím Back vật lý trên Android sẽ bị quay trở lại màn hình Login dù đã đăng nhập!
* **Khi Đăng xuất:**
  * Gọi action `logout()` trong Zustand store (`status` chuyển thành `'signOut'`).
  * Gọi `router.replace('/welcome')` để xóa toàn bộ lịch sử màn hình và quay về màn Welcome.

### 3. Tự động bảo vệ (Auth Guards ở 2 chiều):
* **`(app)/_layout.tsx`:** Nếu `status !== 'signIn'` → chặn lại và `Redirect href="/welcome"`.
* **`(auth)/_layout.tsx`:** Nếu `status === 'signIn'` (đã đăng nhập rồi mà cố truy cập `/login`) → chặn lại và `Redirect href="/"`.


---

## 4. Cách chuyển trang (`useRouter`)

Luôn dùng hook `useRouter` từ `expo-router`:

```tsx
import { useRouter } from 'expo-router';

const router = useRouter();
```

### Các lệnh điều hướng cơ bản:

| Lệnh | Ý nghĩa | Khi nào dùng |
|---|---|---|
| `router.push('/login')` | Đẩy màn hình mới lên ngăn xếp (stack) | Chuyển trang bình thường, người dùng có thể bấm back để quay lại |
| `router.replace('/')` | Thay thế màn hình hiện tại (xóa lịch sử màn cũ) | Sau khi Login thành công, Logout, hoặc Reset password thành công |
| `router.back()` | Quay lại màn hình trước đó | Nút Back trên header hoặc icon mũi tên |

---

## 5. Truyền và nhận tham số (Params)

### Truyền tham số:
```tsx
// Cách 1: Truyền bằng object params (Khuyên dùng)
router.push({
  pathname: '/(auth)/verify',
  params: { email: 'user@example.com' },
});

// Cách 2: Truyền bằng Query String
router.push(`/verify-reset-code?email=${encodeURIComponent(email)}`);
```

### Nhận tham số tại màn hình đích:
Dùng hook `useLocalSearchParams`:

```tsx
import { useLocalSearchParams } from 'expo-router';

export function VerifyScreen() {
  // Khai báo type rõ ràng cho params
  const { email } = useLocalSearchParams<{ email: string }>();

  return <Text>Xác thực cho email: {email}</Text>;
}
```

---

## 6. Hướng dẫn thêm một màn hình mới (3 bước)

Giả sử bạn cần tạo màn hình **"Chi tiết từ vựng" (Vocabulary Detail)**:

### Bước 1: Tạo UI & Logic trong `features/`
Tạo file `src/features/vocabulary/vocabulary-detail-screen.tsx`:
```tsx
import { View, Text, Button, SafeAreaView, FocusAwareStatusBar } from '@/components/ui';
import { useRouter, useLocalSearchParams } from 'expo-router';

export function VocabularyDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <FocusAwareStatusBar />
      <View className="flex-1 p-4">
        <Text className="text-xl font-bold">Từ vựng ID: {id}</Text>
        <Button label="Quay lại" onPress={() => router.back()} className="mt-4" />
      </View>
    </SafeAreaView>
  );
}
```

### Bước 2: Tạo route file trong `src/app/`
Tạo file `src/app/(app)/vocabulary/[id].tsx`:
```tsx
export { VocabularyDetailScreen as default } from '@/features/vocabulary/vocabulary-detail-screen';
```

### Bước 3: Điều hướng tới màn hình đó
Tại bất kỳ đâu (ví dụ danh sách từ vựng):
```tsx
router.push(`/(app)/vocabulary/${item.id}`);
```

---

## 7. Cấu hình Tabs & Nút tròn giữa

Thanh điều hướng dưới đáy được định nghĩa tại `src/app/(app)/(tabs)/_layout.tsx`:

* **Icon & Title**: Khai báo qua `options={{ title: '...', tabBarIcon: ({ color }) => ... }}`.
* **Nút Camera nổi ở giữa**:
  Sử dụng `tabBarButton` để thay thế nút mặc định bằng component tuỳ biến:
  ```tsx
  <Tabs.Screen
    name="camera"
    options={{
      title: '',
      headerShown: false,
      tabBarButton: props => <CameraTabButton {...props} />,
      tabBarStyle: { display: 'none' }, // Ẩn tabbar khi đang ở màn camera
    }}
  />
  ```
* **Ẩn Tab Bar trên một màn hình cụ thể**: Thêm `tabBarStyle: { display: 'none' }` vào `options` của screen đó.

---

## 8. Những lỗi thường gặp & Cách tránh

1. **Lỗi `Cannot read property of undefined` khi lấy params**:
   * Luôn kiểm tra fallback: `const email = params.email ?? '';`.
2. **Lồng lộn Stack/Tabs**:
   * Không bao giờ bọc `NavigationContainer` thủ công trong Expo Router. Mọi thứ được giải quyết tự động thông qua các file `_layout.tsx`.
3. **Bị kẹt luồng sau khi Login**:
   * Phải dùng `router.replace('/')` thay vì `router.push('/')` để người dùng không thể bấm nút Back quay lại màn Login.
