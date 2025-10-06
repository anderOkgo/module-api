/**
 * Application port for email service
 * Defines the contract for sending authentication-related emails
 */
export interface EmailServicePort {
  /**
   * Sends a verification code via email
   * @param email Recipient email address
   * @param verificationCode 6-digit verification code
   */
  sendVerificationCode(email: string, verificationCode: number): Promise<void>;

  /**
   * Sends welcome email
   * @param email Recipient email address
   * @param username Username
   */
  sendWelcomeEmail(email: string, username: string): Promise<void>;

  /**
   * Sends password reset email
   * @param email Recipient email address
   * @param resetToken Reset token
   */
  sendPasswordResetEmail(email: string, resetToken: string): Promise<void>;
}
