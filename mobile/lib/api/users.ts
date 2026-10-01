import api from './client';

export const usersAPI = {
  updatePreferredLanguage: async (preferredLanguage: string) => {
    const response = await api.patch('/users/me', { preferredLanguage });
    return response.data;
  },
};
