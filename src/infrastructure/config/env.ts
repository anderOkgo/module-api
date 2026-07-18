/**
 * Fails fast at process startup when a required environment variable is
 * missing, instead of letting individual modules silently fall back to a
 * guessable hardcoded secret. Call once, immediately after `dotenv.config()`
 * and before any other module is imported/wired.
 *
 * See docs/specification-roadmap.md Acceptance Criteria Catalog #18:
 * SECRET_KEY previously had two different, mismatched hardcoded fallbacks
 * ('qwertgfdsa' for token verification, 'enterkey' for token signing) - if
 * the real env var were ever missing, every login would silently issue a
 * token that failed every subsequent auth check.
 */
export function assertRequiredEnvVars(): void {
  if (!process.env.SECRET_KEY) {
    throw new Error('SECRET_KEY environment variable is required - refusing to start without it.');
  }
}
