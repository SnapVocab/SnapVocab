import type { ReactNode } from 'react';
import type { SharedValue } from 'react-native-reanimated';

/** Cấu hình cho từng nút lựa chọn con (Sub-action) */
export type SpeedDialAction = {
  id: string;
  label: string; // Nhãn hiển thị bên cạnh nút
  icon: ReactNode; // Icon hiển thị trong nút tròn
  bgColorClass?: string; // Màu nền Tailwind (mặc định bg-neutral-800)
  textColorClass?: string;
  onPress: () => void; // Hàm kích hoạt khi bấm vào action
};

export type SpeedDialFABProps = {
  actions: SpeedDialAction[]; // Danh sách các action con
  mainIcon?: ReactNode; // Icon của nút chính (mặc định là dấu +)
  className?: string; // Tùy chỉnh vị trí/spacing (ví dụ: bottom-10)
  testID?: string;
};

export type SpeedDialItemProps = {
  action: SpeedDialAction;
  isOpen: boolean;
  animation: SharedValue<number>;
  order: number;
  onPress: () => void;
};
