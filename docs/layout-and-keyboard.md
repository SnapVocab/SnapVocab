# Hướng dẫn Xử lý Safe Area & Bàn phím (Keyboard Handling) — SnapVocab

Tài liệu hướng dẫn cách tạo khung màn hình chuẩn: chống che tai thỏ (Notch), chống che thanh Home bar và tự động đẩy giao diện mượt mà khi bàn phím ảo xuất hiện.

---

## 1. 4 Vấn đề Cố hữu trên Mobile & Cách SnapVocab Giải quyết

| Vấn đề | Hậu quả nếu không xử lý | Giải pháp của SnapVocab |
|---|---|---|
| **Tai thỏ (Notch) / Dynamic Island** | Tiêu đề hoặc nút Back bị thụt vào trong cụm camera | `<SafeAreaView>` tự động đệm đỉnh |
| **Thanh vạch đáy (Home Indicator)** | Nút bấm dưới cùng bị che khuất hoặc khó chạm | `<SafeAreaView>` tự động đệm đáy |
| **Bàn phím ảo che mất ô nhập & nút** | Người dùng không thấy nội dung đang gõ | `<KeyboardAvoidingView>` từ `react-native-keyboard-controller` |
| **Bấm nút Submit bị trượt** | Chạm lần 1 chỉ ẩn bàn phím, phải chạm lần 2 mới gửi | `keyboardShouldPersistTaps="handled"` trên `ScrollView` |

---

## 2. Khung Màn Hình Chuẩn (The Golden Screen Template)

> **Đây là template chuẩn nhất bạn nên copy cho MỌI màn hình có chứa Form nhập liệu:**

```tsx
import * as React from 'react';
import { ScrollView, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { FocusAwareStatusBar, SafeAreaView, Text, Button } from '@/components/ui';

export function StandardFormScreen() {
  return (
    // 1. SafeAreaView: Đảm bảo không bị che tai thỏ và vạch đáy
    <SafeAreaView style={{ flex: 1 }} className="flex-1 bg-background">
      {/* 2. FocusAwareStatusBar: Tự chỉnh màu thanh pin/sóng theo Dark/Light mode */}
      <FocusAwareStatusBar />

      {/* 3. KeyboardAvoidingView: Tự đẩy nội dung lên khi bàn phím xuất hiện */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        {/* 4. ScrollView: Cho phép cuộn khi màn hình nhỏ + bấm ăn ngay */}
        <ScrollView
          contentContainerClassName="px-6 py-8"
          keyboardShouldPersistTaps="handled"
        >
          <Text className="text-2xl font-black text-mascot-navy">
            Tiêu đề màn hình
          </Text>

          {/* Nội dung form tại đây */}
          <View className="mt-4 gap-4">
            {/* ...Các ô Input... */}
          </View>

          <Button label="Xác nhận" variant="primary" className="mt-6" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
```

---

## 3. Chi tiết Từng Thành phần Bắt buộc

### 1. `SafeAreaView` (từ `@/components/ui`)
* Luôn khai báo `style={{ flex: 1 }}` và `className="flex-1 bg-background"`.
* **Trường hợp màn hình nằm trong Bottom Tabs:** Vì thanh Tab Bar bên dưới đã tự tính khoảng cách an toàn, bạn có thể chỉ định chỉ đệm đỉnh:
  ```tsx
  <SafeAreaView edges={['top']} style={{ flex: 1 }} className="flex-1 bg-background">
  ```

### 2. `KeyboardAvoidingView` (từ `react-native-keyboard-controller`)
* Dự án sử dụng thư viện `react-native-keyboard-controller` (thay vì component mặc định của React Native) vì hiệu năng native 60fps cực mượt và hoạt động hoàn hảo trên cả iOS lẫn Android.
* Luôn sử dụng prop `behavior="padding"`.

### 3. `ScrollView` với `keyboardShouldPersistTaps="handled"`
* ⚠️ **Cực kỳ quan trọng**: Nếu thiếu prop `keyboardShouldPersistTaps="handled"`, khi bàn phím đang mở và người dùng bấm vào nút Submit, hệ điều hành sẽ nuốt sự kiện bấm đó để tắt bàn phím trước, khiến người dùng phải bấm nút lần thứ hai thì form mới submit!
* Dùng `contentContainerClassName` để padding các cạnh (`px-6 py-8`).

---

## 4. Xử lý Màn hình KHÔNG CUỘN (Bấm ra ngoài để tắt bàn phím)

Đối với các màn hình ngắn (hoặc popup modal) không muốn dùng `ScrollView`:

```tsx
import { Keyboard, TouchableWithoutFeedback, View } from 'react-native';

export function ShortModalScreen() {
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View className="flex-1 p-6 justify-center">
        {/* Chạm vào bất kỳ khoảng trống nào sẽ tự hạ bàn phím xuống */}
        <Input label="Nhập nhanh" />
        <Button label="Xong" className="mt-4" />
      </View>
    </TouchableWithoutFeedback>
  );
}
```
