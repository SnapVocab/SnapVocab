import type { ReactFormExtendedApi } from '@tanstack/react-form';

import { Input, Text, View } from '@/components/ui';
import { getFieldError } from '@/components/ui/form-utils';
import { translate } from '@/lib/i18n';

type ProfileFormValues = {
  firstName: string;
  lastName: string;
  bio: string;
};

// ReactFormExtendedApi requires 12 type args; alias hides the noise
type FormApi<T> = ReactFormExtendedApi<T, any, any, any, any, any, any, any, any, any, any, any>;

type ProfileFormFieldsProps = {
  form: FormApi<ProfileFormValues>;
};

export function ProfileFormFields({ form }: ProfileFormFieldsProps) {
  return (
    <>
      <form.Field
        name="firstName"
        children={field => (
          <View>
            <Text className="mb-1 text-lg font-bold text-neutral-800 dark:text-neutral-100">
              {translate('edit_profile.first_name')}
            </Text>
            <Input
              placeholder={translate('edit_profile.first_name_placeholder')}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChangeText={field.handleChange}
              error={getFieldError(field)}
            />
          </View>
        )}
      />
      <form.Field
        name="lastName"
        children={field => (
          <View>
            <Text className="mb-1 text-lg font-bold text-neutral-800 dark:text-neutral-100">
              {translate('edit_profile.last_name')}
            </Text>
            <Input
              placeholder={translate('edit_profile.last_name_placeholder')}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChangeText={field.handleChange}
              error={getFieldError(field)}
            />
          </View>
        )}
      />
      <form.Field
        name="bio"
        children={field => (
          <View>
            <Text className="mb-1 text-lg font-bold text-neutral-800 dark:text-neutral-100">
              {translate('edit_profile.bio')}
            </Text>
            <Input
              placeholder={translate('edit_profile.bio_placeholder')}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChangeText={field.handleChange}
              error={getFieldError(field)}
              multiline
              numberOfLines={4}
            />
          </View>
        )}
      />
    </>
  );
}
