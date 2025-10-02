/**
 * Puerto de dominio para generación de tokens JWT
 * Define el contrato para cualquier implementación de tokens
 */
export interface TokenPayload {
  userId: number;
  username: string;
  role: number;
}

export interface TokenGeneratorPort {
  /**
   * Genera un token JWT
   * @param payload Datos a incluir en el token
   * @returns Token JWT generado
   */
  generate(payload: TokenPayload): string;

  /**
   * Verifica y decodifica un token JWT
   * @param token Token a verificar
   * @returns Payload decodificado o null si es inválido
   */
  verify(token: string): TokenPayload | null;
}
