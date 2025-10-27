import { userApi } from './api';
import { 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse, 
  User, 
  UpdateProfileRequest 
} from './types';

export const authApi = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await userApi.post('/api/auth/login', credentials);
    return response.data;
  },

  register: async (userData: RegisterRequest): Promise<AuthResponse> => {
    const response = await userApi.post('/api/auth/register', userData);
    return response.data;
  },

  getProfile: async (): Promise<User> => {
    const response = await userApi.get('/api/auth/profile');
    return response.data;
  },

  updateProfile: async (userData: UpdateProfileRequest): Promise<User> => {
    const response = await userApi.put('/api/auth/profile', userData);
    return response.data;
  },
};