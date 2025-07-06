import mysql from "mysql2/promise";
import { DB_NAME } from "../constants.js";

let connection;

const connectDB = async () => {
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: DB_NAME,
      port: process.env.DB_PORT,
    });
    console.log(`MySQL connected! DB HOST: ${process.env.DB_HOST}`);
  } catch (error) {
    console.error("MySQL connection FAILED:", error.message);
    process.exit(1);
  }
};

export const getConnection = () => connection;
export default connectDB;
