import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const validateToken = (req: Request, res: Response, next: NextFunction) => {
  const headerToken = req.headers['authorization'];

  if (headerToken != undefined && headerToken.startsWith('Bearer ')) {
    const bearerToken = headerToken.slice(7);
    try {
      const tokenValido = jwt.verify(
        bearerToken,
        process.env.SECRET_KEY || 'pepito123'
      );
      console.log(tokenValido);
      console.log(process.env.SECRET_KEY);
      next();
    } catch (error) {
      res.status(400).json({
        error: 'token no valido',
      });
    }
  } else {
    res.status(400).json({
      error: 'Acceso denegado',
    });
  }
};

export default validateToken;
