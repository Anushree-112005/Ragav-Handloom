import api from './api';

export const authService = {
  login: async (email, password, rememberMe = false) => {
    const response = await api.post('/auth/login', {
      email,
      password,
      remember_me: rememberMe,
    });
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  changePassword: async (currentPassword, newPassword, confirmPassword) => {
    const response = await api.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
      confirm_password: confirmPassword,
    });
    return response.data;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.warn('Logout notification error:', e);
    } finally {
      localStorage.removeItem('loomora_token');
      localStorage.removeItem('loomora_user');
    }
  },
};
