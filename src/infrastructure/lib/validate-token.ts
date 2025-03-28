import { Request, Response, NextFunction } from '../middle.helper';
import { token } from '../token.helper';

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
    token.verify(bearerToken, process.env.SECRET_KEY || 'qwertgfdsa', (err, decoded) => {
      if (err) {
        console.error('JWT verification failed:', err);
        return res.status(401).json({
          error: 'Unauthorized: Invalid token',
        });
      }

      if (decoded && typeof decoded === 'object' && 'username' in decoded) {
        req.body.username = decoded.username;
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
