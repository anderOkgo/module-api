import sendEmail from '../../../../infrastructure/services/email';
import { EmailServicePort } from '../../application/ports/email.service.port';

/**
 * Adaptador de infraestructura para envío de emails
 * Implementa el puerto EmailServicePort usando el servicio SMTP global
 */
export class SmtpEmailService implements EmailServicePort {
  async sendVerificationCode(email: string, verificationCode: number): Promise<void> {
    const subject = 'Código de Verificación';
    const message = `Tu código de verificación es: ${verificationCode}`;
    await sendEmail(email, subject, message);
    console.log(`Verification code sent to ${email}: ${verificationCode}`);
  }

  async sendWelcomeEmail(email: string, username: string): Promise<void> {
    const subject = 'Bienvenido';
    const message = `Hola ${username}, bienvenido a nuestra plataforma.`;
    await sendEmail(email, subject, message);
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    const subject = 'Restablecer Contraseña';
    const message = `Tu token de restablecimiento es: ${resetToken}`;
    await sendEmail(email, subject, message);
  }
}
