import express, { Application, Router, Request, Response, NextFunction } from 'express';

/**
 * Builds a minimal Express app that mirrors the request-handling behavior of
 * src/server.ts (JSON body parsing, mounted routers, generic error handler)
 * without its side effects (DB connection, app.listen()). Used to drive real
 * HTTP requests through the real routing/middleware/controller/use-case stack
 * in integration tests, with only the persistence layer mocked.
 */
export function buildTestApp(mounts: Array<{ path: string; router: Router }>): Application {
  const app = express();
  app.use(express.json());

  for (const { path, router } of mounts) {
    app.use(path, router);
  }

  app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Not Found' });
  });

  // Mirrors Server.errorHandlerMiddleware in src/server.ts
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof SyntaxError && 'body' in err) {
      return res.status(400).json({ error: 'Bad Request: Invalid JSON' });
    }
    console.error('Internal Server Error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  });

  return app;
}
