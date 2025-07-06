import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { getConnection } from "../db/index.js";

export class User {
  constructor({
    id,
    username,
    email,
    fullName,
    phoneNumber,
    password,
    department,
    refreshToken,
    is_admin,
  }) {
    this.id = id;
    this.username = username;
    this.email = email;
    this.fullName = fullName;
    this.phoneNumber = phoneNumber;
    this.password = password;
    this.department = department;
    this.refreshToken = refreshToken;
    this.is_admin = is_admin;
  }

  static async create(userData) {
    const connection = getConnection();
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const [result] = await connection.query(
      `INSERT INTO users (username, email, full_name, phone_number, password, department) 
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        userData.username,
        userData.email,
        userData.fullName,
        userData.phoneNumber,
        hashedPassword,
        userData.department,
      ]
    );
    return result.insertId;
  }

  static async findByUsername(username) {
    const connection = getConnection();
    const [rows] = await connection.query(`SELECT * FROM users WHERE username = ?`, [username]);
    return rows.length ? new User(rows[0]) : null;
  }

  async isPasswordCorrect(password) {
    return bcrypt.compare(password, this.password);
  }

  generateAccessToken() {
    return jwt.sign(
      {
        id: this.id,
        email: this.email,
        username: this.username,
        fullName: this.fullName,
        is_admin: this.is_admin,
      },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
      }
    );
  }

  generateRefreshToken() {
    return jwt.sign(
      {
        id: this.id,
      },
      process.env.REFRESH_TOKEN_SECRET,
      {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
      }
    );
  }

  async addProblem(problemDescription) {
    const connection = getConnection();
    const [result] = await connection.query(
      `INSERT INTO problems (user_id, description) VALUES (?, ?)`,
      [this.id, problemDescription]
    );
    return result.insertId;
  }

  async addResponse(responseText) {
    const connection = getConnection();
    const [result] = await connection.query(
      `INSERT INTO responses (user_id, response_text) VALUES (?, ?)`,
      [this.id, responseText]
    );
    return result.insertId;
  }

  static async findById(id) {
    const connection = getConnection();
    const [rows] = await connection.query(`SELECT * FROM users WHERE id = ?`, [id]);
    return rows.length ? new User(rows[0]) : null;
}

static async findOne(condition) {
  const connection = getConnection();

  // Construct the query dynamically based on the condition object
  const keys = Object.keys(condition);
  const values = Object.values(condition);
  const query = `SELECT * FROM users WHERE ${keys.map((key) => `${key} = ?`).join(" AND ")} LIMIT 1`;

  const [rows] = await connection.query(query, values);
  return rows.length ? new User(rows[0]) : null;
}

}


