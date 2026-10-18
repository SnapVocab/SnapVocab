# Hướng dẫn Sử dụng & Tùy biến UI Components — SnapVocab

Toàn bộ các component cốt lõi nằm tại `@/components/ui`. Tất cả đều được xây dựng theo phong cách **3D Gamification** (Duolingo style), có hiệu ứng nảy/lún khi bấm và hỗ trợ Dark Mode.

---

## 1. Nút bấm 3D (`Button`)

Nút bấm có viền đáy dày 4px (`border-b-[4px]`). Khi bấm (`active`), nút lún xuống 2px và viền đáy giảm còn 2px (`active:translate-y-[2px] active:border-b-[2px]`), tạo cảm giác cơ học rất nảy.

```tsx
import { Button } from '@/components/ui';
```

### Các biến thể màu (`variant`):

| Variant | Màu sắc | Mục đích sử dụng |
|---|---|---|
| `primary` (hoặc `brand`) | Xanh lá Duolingo | Hành động chính (Bắt đầu, Tiếp tục, Đăng nhập) |
| `purple` | Tím đậm | Bài học thử thách, Nâng cấp VIP, Quiz đặc biệt |
| `mascot` (hoặc `orange`) | Cam Mascot | Tính năng nổi bật, Camera Scanner, Nhiệm vụ |
| `info` (hoặc `blue`) | Xanh dương | Thông tin, Xem từ điển, Ngữ pháp |
| `reward` (hoặc `gold`) | Vàng kim | Nhận thưởng nhiệm vụ, Coin, XP, Badge |
| `danger` | Đỏ | Đăng xuất, Xóa dữ liệu, Bỏ cuộc |
| `secondary` | Trắng viền xám | Hành động phụ (Quay lại, Hủy, Bỏ qua) |
| `outline` | Nền trong suốt | Đặt trên nền tối / nền ảnh |
| `ghost` | Không viền | Nút dạng chữ đơn giản |

### Các kích thước (`size`):
* `sm`: Chiều cao 40px, text nhỏ (dùng cho nút bấm phụ, nút gửi lại OTP).
* `default`: Chiều cao 56px (Chuẩn ngón tay bấm, khuyên dùng cho hầu hết các nút).
* `lg`: Chiều cao 64px (Dùng cho nút CTA to ở màn Welcome, Finish Quiz).
* `icon`: Nút tròn 48px chứa icon.

### Các thuộc tính (Props) quan trọng:
```tsx
<Button
  label="Bắt đầu học"           // Chữ hiển thị trên nút
  tx="home.start_learning"      // Hoặc dùng i18n key thay cho label
  variant="primary"             // Biến thể màu (xem bảng trên)
  size="default"                // 'sm' | 'default' | 'lg' | 'icon'
  loading={isSubmitting}        // Hiệu ứng 3 chấm nhảy (Bouncing Dots wave) chuẩn Duolingo
  loadingText="Đang xử lý..."   // (Tùy chọn) Chữ hiển thị kèm 3 chấm nhảy
  disabled={!isValid}           // Vô hiệu hoá nút
  icon={<PlayIcon />}           // Icon bên trái
  rightIcon={<ArrowRight />}    // Icon bên phải
  fullWidth={true}              // Mặc định true (rộng 100%). Đặt false nếu muốn nút tự co lại
  onPress={handlePress}         // Hàm xử lý click
  className="mt-4"              // Tùy biến thêm class Tailwind
/>
```

### Cách tùy biến nút bấm riêng:
Nếu cần nút co lại vừa chữ:
```tsx
<Button label="Gửi lại mã" variant="secondary" size="sm" fullWidth={false} className="px-4" />
```

---

## 2. Ô nhập liệu 3D (`Input`)

Ô nhập liệu có chiều cao 56px (`h-14`), bo góc mềm mại `rounded-2xl`, viền dày 2px rõ nét.

```tsx
import { Input } from '@/components/ui';
```

### Điểm đặc biệt:
1. **Tích hợp sẵn `isPassword`**: Tự động có nút mắt ẩn/hiện mật khẩu, không cần viết `useState(showPassword)` ở ngoài form.
2. **Tự động hiện lỗi (`error`)**: Khi có lỗi, viền chuyển đỏ `border-danger-500` và nền phớt đỏ `bg-danger-50/20`.
3. **Hỗ trợ chú thích (`hint`)**: Hiển thị dòng giải thích nhỏ bên dưới khi chưa có lỗi.

### Ví dụ sử dụng:

```tsx
// 1. Ô nhập thường có icon bên trái
<Input
  label="Email"
  placeholder="Nhập địa chỉ email"
  keyboardType="email-address"
  autoCapitalize="none"
  icon={<Mail color="#737373" />}
  value={email}
  onChangeText={setEmail}
  error={errors.email?.message}
/>

// 2. Ô nhập mật khẩu (CHỈ CẦN THÊM isPassword)
<Input
  label="Mật khẩu"
  placeholder="Nhập mật khẩu của bạn"
  isPassword={true}
  icon={<Lock color="#737373" />}
  value={password}
  onChangeText={setPassword}
  hint="Tối thiểu 6 ký tự gồm chữ và số"
  error={errors.password?.message}
/>
```

---

## 3. Nhập mã OTP 6 số (`OtpInput`)

Component chuyên dụng cho màn hình xác minh email hoặc nhập mã reset mật khẩu. Bao gồm 6 ô vuông khối 3D riêng biệt.

```tsx
import { OtpInput } from '@/components/ui';

export function VerifyCodeScreen() {
  const [code, setCode] = useState('');

  return (
    <OtpInput
      value={code}
      onChange={setCode}
      hasError={false}          // Đổi thành true để đỏ toàn bộ 6 ô khi mã sai
      disabled={isVerifying}    // Khóa khi đang chờ server phản hồi
    />
  );
}
```

### Tính năng tự động có sẵn:
* Tự nhảy con trỏ sang ô tiếp theo khi người dùng gõ số.
* Tự lùi về ô trước khi bấm phím `Backspace`.
* Hỗ trợ **Paste**: Khi copy mã 6 số từ email/tin nhắn và dán vào, component tự động điền đầy đủ cả 6 ô.
* Đổi màu trạng thái: Ô đã điền chuyển viền xanh lá, ô đang chọn có viền xanh dương.

---

## 4. Thẻ thông tin 3D (`Card` & `CardInteractive`)

Dùng để hiển thị bài học, thống kê, từ vựng hoặc nhiệm vụ hàng ngày:

```tsx
import { Card, CardInteractive, Text, View } from '@/components/ui';

// 1. Card tĩnh (không bấm)
<Card className="p-4 bg-white">
  <Text className="font-bold text-lg">Từ vựng hôm nay</Text>
  <Text className="text-neutral-500">10 từ mới đã được thêm</Text>
</Card>

// 2. CardInteractive (có hiệu ứng lún 3D khi bấm)
<CardInteractive onPress={() => router.push('/lesson/1')} className="p-4">
  <View className="flex-row items-center justify-between">
    <Text className="font-bold text-lg">Bài 1: Động vật</Text>
    <Text className="text-primary-600 font-bold">Bắt đầu ➔</Text>
  </View>
</CardInteractive>
```

---

## 5. Chữ hiển thị (`Text`) & Đa ngôn ngữ

Component `Text` từ `@/components/ui` đã được cấu hình font Inter và hỗ trợ đa ngôn ngữ trực tiếp thông qua prop `tx`:

```tsx
import { Text } from '@/components/ui';

// Cách 1: Truyền trực tiếp chữ (Không khuyến khích nếu cần đa ngôn ngữ)
<Text className="text-base font-bold text-mascot-navy">Xin chào</Text>

// Cách 2: Dùng prop tx lấy từ en.json / vi.json (Khuyên dùng)
<Text tx="welcome.title" className="text-2xl font-black" />
```

---

## 6. Linh vật 3D (`Mascot`)

Linh vật SnapVocab (chú chim Snapy) được đóng gói sẵn với các tư thế:

```tsx
import { Mascot } from '@/components/ui/mascot';

// Hiển thị linh vật với tư thế đọc sách, có hiệu ứng bay lượn nhẹ
<Mascot
  pose="read"       // 'idle' | 'read' | 'wave' | 'celebrate'
  float={true}      // Có animation bay lượn nhẹ hay không
  className="size-48"
/>
```

---

## 7. Thư viện Icon & Công thức tạo Icon mới từ SVG

Tất cả icon nằm tại `src/components/ui/icons/`.

### Cách dùng icon có sẵn:
```tsx
import { Home, LearnIcon, CameraIcon, Lock, Mail } from '@/components/ui/icons';

<Home color="#58CC02" width={24} height={24} />
```

### Công thức tạo Icon mới từ file SVG (30 giây):
Khi lấy được mã SVG từ Figma hoặc web:
1. Tạo file `src/components/ui/icons/<tên-icon>.tsx`
2. Áp dụng template chuẩn `createIcon`:

```tsx
import { createIcon } from './create-icon';

export const FireIcon = createIcon({
  viewBox: '0 0 24 24',
  elements: [
    {
      d: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z',
      stroke: '#000',
      strokeWidth: 2,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    },
  ],
});
```
3. Export trong `src/components/ui/icons/index.tsx`:
```tsx
export * from './<tên-icon>';
```
