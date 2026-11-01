import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const validateToken = (req: Request, res: Response, next: NextFunction) => {
  if (!req.headers || !req.headers['authorization']) {
    return res.status(401).json({
      error: 'Unauthorized: Missing or invalid token format',
    });
  }
  const headerToken = req.headers['authorization'];

  if (!headerToken || !headerToken.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized: Missing or invalid token format',
    });
  }

  const bearerToken = headerToken.slice(7); // Remove 'Bearer ' prefix

  try {
    jwt.verify(bearerToken, process.env.SECRET_KEY!, (err, decoded) => {
      if (err) {
        console.error('JWT verification failed:', err);
        return res.status(401).json({
          error: 'Unauthorized: Invalid token',
        });
      }

      if (decoded && typeof decoded === 'object' && 'username' in decoded) {
        req.body.username = decoded.username;
        // Additive (Bitácora SPEC D1): expose the immutable numeric user id when the token
        // carries it. Modules that key data by user id must use this, never the username.
        // The value must only ever come from the verified token: a client-sent `userId` in the
        // JSON body is always removed, so it can never impersonate another user.
        if (typeof (decoded as { userId?: unknown }).userId === 'number') {
          req.body.userId = (decoded as { userId: number }).userId;
        } else {
          delete req.body.userId;
        }
      } else {
        console.error('Invalid token payload:', decoded);
        return res.status(401).json({
          error: 'Unauthorized: Invalid token payload',
        });
      }

      next();
    });
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
    });
  }
};

export default validateToken;
