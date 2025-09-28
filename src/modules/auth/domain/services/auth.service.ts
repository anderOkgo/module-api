import { UserRepository } from '../../infrastructure/repositories/user.repository';
import User, { UserCreateRequest, LoginResponse, UserResponse, UserRole } from '../models/User';
import Login from '../models/Login';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export class AuthService {
  constructor(private userRepository: UserRepository) {}

  async registerUser(
    userData: UserCreateRequest
  ): Promise<{ error: boolean; message?: string; data?: UserResponse }> {
    try {
      // Verificar si el usuario ya existe
      const existingUser = await this.userRepository.findByEmailOrUsername(userData.email, userData.username);
      if (existingUser) {
        return { error: true, message: 'User already exists with this email or username' };
      }

      // Hash de la contraseña
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

      // Crear usuario
      const newUser = {
        ...userData,
        password: hashedPassword,
        role: UserRole.USER,
        active: true,
        login_attempts: 0,
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
      };

      const createdUser = await this.userRepository.create(newUser);

      // Retornar usuario sin contraseña
      const userResponse: UserResponse = {
        id: createdUser.id!,
        first_name: createdUser.first_name,
        last_name: createdUser.last_name,
        username: createdUser.username,
        email: createdUser.email,
        role: createdUser.role,
        active: createdUser.active,
        created: createdUser.created!,
        last_login: createdUser.last_login,
      };

      return { error: false, data: userResponse };
    } catch (error) {
      console.error('Error in registerUser:', error);
      return { error: true, message: 'Internal server error during registration' };
    }
  }

  async loginUser(loginData: Login): Promise<{ error: boolean; message?: string; data?: LoginResponse }> {
    try {
      const user = await this.userRepository.findByEmailOrUsername(
        loginData.email || '',
        loginData.username || ''
      );

      if (!user) {
        return { error: true, message: 'Invalid credentials' };
      }

      // Verificar si la cuenta está bloqueada
      if (user.locked_until && new Date(user.locked_until) > new Date()) {
        return { error: true, message: 'Account is temporarily locked due to too many failed login attempts' };
      }

      // Verificar contraseña
      const isPasswordValid = await bcrypt.compare(loginData.password, user.password);

      if (!isPasswordValid) {
        // Incrementar intentos de login fallidos
        await this.userRepository.incrementLoginAttempts(user.id!);
        return { error: true, message: 'Invalid credentials' };
      }

      // Resetear intentos de login y actualizar último login
      await this.userRepository.resetLoginAttempts(user.id!);
      await this.userRepository.updateLastLogin(user.id!);

      // Generar token JWT
      const token = jwt.sign(
        {
          userId: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
        process.env.SECRET_KEY || 'enterkey',
        { expiresIn: '24h' }
      );

      const userResponse: UserResponse = {
        id: user.id!,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        email: user.email,
        role: user.role,
        active: user.active,
        created: user.created!,
        last_login: new Date().toISOString(),
      };

      const loginResponse: LoginResponse = {
        user: userResponse,
        token,
        expiresIn: 24 * 60 * 60, // 24 horas en segundos
      };

      return { error: false, data: loginResponse };
    } catch (error) {
      console.error('Error in loginUser:', error);
      return { error: true, message: 'Internal server error during login' };
    }
  }

  async verifyToken(token: string): Promise<{ error: boolean; message?: string; data?: any }> {
    try {
      const decoded = jwt.verify(token, process.env.SECRET_KEY || 'enterkey') as any;
      return { error: false, data: decoded };
    } catch (error) {
      return { error: true, message: 'Invalid or expired token' };
    }
  }

  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string
  ): Promise<{ error: boolean; message?: string }> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return { error: true, message: 'User not found' };
      }

      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return { error: true, message: 'Current password is incorrect' };
      }

      const saltRounds = 12;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      await this.userRepository.updatePassword(userId, hashedNewPassword);

      return { error: false };
    } catch (error) {
      console.error('Error in changePassword:', error);
      return { error: true, message: 'Internal server error during password change' };
    }
  }
}

// Función currificada eliminada - usar authContainer en su lugar
