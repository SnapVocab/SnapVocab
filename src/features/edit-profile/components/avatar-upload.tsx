import * as ImagePicker from 'expo-image-picker';
import { Pressable } from 'react-native';

import { Image, Text, View } from '@/components/ui';
import { CameraIcon } from '@/components/ui/icons';

type AvatarUploadProps = {
  avatarSource: string | null | undefined;
  displayName: string;
  onAvatarChange: (uri: string) => void;
};

export function AvatarUpload({ avatarSource, displayName, onAvatarChange }: AvatarUploadProps) {
  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted)
      return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      onAvatarChange(result.assets[0].uri);
    }
  };

  return (
    <View className="items-center pt-2">
      <Pressable onPress={pickImage}>
        <View className="relative">
          {avatarSource
            ? (
                <Image
                  source={{ uri: avatarSource }}
                  className="size-24 rounded-full"
                  style={{ borderRadius: 48 }}
                />
              )
            : (
                <View className="size-24 items-center justify-center rounded-full bg-green-500">
                  <Text className="text-3xl font-bold text-white">
                    {displayName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
          <View className="absolute right-0 bottom-0 rounded-full bg-primary-600 p-2">
            <CameraIcon fill="#FFFFFF" className="size-4" />
          </View>
        </View>
      </Pressable>
    </View>
  );
}
