import { Request, Response } from 'express';
import connection from '../db/connection';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const addUsuario = async (req: Request, res: Response) => {
  const { nombre, password } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  connection.query(
    'INSERT INTO users set ?',
    {
      first_name: nombre,
      last_name: '',
      email: '',
      role: 1,
      password: hashedPassword,
      active: 1,
      created: '2018-01-18',
      modified: '2018-01-18',
    },
    (err, data) => {
      if (err) {
        console.log(err);
      } else {
        res.json({
          msg: data,
        });
      }
    }
  );
};

export const loginUser = (req: Request, res: Response) => {
  const { nombre, password } = req.body;

  connection.query(
    'SELECT * FROM users WHERE first_name = ' + connection.escape(nombre),
    (err, data) => {
      if (err) {
        console.log(err);
      } else {
        if (data.length == 0) {
          // No existe el usuario en la base de datos
          res.json({
            msg: 'No existe el usuario en la base de datos',
          });
        } else {
          // Existe
          const userPassword = data[0].password;
          console.log(password);
          // Comparamos el password
          bcrypt.compare(password, userPassword).then((result) => {
            if (result) {
              // Login exitoso -- Generamos el token
              const token = jwt.sign(
                {
                  nombre: nombre,
                },
                process.env.SECRET_KEY || 'pepito123'
              );

              res.json({
                token,
              });
            } else {
              // Password incorrecto
              res.json({
                msg: 'Password incorrecto',
              });
            }
          });
        }
      }
    }
  );
};
