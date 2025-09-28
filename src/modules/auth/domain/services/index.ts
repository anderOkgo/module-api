import { getAuthService } from './auth.factory';

export const addUserService = async (userData: any) => {
  const authService = getAuthService();
  return await authService.registerUser(userData);
};

export const loginUserService = async (loginData: any) => {
  const authService = getAuthService();
  return await authService.loginUser(loginData);
};
