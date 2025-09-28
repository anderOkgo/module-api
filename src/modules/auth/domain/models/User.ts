export default interface User {
  id?: number;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  role: UserRole;
  password: string;
  active: boolean;
  created?: string;
  modified?: string;
  verificationCode?: number;
  last_login?: string;
  login_attempts?: number;
  locked_until?: string;
}

export enum UserRole {
  ADMIN = 1,
  USER = 2,
  GUEST = 3,
}

export interface UserCreateRequest {
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  password: string;
  verificationCode?: number;
}

export interface UserResponse {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  role: UserRole;
  active: boolean;
  created: string;
  last_login?: string;
}

export interface LoginResponse {
  user: UserResponse;
  token: string;
  expiresIn: number;
}
