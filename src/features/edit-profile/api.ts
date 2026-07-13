import type { AxiosError } from 'axios';
import type { User } from '@/features/auth/api';
import { createMutation } from 'react-query-kit';
import { client } from '@/lib/api';

type UpdateProfileVariables = {
  firstName: string;
  lastName: string;
  bio: string;
};

export const useUpdateProfile = createMutation<User, UpdateProfileVariables, AxiosError>({
  mutationFn: async (variables) => {
    const response = await client<{ statusCode: number; data: User }>({
      url: '/api/users/profile',
      method: 'PUT',
      data: variables,
    });
    return response.data.data;
  },
});
