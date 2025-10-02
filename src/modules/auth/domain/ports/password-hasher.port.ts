/**
 * Puerto de dominio para hash de contraseñas
 * Define el contrato que debe cumplir cualquier implementación de hashing
 */
export interface PasswordHasherPort {
  /**
   * Genera un hash de la contraseña
   * @param password Contraseña en texto plano
   * @returns Hash de la contraseña
   */
  hash(password: string): Promise<string>;

  /**
   * Compara una contraseña con su hash
   * @param password Contraseña en texto plano
   * @param hashedPassword Hash almacenado
   * @returns true si coinciden, false si no
   */
  compare(password: string, hashedPassword: string): Promise<boolean>;
}
