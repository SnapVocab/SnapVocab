# Hướng dẫn Quản lý State (Zustand) & Bộ nhớ cục bộ (MMKV) — SnapVocab

Tài liệu hướng dẫn cách tạo và sử dụng Zustand store, kết hợp với bộ nhớ tốc độ cao MMKV.

---

## 1. Tại sao dùng MMKV thay vì AsyncStorage?

* **Nhanh hơn 30x**: MMKV được viết bằng C++, đọc ghi đồng bộ (synchronous), lưu trực tiếp vào memory-mapped files.
* **Không bị nháy UI**: Đọc dữ liệu ngay khi khởi động app mà không cần đợi `await`.
* Wrapper MMKV đã được dựng sẵn tại `src/lib/storage.tsx`.

### Cách sử dụng trực tiếp MMKV (`src/lib/storage.tsx`):
```tsx
import { storage } from '@/lib/storage';

// 1. Lưu chuỗi, số, boolean
storage.set('user_theme', 'dark');
storage.set('daily_streak', 5);
storage.set('is_onboarded', true);

// 2. Đọc giá trị
const theme = storage.getString('user_theme'); // 'dark' | undefined
const streak = storage.getNumber('daily_streak'); // 5 | undefined
const isOnboarded = storage.getBoolean('is_onboarded'); // true | undefined

// 3. Xoá giá trị
storage.remove('user_theme');
```

---

## 2. Cách code Zustand Store: 2 Loại cơ bản

Tất cả store được đặt tên theo quy ước: `src/features/<feature>/use-*-store.ts`.

### Loại 1: In-Memory Store (Mất dữ liệu khi tắt app)
Dùng cho state tạm thời của UI: mở/đóng modal, bộ lọc tạm, vị trí tab hiện tại...

```tsx
// src/features/learn/use-quiz-store.ts
import { create } from 'zustand';

type QuizState = {
  currentQuestionIndex: number;
  score: number;
  isFinished: boolean;

  // Actions
  nextQuestion: () => void;
  addScore: (points: number) => void;
  resetQuiz: () => void;
};

export const useQuizStore = create<QuizState>((set) => ({
  currentQuestionIndex: 0,
  score: 0,
  isFinished: false,

  nextQuestion: () => set(s => ({ currentQuestionIndex: s.currentQuestionIndex + 1 })),
  addScore: (points) => set(s => ({ score: s.score + points })),
  resetQuiz: () => set({ currentQuestionIndex: 0, score: 0, isFinished: false }),
}));
```

---

### Loại 2: Persisted Store (Tự động lưu vào MMKV)
Dùng cho state cần giữ lại khi người dùng tắt app bật lại: thông tin User, token đăng nhập, cài đặt âm thanh, từ đã bookmark...

```tsx
// src/features/settings/use-settings-store.ts
import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import { storage } from '@/lib/storage';

type SettingsState = {
  soundEnabled: boolean;
  hapticFeedback: boolean;
  toggleSound: () => void;
  toggleHaptic: () => void;
};

// Cấu hình adapter kết nối Zustand với MMKV
const mmkvStorage: StateStorage = {
  setItem: (name, value) => storage.set(name, value),
  getItem: (name) => storage.getString(name) ?? null,
  removeItem: (name) => storage.remove(name),
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      soundEnabled: true,
      hapticFeedback: true,

      toggleSound: () => set(s => ({ soundEnabled: !s.soundEnabled })),
      toggleHaptic: () => set(s => ({ hapticFeedback: !s.hapticFeedback })),
    }),
    {
      name: 'settings-storage', // Key lưu trong MMKV
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);
```

---

## 3. Cách dùng Store trong Component (Quy tắc Selector)

> ⚠️ **BẮT BUỘC**: Luôn truyền selector `s => s.tên_biến`.

### ✅ ĐÚNG (Chỉ re-render khi đúng biến đó thay đổi):
```tsx
export function SoundButton() {
  // Component này CHỈ re-render khi soundEnabled đổi
  const soundEnabled = useSettingsStore(s => s.soundEnabled);
  const toggleSound = useSettingsStore(s => s.toggleSound);

  return (
    <Button
      label={soundEnabled ? 'Bật âm thanh' : 'Tắt âm thanh'}
      onPress={toggleSound}
    />
  );
}
```

### ❌ SAI (Gây re-render thừa toàn bộ component):
```tsx
export function SoundButton() {
  // SAI: Component sẽ bị re-render lại khi BẤT KỲ biến nào trong store thay đổi!
  const { soundEnabled, toggleSound, hapticFeedback } = useSettingsStore();
  ...
}
```

---

## 4. Đọc/Ghi State bên ngoài Component (trong hàm thường / API)

Nếu bạn cần đọc hoặc cập nhật state ở file helper, axios interceptor mà không phải React Component:

```tsx
import { useAuthStore } from '@/features/auth/use-auth-store';

// Đọc giá trị ngay lập tức (không cần hook):
const token = useAuthStore.getState().accessToken;

// Gọi action cập nhật:
useAuthStore.getState().logout();
```
