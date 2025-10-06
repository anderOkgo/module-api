/**
 * Domain port for password hashing
 * Defines the contract that any hashing implementation must fulfill
 */
export interface PasswordHasherPort {
  /**
   * Generates a password hash
   * @param password Plain text password
   * @returns Password hash
   */
  hash(password: string): Promise<string>;

  /**
   * Compares a password with its hash
   * @param password Plain text password
   * @param hashedPassword Stored hash
   * @returns true if they match, false if not
   */
  compare(password: string, hashedPassword: string): Promise<boolean>;
}
