import sendEmail from '../../../../infrastructure/services/email';
import { EmailServicePort } from '../../application/ports/email.service.port';

/**
 * Infrastructure adapter for email sending
 * Implements the EmailServicePort using the global SMTP service
 */
export class SmtpEmailService implements EmailServicePort {
  async sendVerificationCode(email: string, verificationCode: number): Promise<void> {
    const subject = 'Verification Code';
    const message = `Your verification code is: ${verificationCode}`;
    await sendEmail(email, subject, message);
    console.log(`Verification code sent to ${email}: ${verificationCode}`);
  }

  async sendWelcomeEmail(email: string, username: string): Promise<void> {
    const subject = 'Welcome';
    const message = `Hello ${username}, welcome to our platform.`;
    await sendEmail(email, subject, message);
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    const subject = 'Reset Password';
    const message = `Your reset token is: ${resetToken}`;
    await sendEmail(email, subject, message);
  }
}
