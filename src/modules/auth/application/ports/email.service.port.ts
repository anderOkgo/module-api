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
   * Sends the password reset code (Auth SPEC v0.5, C4)
   * @param email Recipient email address
   * @param resetCode 6-digit code, valid for 15 minutes
   */
  sendPasswordResetEmail(email: string, resetCode: number): Promise<void>;
}
