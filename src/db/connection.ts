import mysql from "mysql";

const connection = mysql.createConnection({
  host: "localhost",
  user: "ander",
  password: "AnderMyP$7",
  database: "animecream",
  port: 3307,
});

export default connection;
