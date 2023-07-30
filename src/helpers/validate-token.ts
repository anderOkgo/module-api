import { Request, Response, NextFunction } from './middle.helper';
import { token } from './token.helper';

const validateToken = (req: Request, res: Response, next: NextFunction) => {
  const headerToken = req.headers['authorization'];

  if (headerToken != undefined && headerToken.startsWith('Bearer ')) {
    const bearerToken = headerToken.slice(7);
    try {
      const valid = token.verify(bearerToken, process.env.SECRET_KEY || 'enterkey');
      next();
    } catch (error) {
      res.status(400).json({
        error: 'invalid token ',
      });
    }
  } else {
    res.status(400).json({
      error: 'Deny Access ',
    });
  }
};

export default validateToken;
