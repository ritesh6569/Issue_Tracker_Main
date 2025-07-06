import { getConnection } from "../db/index.js";

export class Issue {
  constructor({
    id,
    issue,
    description,
    address,
    requireDepartment,
    complete,
    userId,
    acknowledgeAt,
    createdAt,
    updatedAt,
  }) {
    this.id = id;
    this.issue = issue;
    this.description = description;
    this.address = address;
    this.requireDepartment = requireDepartment;
    this.complete = complete;
    this.userId = userId;
    this.acknowledgeAt = acknowledgeAt;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static async create(issueData) {
    const connection = getConnection();
    const [result] = await connection.query(
      `INSERT INTO issues (issue, description, address, require_department, complete, user_id, acknowledge_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        issueData.issue,
        issueData.description || "",
        issueData.address,
        issueData.requireDepartment,
        issueData.complete || false,
        issueData.userId || null,
        issueData.acknowledgeAt || "",
      ]
    );
    return result.insertId;
  }

  static async findById(id) {
    const connection = getConnection();
    const [rows] = await connection.query(`SELECT * FROM issues WHERE id = ?`, [id]);
    return rows.length ? new Issue(rows[0]) : null;
  }

  static async findByUserId(userId) {
    const connection = getConnection();
    const [rows] = await connection.query(`SELECT * FROM issues WHERE user_id = ?`, [userId]);
    return rows.map((row) => new Issue(row));
  }

  async update(data) {
    const connection = getConnection();
    const updatedData = {
      ...this,
      ...data,
    };
    await connection.query(
      `UPDATE issues SET issue = ?, description = ?, address = ?, require_department = ?, complete = ?, acknowledge_at = ? WHERE id = ?`,
      [
        updatedData.issue,
        updatedData.description,
        updatedData.address,
        updatedData.requireDepartment,
        updatedData.complete,
        updatedData.acknowledgeAt,
        this.id,
      ]
    );
  }

  static async delete(id) {
    const connection = getConnection();
    await connection.query(`DELETE FROM issues WHERE id = ?`, [id]);
  }


  static async find(condition) {
    const connection = getConnection();

    const keys = Object.keys(condition);
    const values = Object.values(condition);

    const query = `SELECT * FROM issues WHERE ${keys.map((key) => `${key} = ?`).join(" AND ")}`;

    const [rows] = await connection.query(query, values);
    return rows;
}

}
