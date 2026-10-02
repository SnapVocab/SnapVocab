import { zodResolver } from '@hookform/resolvers/zod';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import * as z from 'zod';

import {
  Button,
  FocusAwareStatusBar,
  Image,
  Input,
  Pressable,
  SafeAreaView,
  showErrorMessage,
  showSuccessMessage,
  Text,
  View,
} from '@/components/ui';
import { CameraIcon, ChevronLeftIcon } from '@/components/ui/icons';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { translate } from '@/lib/i18n';
import { useMe, useUpdateProfile, useUploadAvatar } from './api';
import { fullName, initials } from './display';
import { useIconColors } from './use-icon-colors';

const MAX_BIO = 200;

const schema = z.object({
  firstName: z.string().trim().min(1, translate('edit_profile.first_name_required')).max(50, translate('edit_profile.too_long', { max: 50 })),
  lastName: z.string().trim().max(50, translate('edit_profile.too_long', { max: 50 })),
  bio: z.string().trim().max(MAX_BIO, translate('edit_profile.too_long', { max: MAX_BIO })),
});

type FormValues = z.infer<typeof schema>;

/** MH-PROFILE-02: name, bio and avatar. */
export function EditProfileScreen() {
  const router = useRouter();
  const stored = useAuthStore(s => s.user);
  const { data } = useMe();
  const user = data ?? stored;

  const iconColor = useIconColors();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();

  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      bio: user?.bio ?? '',
    },
  });

  const pickAvatar = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showErrorMessage(translate('edit_profile.avatar_permission_denied'));
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });
      if (result.canceled)
        return;

      const asset = result.assets[0];
      uploadAvatar.mutate(
        { uri: asset.uri, fileName: asset.fileName ?? asset.uri.split('/').pop() ?? 'avatar.jpg' },
        {
          onSuccess: () => showSuccessMessage(translate('edit_profile.avatar_updated')),
          onError: () => showErrorMessage(translate('edit_profile.avatar_error')),
        },
      );
    }
    catch {
      showErrorMessage(translate('edit_profile.avatar_error'));
    }
  };

  const onSubmit = (values: FormValues) => {
    updateProfile.mutate(values, {
      onSuccess: () => {
        showSuccessMessage(translate('edit_profile.success'));
        router.back();
      },
      onError: () => showErrorMessage(translate('edit_profile.error')),
    });
  };

  const name = fullName(user);

  return (
    <SafeAreaView style={{ flex: 1 }} className="flex-1 bg-background" edges={['top']}>
      <FocusAwareStatusBar />

      <View className="h-14 flex-row items-center border-b border-neutral-100 bg-white px-4 dark:border-neutral-800 dark:bg-neutral-900">
        <Pressable
          onPress={() => router.back()}
          testID="edit-profile-back"
          className="-ml-1 size-10 items-center justify-center rounded-full active:bg-neutral-100"
        >
          <ChevronLeftIcon color={iconColor.header} />
        </Pressable>
        <Text
          className="mr-9 flex-1 text-center font-nunito text-lg font-extrabold text-mascot-navy dark:text-white"
          tx="edit_profile.title"
        />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="items-center rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-sm shadow-black/5 dark:border-neutral-800 dark:bg-neutral-900">
            <View className="relative mb-3.5 items-center justify-center">
              <Pressable
                onPress={pickAvatar}
                disabled={uploadAvatar.isPending}
                testID="edit-profile-avatar"
                className="size-28 items-center justify-center rounded-full border-2 border-primary-400 bg-primary-50/50 p-1.5 dark:bg-primary-500/10"
              >
                <View className="size-full items-center justify-center overflow-hidden rounded-full bg-primary-500">
                  {user?.avatarUrl
                    ? <Image source={{ uri: user.avatarUrl }} contentFit="cover" style={{ width: '100%', height: '100%' }} />
                    : <Text className="font-nunito text-4xl font-extrabold text-white">{initials(name)}</Text>}
                </View>
              </Pressable>

              <Pressable
                onPress={pickAvatar}
                disabled={uploadAvatar.isPending}
                accessibilityLabel={translate('edit_profile.avatar_change')}
                className="absolute bottom-0 left-0 rounded-full border-2 border-white bg-mascot-navy p-2 active:scale-95 dark:border-neutral-900"
              >
                <CameraIcon color="#FFFFFF" width={16} height={16} />
              </Pressable>
            </View>

            <Button
              tx="edit_profile.avatar_change"
              variant="ghost"
              size="sm"
              loading={uploadAvatar.isPending}
              onPress={pickAvatar}
            />
          </View>

          <View className="mt-4 gap-4 rounded-3xl border border-neutral-200/80 bg-white p-5 shadow-sm shadow-black/5 dark:border-neutral-800 dark:bg-neutral-900">
            <Controller
              control={control}
              name="firstName"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label={translate('edit_profile.first_name')}
                  placeholder={translate('edit_profile.first_name_placeholder')}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.firstName?.message}
                  testID="edit-profile-first-name"
                />
              )}
            />
            <Controller
              control={control}
              name="lastName"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label={translate('edit_profile.last_name')}
                  placeholder={translate('edit_profile.last_name_placeholder')}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.lastName?.message}
                  testID="edit-profile-last-name"
                />
              )}
            />
            <Controller
              control={control}
              name="bio"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label={translate('edit_profile.bio')}
                  placeholder={translate('edit_profile.bio_placeholder')}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  multiline
                  numberOfLines={4}
                  maxLength={MAX_BIO}
                  textAlignVertical="top"
                  className="h-28 py-3"
                  error={errors.bio?.message}
                  hint={`${value.length}/${MAX_BIO}`}
                  testID="edit-profile-bio"
                />
              )}
            />
          </View>

          <Button
            tx="edit_profile.save"
            fullWidth
            loading={updateProfile.isPending}
            onPress={handleSubmit(onSubmit)}
            testID="edit-profile-save"
            className="mt-6"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
