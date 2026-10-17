import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';
import { useUniwind } from 'uniwind';

import colors from '@/components/ui/colors';
import { CameraIcon } from '@/components/ui/icons';

export function CameraTabButton({ onPress, accessibilityState }: BottomTabBarButtonProps) {
  const { theme } = useUniwind();
  const isDark = theme === 'dark';
  const focused = accessibilityState?.selected;

  return (
    <View style={styles.container} pointerEvents="box-none">
      <Pressable
        onPress={onPress}
        style={styles.pressable}
        accessibilityRole="button"
        accessibilityLabel="Camera"
      >
        <View
          style={[
            styles.outerRing,
            {
              backgroundColor: isDark ? colors.darkTheme.background : '#FFFFFF',
              borderColor: isDark ? colors.darkTheme.background : '#FFFFFF',
            },
          ]}
        >
          <LinearGradient
            colors={focused
              ? (isDark ? ['#6F984C', '#587A3C'] : [colors.primary[600], colors.primary[700]])
              : (isDark ? ['#91B86C', '#779F56'] : [colors.primary[500], colors.primary[600]])}
            style={styles.gradient}
          >
            <CameraIcon color="#FFFFFF" width={30} height={30} />
          </LinearGradient>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressable: {
    top: -10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 3.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.darkTheme.accent,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 10,
  },
  gradient: {
    width: 59,
    height: 59,
    borderRadius: 29.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
