import { SmtpEmailService } from '../../../../../src/modules/auth/infrastructure/services/smtp-email.service';
import sendEmail from '../../../../../src/infrastructure/services/email';

jest.mock('../../../../../src/infrastructure/services/email');
const mockSendEmail = sendEmail as jest.MockedFunction<typeof sendEmail>;

describe('SmtpEmailService', () => {
  let service: SmtpEmailService;
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    service = new SmtpEmailService();
    jest.clearAllMocks();
    mockSendEmail.mockResolvedValue(undefined as any);
    logSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => logSpy.mockRestore());

  // Auth SPEC v0.5, E9: neither the code nor the email may reach the log
  const expectNothingSecretLogged = (code: number, email: string) => {
    const logged = logSpy.mock.calls.flat().join(' ');
    expect(logged).not.toContain(String(code));
    expect(logged).not.toContain(email);
  };

  it('sends the registration code in Spanish and English, and logs neither the code nor the email', async () => {
    await service.sendVerificationCode('test@example.com', 123456);

    expect(mockSendEmail).toHaveBeenCalledWith(
      'test@example.com',
      'Código de verificación / Verification code',
      expect.stringContaining('Tu código para crear la cuenta es: 123456')
    );
    const body = mockSendEmail.mock.calls[0][2];
    expect(body).toContain('Your code to create the account is: 123456');
    expect(body).toContain('15 minutos');
    expect(body).toContain('15 minutes');
    expect(logSpy).toHaveBeenCalledWith('Verification code sent');
    expectNothingSecretLogged(123456, 'test@example.com');
  });

  it('sends a welcome email', async () => {
    await service.sendWelcomeEmail('test@example.com', 'testuser');

    expect(mockSendEmail).toHaveBeenCalledWith(
      'test@example.com',
      'Welcome',
      'Hello testuser, welcome to our platform.'
    );
  });

  it('sends the password reset code in Spanish and English, and logs neither the code nor the email', async () => {
    await service.sendPasswordResetEmail('test@example.com', 654321);

    expect(mockSendEmail).toHaveBeenCalledWith(
      'test@example.com',
      'Cambiar contraseña / Reset your password',
      expect.stringContaining('Tu código para cambiar la contraseña es: 654321')
    );
    expect(mockSendEmail.mock.calls[0][2]).toContain('Your code to reset the password is: 654321');
    expect(logSpy).toHaveBeenCalledWith('Password reset code sent');
    expectNothingSecretLogged(654321, 'test@example.com');
  });
});
