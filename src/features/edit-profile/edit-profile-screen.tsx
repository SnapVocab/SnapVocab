import { useForm } from '@tanstack/react-form';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import * as z from 'zod';

import { FocusAwareStatusBar, SafeAreaView, View } from '@/components/ui';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { useUpdateProfile } from '@/features/edit-profile/api';
import { AvatarUpload } from '@/features/edit-profile/components/avatar-upload';
import { EditProfileHeader } from '@/features/edit-profile/components/edit-profile-header';
import { ProfileFormFields } from '@/features/edit-profile/components/profile-form-fields';
import {
  UploadPurpose,
  uploadToPresignedUrl,
  useCompleteUpload,
  useGetUploadUrl,
} from '@/features/storage/api';

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  bio: z.string().max(200, 'Bio must be at most 200 characters'),
});

export function EditProfileScreen() {
  const user = useAuthStore.use.user();
  const updateUser = useAuthStore.use.updateUser();
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const updateProfileMutation = useUpdateProfile();
  const getUploadUrl = useGetUploadUrl();
  const completeUpload = useCompleteUpload();

  const form = useForm({
    defaultValues: {
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      bio: user?.bio ?? '',
    },
    validators: { onChange: profileSchema },
    onSubmit: async ({ value }) => {
      let avatarUrl: string | undefined;
      if (selectedImage) {
        try {
          const fileName = selectedImage.split('/').pop() ?? 'avatar.jpg';
          console.log('[EditProfile] Getting upload URL for:', fileName);
          const { uploadUrl, objectName, contentType } = await getUploadUrl.mutateAsync({ fileName });
          console.log('[EditProfile] Upload URL:', uploadUrl, 'objectName:', objectName);
          if (!uploadUrl)
            throw new Error('Empty upload URL');
          await uploadToPresignedUrl(uploadUrl, selectedImage, contentType);
          console.log('[EditProfile] Upload to MinIO success');
          const completeRes = await completeUpload.mutateAsync({ objectName, purpose: UploadPurpose.AVATAR });
          console.log('[EditProfile] Upload complete, avatar URL:', completeRes.url);
          avatarUrl = completeRes.url;
        }
        catch (err) {
          console.log('[EditProfile] Avatar upload failed:', err);
        }
      }

      console.log('[EditProfile] Updating profile:', value);
      const res = await updateProfileMutation.mutateAsync(value);
      console.log('[EditProfile] Profile updated:', res);
      updateUser({
        avatarUrl: avatarUrl ?? res.avatarUrl,
        firstName: res.firstName,
        lastName: res.lastName,
        bio: res.bio,
      });
      router.back();
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        firstName: user.firstName,
        lastName: user.lastName,
        bio: user.bio,
      });
    }
  }, [user?.id]);

  const avatarSource = selectedImage ?? user?.avatarUrl;
  const displayName = user?.firstName ?? '';

  return (
    <View className="flex-1 bg-white dark:bg-neutral-900">
      <SafeAreaView className="flex-1">
        <FocusAwareStatusBar />

        <form.Subscribe
          selector={state => [state.isSubmitting]}
          children={([isSubmitting]) => (
            <EditProfileHeader isSubmitting={isSubmitting} onSubmit={form.handleSubmit} />
          )}
        />

        <ScrollView className="bg-gray-100" contentContainerStyle={{ paddingBottom: 100 }}>
          <View className="min-h-175 gap-5 px-5 pt-5">
            <AvatarUpload
              avatarSource={avatarSource}
              displayName={displayName}
              onAvatarChange={setSelectedImage}
            />
            <ProfileFormFields form={form} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
