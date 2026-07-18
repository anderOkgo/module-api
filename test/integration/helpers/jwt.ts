import jwt from 'jsonwebtoken';

/**
 * validate-token.ts / validate-admin.ts read process.env.SECRET_KEY directly,
 * with no fallback (see docs/specification-roadmap.md Acceptance Criteria
 * Catalog #18). Tests set process.env.SECRET_KEY explicitly to this value so
 * token generation/verification never depends on a real .env file.
 */
export const TEST_SECRET_KEY = 'integration-test-secret';

export interface TokenOptions {
  userId?: number;
  username?: string;
  role?: number | string;
}

export function signToken(options: TokenOptions = {}): string {
  const { userId = 1, username = 'testuser', role = 2 } = options;
  return jwt.sign({ userId, username, role }, process.env.SECRET_KEY || TEST_SECRET_KEY, { expiresIn: '1h' });
}

export function signAdminToken(options: TokenOptions = {}): string {
  return signToken({ role: 1, ...options });
}

export function bearer(token: string): string {
  return `Bearer ${token}`;
}
