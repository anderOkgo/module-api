import { Request, Response } from 'express';
import Database from '../../../data/mysql/database';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const addUserPersistence = async (req: Request, res: Response) => {
  const { nombre, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const database = new Database();
  const newUser = {
    first_name: nombre,
    last_name: '',
    email: '',
    role: 1,
    password: hashedPassword,
    active: 1,
    created: '2018-01-18',
    modified: '2018-01-18',
  };

  database.executeQuery('INSERT INTO users SET ?', newUser);
};

export const loginUserPersistence = async (req: Request, res: Response) => {
  const { name, password } = req.body;
  const database = new Database();
  const userPassword = await database.loginUser(name);

  if (userPassword) {
    bcrypt.compare(password, userPassword).then((result) => {
      if (result) {
        const token = jwt.sign({ name: name }, process.env.SECRET_KEY || 'enterkey');
        res.json({ token });
      } else {
        res.json({ msg: 'Wrong Password' });
      }
    });
  } else {
    res.json({ msg: 'User does not exist' });
  }
};
