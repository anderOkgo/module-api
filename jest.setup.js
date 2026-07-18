// Runs once per test file, before that file's own module graph loads. Guarantees
// process.env.SECRET_KEY always has *some* value during test runs, so
// src/infrastructure/config/env.ts's startup guard (which now throws instead of
// letting the app fall back to a guessable default) never fires for tests that
// don't care about auth at all. Tests that DO care about SECRET_KEY still set
// their own value explicitly and take priority (see the `if` below).
if (!process.env.SECRET_KEY) {
  process.env.SECRET_KEY = 'jest-test-secret-key-do-not-use-in-production';
}
