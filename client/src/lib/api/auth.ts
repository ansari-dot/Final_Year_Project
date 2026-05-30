import { http, tokenStore, userStore } from './client';
import type { ApiAuthResponse, ApiUser } from './types';

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  gender: 'male' | 'female' | 'other';
  phone?: string;
  dateOfBirth?: string;
}

export const authApi = {
  async register(payload: RegisterPayload): Promise<ApiAuthResponse> {
    const data = await http.post<ApiAuthResponse>('/auth/register', payload);
    tokenStore.set(data.accessToken, data.refreshToken);
    userStore.set(data.user);
    return data;
  },

  async login(email: string, password: string): Promise<ApiAuthResponse> {
    const data = await http.post<ApiAuthResponse>('/auth/login', { email, password });
    tokenStore.set(data.accessToken, data.refreshToken);
    userStore.set(data.user);
    return data;
  },

  async logout(): Promise<void> {
    try {
      await http.post('/auth/logout');
    } catch {
      /* swallow */
    } finally {
      tokenStore.clear();
    }
  },

  async me(): Promise<ApiUser> {
    const user = await http.get<ApiUser>('/auth/me');
    userStore.set(user);
    return user;
  },

  forgotPassword(email: string) {
    return http.post('/auth/forgot-password', { email });
  },

  resetPassword(token: string, password: string) {
    return http.post('/auth/reset-password', { token, password });
  },

  verifyEmail(token: string) {
    return http.get(`/auth/verify-email/${token}`);
  },

  resendVerification() {
    return http.post('/auth/resend-verification');
  },

  changePassword(currentPassword: string, newPassword: string) {
    return http.post('/auth/change-password', { currentPassword, newPassword });
  },
};
