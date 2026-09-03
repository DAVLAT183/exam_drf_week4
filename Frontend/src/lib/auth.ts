import api, { saveTokens, removeTokens } from './api';
import type { AuthTokens, LoginCredentials, RegisterData, User } from '@/types';

export async function login(data: LoginCredentials): Promise<AuthTokens> {
  const res = await api.post<AuthTokens>('/token/', data);
  saveTokens(res.data.access, res.data.refresh);
  return res.data;
}

export async function register(data: RegisterData): Promise<User> {
  const res = await api.post<User>('/register/', data);
  return res.data;
}

export async function getCurrentUser(): Promise<User> {
  const res = await api.get<User>('/users/me/');
  return res.data;
}

export function logout() {
  removeTokens();
  window.location.href = '/auth/login';
}

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('access_token');
}
