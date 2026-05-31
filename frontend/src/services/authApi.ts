import { api } from './api';

interface LoginResponse {
  success: boolean;
  data: {
    user: {
      id: string;
      username: string;
      fullName: string;
      role: string;
    };
    token: string;
  };
}

interface MeResponse {
  success: boolean;
  data: {
    id: string;
    username: string;
    fullName: string;
    role: string;
    isActive: boolean;
  };
}

export const authApi = {
  login: (username: string, password: string) =>
    api.post<LoginResponse>('/auth/login', { username, password }),

  register: (username: string, password: string, fullName: string, role: string = 'guard') =>
    api.post<LoginResponse>('/auth/register', { username, password, fullName, role }),

  getMe: () => api.get<MeResponse>('/auth/me'),
};
