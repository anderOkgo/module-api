/**
 * Puerto de aplicación para servicio de email
 * Define el contrato para envío de emails relacionados con autenticación
 */
export interface EmailServicePort {
  /**
   * Envía un código de verificación por email
   * @param email Dirección de email del destinatario
   * @param verificationCode Código de verificación de 6 dígitos
   */
  sendVerificationCode(email: string, verificationCode: number): Promise<void>;

  /**
   * Envía email de bienvenida
   * @param email Dirección de email del destinatario
   * @param username Nombre de usuario
   */
  sendWelcomeEmail(email: string, username: string): Promise<void>;

  /**
   * Envía email de reseteo de contraseña
   * @param email Dirección de email del destinatario
   * @param resetToken Token de reseteo
   */
  sendPasswordResetEmail(email: string, resetToken: string): Promise<void>;
}
