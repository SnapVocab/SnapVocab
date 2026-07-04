import { Text, View } from 'react-native';

import { Image } from './image';

type AvatarProps = {
  name: string;
  size?: number;
  avatarUrl?: string | null;
};

export function Avatar({ name, size = 40, avatarUrl }: AvatarProps) {
  const firstLetter = name.trim().charAt(0).toUpperCase();
  const ringThickness = size * 0.04;

  const inner = avatarUrl
    ? (
        <Image
          source={{ uri: avatarUrl }}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
          }}
        />
      )
    : (
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: '#22C55E',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              color: '#FFFFFF',
              fontSize: size * 0.45,
              fontWeight: '700',
            }}
          >
            {firstLetter}
          </Text>
        </View>
      );

  return (
    <View
      style={{
        width: size + ringThickness * 4,
        height: size + ringThickness * 4,
        borderRadius: (size + ringThickness * 4) / 2,
        backgroundColor: '#3B82F6',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          width: size + ringThickness * 2,
          height: size + ringThickness * 2,
          borderRadius: (size + ringThickness * 2) / 2,
          backgroundColor: '#FFFFFF',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {inner}
      </View>
    </View>
  );
}
