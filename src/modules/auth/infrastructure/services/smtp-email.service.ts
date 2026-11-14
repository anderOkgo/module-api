import sendEmail from '../../../../infrastructure/services/email';
import { EmailServicePort } from '../../application/ports/email.service.port';

/**
 * Infrastructure adapter for email sending
 * Implements the EmailServicePort using the global SMTP service.
 * Auth SPEC v0.5: codes are never written to a log (R.5), and the code emails are in Spanish and
 * English at once (P9), since the API does not know the app's language.
 */
export class SmtpEmailService implements EmailServicePort {
  async sendVerificationCode(email: string, verificationCode: number): Promise<void> {
    const subject = 'Código de verificación / Verification code';
    const message =
      `Tu código para crear la cuenta es: ${verificationCode}\n` +
      'Vence en 15 minutos.\n\n' +
      `Your code to create the account is: ${verificationCode}\n` +
      'It expires in 15 minutes.';
    await sendEmail(email, subject, message);
    console.log('Verification code sent');
  }

  async sendWelcomeEmail(email: string, username: string): Promise<void> {
    const subject = 'Welcome';
    const message = `Hello ${username}, welcome to our platform.`;
    await sendEmail(email, subject, message);
  }

  async sendPasswordResetEmail(email: string, resetCode: number): Promise<void> {
    const subject = 'Cambiar contraseña / Reset your password';
    const message =
      `Tu código para cambiar la contraseña es: ${resetCode}\n` +
      'Vence en 15 minutos. Si no lo pediste, ignora este correo.\n\n' +
      `Your code to reset the password is: ${resetCode}\n` +
      'It expires in 15 minutes. If you did not ask for it, ignore this email.';
    await sendEmail(email, subject, message);
    console.log('Password reset code sent');
  }
}
