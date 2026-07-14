import { SmtpEmailService } from '../../../../../src/modules/auth/infrastructure/services/smtp-email.service';
import sendEmail from '../../../../../src/infrastructure/services/email';

jest.mock('../../../../../src/infrastructure/services/email');
const mockSendEmail = sendEmail as jest.MockedFunction<typeof sendEmail>;

describe('SmtpEmailService', () => {
  let service: SmtpEmailService;

  beforeEach(() => {
    service = new SmtpEmailService();
    jest.clearAllMocks();
    mockSendEmail.mockResolvedValue(undefined as any);
  });

  it('sends a verification code email and logs it', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation();

    await service.sendVerificationCode('test@example.com', 123456);

    expect(mockSendEmail).toHaveBeenCalledWith(
      'test@example.com',
      'Verification Code',
      'Your verification code is: 123456'
    );
    expect(logSpy).toHaveBeenCalledWith('Verification code sent to test@example.com: 123456');

    logSpy.mockRestore();
  });

  it('sends a welcome email', async () => {
    await service.sendWelcomeEmail('test@example.com', 'testuser');

    expect(mockSendEmail).toHaveBeenCalledWith(
      'test@example.com',
      'Welcome',
      'Hello testuser, welcome to our platform.'
    );
  });

  it('sends a password reset email', async () => {
    await service.sendPasswordResetEmail('test@example.com', 'reset-token-123');

    expect(mockSendEmail).toHaveBeenCalledWith(
      'test@example.com',
      'Reset Password',
      'Your reset token is: reset-token-123'
    );
  });
});
