import express, { Application } from "express";
import dotenv from "dotenv";
import connection from "../db/connection";
import routesProducto from "../routes/production.route";

class server {
  private app: Application;
  private port: string;

  constructor() {
    this.app = express();
    this.port = process.env.PORT || "3000";
    this.listening();
    this.connectDB();
    this.routes();
  }
  listening() {
    this.app.listen(this.port, () => {
      console.log("app running port", this.port);
    });
  }

  connectDB() {
    connection.connect((err) => {
      if (err) {
        console.log(err);
      } else {
        console.log("Database conneted successfull");
      }
    });
  }

  routes() {
    //this.app.use("/", routesProducto);
    this.app.use("/api/productions", routesProducto);
    //this.app.use('/api/usuarios', routesUsuario );
  }
}

export default server;
