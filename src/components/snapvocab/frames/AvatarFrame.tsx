import type { StyleProp, ViewStyle } from 'react-native';
import * as React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

export type AvatarFrameSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero' | number;

const SIZE_PRESETS: Record<string, number> = {
  xs: 36,
  sm: 48,
  md: 72,
  lg: 96,
  xl: 128,
  hero: 160,
};

export type AvatarFrameProps = {
  /** Remote image URI for avatar frame from backend config */
  frameUrl?: string | null;
  /** Remote image URI for user avatar */
  avatarUri?: string | null;
  /** Local require(...) source for mascot or bundled avatar */
  avatarSource?: any;
  /** Fallback initials text when no avatar image exists (e.g. 'SN') */
  initials?: string;
  /** Size preset or numeric pixel dimension */
  size?: AvatarFrameSize;
  /** Optional badge element at bottom right (e.g. level, rank or streak flame) */
  badgeComponent?: React.ReactNode;
  /** Called when the frame image fails to load; the frame is then dropped for that URL */
  onFrameError?: () => void;
  /** Callback when the remote avatar image fails to load */
  onAvatarError?: () => void;
  /** Press handler */
  onPress?: () => void;
  /** Custom children to render inside the avatar aperture */
  children?: React.ReactNode;
  /** Additional container style */
  style?: StyleProp<ViewStyle>;
  /** Tailwind / className */
  className?: string;
};

export const AvatarFrame: React.FC<AvatarFrameProps> = ({
  frameUrl,
  avatarUri,
  avatarSource,
  initials = 'SV',
  size = 'md',
  badgeComponent,
  onFrameError,
  onAvatarError,
  onPress,
  children,
  style,
  className = '',
}) => {
  const dimension = typeof size === 'number' ? size : SIZE_PRESETS[size] || 72;
  // The frame art lives on the server (shop item frameUrl); there is no bundled catalog.
  // A frame that fails to load is dropped for that URL,
  // so the avatar is not left shrunk inside an empty ring.
  const [failedFrameUrl, setFailedFrameUrl] = React.useState<string | null>(null);
  const shownFrameUrl = frameUrl && frameUrl !== failedFrameUrl ? frameUrl : null;
  const hasFrame = Boolean(shownFrameUrl);

  // The circular avatar aperture occupies ~58% of the frame canvas (512x512)
  // When no frame is equipped, the avatar fills 88% of the dimension
  const avatarDiameter = hasFrame ? Math.round(dimension * 0.58) : Math.round(dimension * 0.88);
  const avatarBorderRadius = Math.round(avatarDiameter / 2);

  const content = (
    <View
      style={[
        styles.container,
        { width: dimension, height: dimension },
        style,
      ]}
      className={className}
    >
      {/* 1. INNER AVATAR CIRCLE */}
      <View
        style={[
          styles.avatarWrapper,
          {
            width: avatarDiameter,
            height: avatarDiameter,
            borderRadius: avatarBorderRadius,
            backgroundColor: '#3B82F6',
          },
        ]}
      >
        {children || (avatarUri ? (
          <Image
            source={{ uri: avatarUri }}
            onError={onAvatarError}
            style={{ width: avatarDiameter, height: avatarDiameter, borderRadius: avatarBorderRadius }}
            resizeMode="cover"
          />
        ) : avatarSource ? (
          <Image
            source={avatarSource}
            style={{ width: avatarDiameter, height: avatarDiameter, borderRadius: avatarBorderRadius }}
            resizeMode="cover"
          />
        ) : (
          <Text
            style={[
              styles.initialsText,
              { fontSize: Math.max(10, Math.round(avatarDiameter * 0.38)) },
            ]}
          >
            {initials}
          </Text>
        ))}
      </View>

      {/* 2. OVERLAY FRAME (PNG with transparent center) */}
      {shownFrameUrl && (
        <Image
          testID="avatar-frame-overlay"
          source={{ uri: shownFrameUrl }}
          style={[
            styles.frameOverlay,
            { width: dimension, height: dimension },
          ]}
          resizeMode="contain"
          onError={() => {
            setFailedFrameUrl(shownFrameUrl);
            onFrameError?.();
          }}
        />
      )}

      {/* 3. OPTIONAL BADGE (Bottom Right) */}
      {badgeComponent && (
        <View style={styles.badgeContainer}>
          {badgeComponent}
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1.0 })}
      >
        {content}
      </Pressable>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarWrapper: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  initialsText: {
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  frameOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 2,
    pointerEvents: 'none',
  },
  badgeContainer: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    zIndex: 3,
  },
});
