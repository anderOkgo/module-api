// Ejemplo de cómo usar el factory pattern para testing
import { AuthServiceFactory } from './auth.factory';
import { AuthService } from './auth.service';
import { UserRepository } from '../../infrastructure/repositories/user.repository';

// Mock del repository para testing
class MockUserRepository implements UserRepository {
  async create(user: any): Promise<any> {
    return { id: 1, ...user };
  }

  async findById(id: number): Promise<any> {
    return { id, username: 'test' };
  }

  // ... implementar otros métodos necesarios
  async findByEmailOrUsername(email: string, username: string): Promise<any> {
    return null;
  }
  async findByEmail(email: string): Promise<any> {
    return null;
  }
  async findByUsername(username: string): Promise<any> {
    return null;
  }
  async update(user: any): Promise<any> {
    return user;
  }
  async updatePassword(userId: number, hashedPassword: string): Promise<void> {}
  async updateLastLogin(userId: number): Promise<void> {}
  async incrementLoginAttempts(userId: number): Promise<void> {}
  async resetLoginAttempts(userId: number): Promise<void> {}
  async lockUser(userId: number, lockUntil: Date): Promise<void> {}
  async unlockUser(userId: number): Promise<void> {}
  async delete(id: number): Promise<boolean> {
    return true;
  }
}

// Ejemplo de test
describe('AuthService', () => {
  beforeEach(() => {
    // Resetear el factory antes de cada test
    AuthServiceFactory.reset();
  });

  it('should create user with mock repository', async () => {
    // Crear servicio con mock repository
    const mockRepo = new MockUserRepository();
    const authService = AuthServiceFactory.createAuthService(mockRepo);

    // Test del servicio
    const result = await authService.registerUser({
      first_name: 'Test',
      last_name: 'User',
      username: 'testuser',
      email: 'test@example.com',
      password: 'TestPassword123!',
    });

    expect(result.error).toBe(false);
  });
});
