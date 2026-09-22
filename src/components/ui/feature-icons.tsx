import type { StyleProp, ViewStyle } from 'react-native';
import * as React from 'react';
import { View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

export type FeatureIconProps = {
  size?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * SnapCamera3D: Custom 3D Camera icon dành riêng cho SnapVocab.
 * Thân camera màu cam Mascot thương hiệu, lens quang học lớn
 * với tâm nhận diện chữ 'A' (tượng trưng cho AI quét từ vựng).
 */
export function SnapCamera3D({ size = 48, style }: FeatureIconProps) {
  return (
    <View style={[{ width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <Defs>
          <RadialGradient id="camDropShadow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#0F172A" stopOpacity="0.25" />
            <Stop offset="100%" stopColor="#0F172A" stopOpacity="0" />
          </RadialGradient>

          <LinearGradient id="camBodyGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#FFA43A" />
            <Stop offset="40%" stopColor="#FF8A00" />
            <Stop offset="100%" stopColor="#E06A00" />
          </LinearGradient>

          <LinearGradient id="lensRingGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#FFFFFF" />
            <Stop offset="50%" stopColor="#E2E8F0" />
            <Stop offset="100%" stopColor="#94A3B8" />
          </LinearGradient>

          <RadialGradient id="lensGlassGrad" cx="35%" cy="35%" r="65%">
            <Stop offset="0%" stopColor="#1E293B" />
            <Stop offset="60%" stopColor="#0F172A" />
            <Stop offset="100%" stopColor="#020617" />
          </RadialGradient>
        </Defs>

        <Ellipse cx="24" cy="43" rx="18" ry="4" fill="url(#camDropShadow)" />
        <Rect x="32" y="7" width="8" height="5" rx="2" fill="#EF4444" />
        <Rect x="33" y="7" width="6" height="2" rx="1" fill="#F87171" />
        <Rect x="14" y="6" width="13" height="6" rx="2.5" fill="#FFA43A" />
        <Rect x="17" y="8" width="7" height="3" rx="1" fill="#1E293B" />
        <Rect x="4" y="11" width="40" height="29" rx="8" fill="url(#camBodyGrad)" />
        <Path d="M4 33 Q4 40 12 40 L36 40 Q44 40 44 33 L44 34 Q44 40 36 40 L12 40 Q4 40 4 34 Z" fill="#B84E00" />
        <Circle cx="10" cy="18" r="2" fill="#22C55E" />
        <Circle cx="9.5" cy="17.5" r="0.8" fill="#DCFCE7" />
        <Rect x="33" y="14" width="6" height="4" rx="1.5" fill="#FEF08A" stroke="#F59E0B" strokeWidth="0.8" />
        <Circle cx="24" cy="26" r="13" fill="url(#lensRingGrad)" stroke="#CBD5E1" strokeWidth="0.8" />
        <Circle cx="24" cy="26" r="11" fill="url(#lensGlassGrad)" />
        <Circle cx="24" cy="26" r="8.5" stroke="#00E5FF" strokeWidth="0.8" strokeDasharray="3 2" opacity="0.8" />
        <Path
          d="M20.5 30.5 L24 21.5 L27.5 30.5 M21.5 28 H26.5"
          stroke="#00E5FF"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Ellipse cx="20.5" cy="22.5" rx="3.5" ry="1.8" fill="#FFFFFF" opacity="0.65" transform="rotate(-30 20.5 22.5)" />
      </Svg>
    </View>
  );
}

/**
 * TopicBook3D: Custom 3D Open Book cho Kho Chủ Đề.
 * Quyển sách mở 3D màu xanh lá Primary với các thẻ từ vựng bay lên nhẹ nhàng.
 */
export function TopicBook3D({ size = 44, style }: FeatureIconProps) {
  return (
    <View style={[{ width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox="0 0 44 44" fill="none">
        <Defs>
          <RadialGradient id="bookDropShadow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#0F172A" stopOpacity="0.22" />
            <Stop offset="100%" stopColor="#0F172A" stopOpacity="0" />
          </RadialGradient>

          <LinearGradient id="bookCoverGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#6EE7B7" />
            <Stop offset="40%" stopColor="#58CC02" />
            <Stop offset="100%" stopColor="#2F6E00" />
          </LinearGradient>

          <LinearGradient id="pageGradLeft" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor="#E2E8F0" />
            <Stop offset="70%" stopColor="#FFFFFF" />
            <Stop offset="100%" stopColor="#CBD5E1" />
          </LinearGradient>

          <LinearGradient id="pageGradRight" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor="#CBD5E1" />
            <Stop offset="30%" stopColor="#FFFFFF" />
            <Stop offset="100%" stopColor="#E2E8F0" />
          </LinearGradient>
        </Defs>

        <Ellipse cx="22" cy="40" rx="16" ry="3.5" fill="url(#bookDropShadow)" />
        <Path
          d="M6 31 C14 30 20 32 22 34 C24 32 30 30 38 31 L38 35 C30 34 24 36 22 38 C20 36 14 34 6 35 Z"
          fill="#2F6E00"
        />
        <Path
          d="M5 30 C13 29 19 31 22 33 C25 31 31 29 39 30 L39 33 C31 32 25 34 22 36 C19 34 13 32 5 33 Z"
          fill="url(#bookCoverGrad)"
        />
        <Path
          d="M6 14 C13 13 19 15 22 17 L22 34 C19 32 13 30 6 31 Z"
          fill="url(#pageGradLeft)"
          stroke="#E2E8F0"
          strokeWidth="0.7"
        />
        <Path
          d="M38 14 C31 13 25 15 22 17 L22 34 C25 32 31 30 38 31 Z"
          fill="url(#pageGradRight)"
          stroke="#E2E8F0"
          strokeWidth="0.7"
        />
        <Path d="M21 17 L21 37 L23.5 35 L26 37 L26 17 Z" fill="#FF8A00" />
        <Path d="M10 18 H18 M10 22 H17 M10 26 H15" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round" />
        <Path d="M26 18 H34 M26 22 H33 M26 26 H30" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round" />

        <G transform="translate(27, 4) rotate(12)">
          <Rect x="0" y="0" width="13" height="8" rx="2" fill="#FEF08A" stroke="#EAB308" strokeWidth="0.8" />
          <Circle cx="2.5" cy="4" r="1" fill="#CA8A04" />
          <Path d="M5.5 3 H10.5 M5.5 5.5 H9" stroke="#713F12" strokeWidth="0.8" strokeLinecap="round" />
        </G>

        <G transform="translate(6, 4) rotate(-15)">
          <Rect x="0" y="0" width="12" height="7" rx="2" fill="#BAE6FD" stroke="#0284C7" strokeWidth="0.8" />
          <Circle cx="2.5" cy="3.5" r="0.9" fill="#0369A1" />
          <Path d="M5 3 H9.5 M5 5 H8" stroke="#0C4A6E" strokeWidth="0.8" strokeLinecap="round" />
        </G>
      </Svg>
    </View>
  );
}

/**
 * FlashcardSpin3D: Custom 3D Flashcard xoay lật & tia tốc độ cho Luyện Phản Xạ.
 * Thẻ từ vựng 3D xếp lớp nghiêng động, tia sấm chớp vàng và vệt tốc độ.
 */
export function FlashcardSpin3D({ size = 44, style }: FeatureIconProps) {
  return (
    <View style={[{ width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox="0 0 44 44" fill="none">
        <Defs>
          <RadialGradient id="cardDropShadow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#0284C7" stopOpacity="0.25" />
            <Stop offset="100%" stopColor="#0284C7" stopOpacity="0" />
          </RadialGradient>

          <LinearGradient id="backCardGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#BAE6FD" />
            <Stop offset="100%" stopColor="#38BDF8" />
          </LinearGradient>

          <LinearGradient id="frontCardGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#FFFFFF" />
            <Stop offset="60%" stopColor="#F0F9FF" />
            <Stop offset="100%" stopColor="#E0F2FE" />
          </LinearGradient>

          <LinearGradient id="lightningGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#FEF08A" />
            <Stop offset="40%" stopColor="#FACC15" />
            <Stop offset="100%" stopColor="#EA580C" />
          </LinearGradient>
        </Defs>

        <Ellipse cx="22" cy="39" rx="16" ry="3.5" fill="url(#cardDropShadow)" />

        <G transform="rotate(-12 21 22)">
          <Rect x="8" y="7" width="22" height="28" rx="5" fill="#0369A1" opacity="0.3" />
          <Rect x="8" y="5" width="22" height="28" rx="5" fill="url(#backCardGrad)" stroke="#0284C7" strokeWidth="1" />
          <Rect x="12" y="9" width="14" height="3" rx="1.5" fill="#FFFFFF" opacity="0.8" />
          <Path d="M12 16 H20 M12 20 H18" stroke="#0369A1" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
        </G>

        <G transform="rotate(6 23 23)">
          <Rect x="11" y="8" width="23" height="29" rx="5.5" fill="#000000" opacity="0.15" />
          <Rect x="11" y="6" width="23" height="29" rx="5.5" fill="url(#frontCardGrad)" stroke="#0284C7" strokeWidth="1.5" />
          <Path d="M11 11.5 C11 8.5 13.5 6 16.5 6 L28.5 6 C31.5 6 34 8.5 34 11.5 L34 13 L11 13 Z" fill="#38BDF8" />
          <Circle cx="15" cy="9.5" r="1.5" fill="#FFFFFF" />
          <Path d="M15 17 H27 M15 20 H23" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round" />
          <Path
            d="M24 19 L17 26 H22 L20 33 L28 24 H23 Z"
            fill="url(#lightningGrad)"
            stroke="#B45309"
            strokeWidth="0.8"
            strokeLinejoin="round"
          />
        </G>

        <Circle cx="7" cy="18" r="1.5" fill="#38BDF8" opacity="0.8" />
        <Path d="M3 14 Q6 12 9 13" stroke="#0284C7" strokeWidth="1.8" strokeLinecap="round" />
        <Path d="M35 12 Q38 14 41 17" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" />
        <Circle cx="37" cy="27" r="1.2" fill="#F59E0B" opacity="0.8" />
      </Svg>
    </View>
  );
}

/**
 * QuizChallenge3D: Custom 3D Quiz & Bài test phản xạ cho SnapVocab.
 * Thẻ câu hỏi 3D màu tím Violet với huy hiệu hỏi chấm '?' phát sáng.
 */
export function QuizChallenge3D({ size = 44, style }: FeatureIconProps) {
  return (
    <View style={[{ width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox="0 0 44 44" fill="none">
        <Defs>
          <RadialGradient id="quizDropShadow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#4C1D95" stopOpacity="0.25" />
            <Stop offset="100%" stopColor="#4C1D95" stopOpacity="0" />
          </RadialGradient>

          <LinearGradient id="quizCardGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#A855F7" />
            <Stop offset="40%" stopColor="#8B5CF6" />
            <Stop offset="100%" stopColor="#6D28D9" />
          </LinearGradient>

          <LinearGradient id="questionBadgeGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#FEF08A" />
            <Stop offset="50%" stopColor="#FACC15" />
            <Stop offset="100%" stopColor="#EAB308" />
          </LinearGradient>

          <LinearGradient id="optionCorrectGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor="#DCFCE7" />
            <Stop offset="100%" stopColor="#BBF7D0" />
          </LinearGradient>
        </Defs>

        <Ellipse cx="22" cy="40" rx="16" ry="3.5" fill="url(#quizDropShadow)" />
        <Rect x="6" y="6" width="32" height="32" rx="7" fill="url(#quizCardGrad)" />
        <Path d="M6 31 C6 35 9 38 13 38 L31 38 C35 38 38 35 38 31 L38 32 C38 36 35 39 31 39 L13 39 C9 39 6 36 6 32 Z" fill="#4C1D95" />
        <Circle cx="15" cy="15" r="6.5" fill="url(#questionBadgeGrad)" stroke="#CA8A04" strokeWidth="0.8" />
        <Path
          d="M13.5 13.5 C13.5 12.5 14.2 11.8 15.2 11.8 C16.2 11.8 16.8 12.4 16.8 13.2 C16.8 14.1 16 14.6 15.4 15.1 C15.1 15.4 15 15.7 15 16.2 M15 18 H15.1"
          stroke="#713F12"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <Path d="M29 9 L26 14 H30 L27 19 L32 13 H28 Z" fill="#FDE047" />

        <G transform="translate(10, 23)">
          <Rect x="0" y="0" width="24" height="6.5" rx="3" fill="url(#optionCorrectGrad)" stroke="#22C55E" strokeWidth="0.8" />
          <Circle cx="3.5" cy="3.25" r="1.8" fill="#16A34A" />
          <Path d="M2.5 3.25 L3.2 4 L4.5 2.5" stroke="#FFFFFF" strokeWidth="0.7" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M7 3.25 H20" stroke="#15803D" strokeWidth="1.2" strokeLinecap="round" />
        </G>

        <G transform="translate(10, 31)">
          <Rect x="0" y="0" width="24" height="5.5" rx="2.5" fill="#EDE9FE" opacity="0.9" />
          <Circle cx="3.5" cy="2.75" r="1.5" fill="#8B5CF6" />
          <Path d="M7 2.75 H17" stroke="#6D28D9" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
        </G>

        <Path d="M37 6 L38 8 L40 9 L38 10 L37 12 L36 10 L34 9 L36 8 Z" fill="#FDE047" />
      </Svg>
    </View>
  );
}
