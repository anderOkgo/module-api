import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

/**
 * Middleware to verify that the user has administrator role
 * Requires that the token is valid and that the user has role = 1 (ADMIN)
 */
const validateAdmin = (req: Request, res: Response, next: NextFunction) => {
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
    jwt.verify(bearerToken, process.env.SECRET_KEY || 'qwertgfdsa', (err, decoded) => {
      if (err) {
        console.error('JWT verification failed:', err);
        return res.status(401).json({
          error: 'Unauthorized: Invalid token',
        });
      }

      if (decoded && typeof decoded === 'object' && 'role' in decoded && 'username' in decoded) {
        // Verify that the user has administrator role
        // Accepts both role = 1 (number) and role = "admin" (string)
        const isAdmin = decoded.role === 1 || decoded.role === 'admin';

        if (!isAdmin) {
          console.error('Access denied: User does not have admin role. Role:', decoded.role);
          return res.status(403).json({
            error: 'Forbidden: Admin role required',
            message: 'Only administrators can perform this action',
          });
        }

        // Add user information to the request
        req.body.username = decoded.username;
        req.body.userRole = decoded.role;
        req.body.userId = decoded.userId;

        next();
      } else {
        console.error('Invalid token payload:', decoded);
        return res.status(401).json({
          error: 'Unauthorized: Invalid token payload',
        });
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
    });
  }
};

export default validateAdmin;
