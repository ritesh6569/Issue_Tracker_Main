import { getConnection } from "../db/index.js";

export class Response {
  constructor({
    id,
    issueId,
    description,
    requirements,
    actionTaken,
    complete,
    acknowledgeAt,
    createdAt,
    updatedAt,
  }) {
    this.id = id;
    this.issueId = issueId;
    this.description = description;
    this.requirements = requirements;
    this.actionTaken = actionTaken;
    this.complete = complete;
    this.acknowledgeAt = acknowledgeAt;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static async create(responseData) {
    const connection = getConnection();
    const [result] = await connection.query(
      `INSERT INTO responses (issue_id, description, requirements, action_taken, complete, acknowledge_at) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        responseData.issueId,
        responseData.description || "",
        responseData.requirements || "",
        responseData.actionTaken || "",
        responseData.complete || false,
        responseData.acknowledgeAt || "",
      ]
    );
    return result.insertId;
  }

  static async findById(id) {
    const connection = getConnection();
    const [rows] = await connection.query(`SELECT * FROM responses WHERE id = ?`, [id]);
    return rows.length ? new Response(rows[0]) : null;
  }

  static async findByIssueId(issueId) {
    const connection = getConnection();
    const [rows] = await connection.query(`SELECT * FROM responses WHERE issue_id = ?`, [issueId]);
    return rows.map((row) => new Response(row));
  }

  async update(data) {
    const connection = getConnection();
    const updatedData = {
      ...this,
      ...data,
    };
    await connection.query(
      `UPDATE responses SET description = ?, requirements = ?, action_taken = ?, complete = ?, acknowledge_at = ? WHERE id = ?`,
      [
        updatedData.description,
        updatedData.requirements,
        updatedData.actionTaken,
        updatedData.complete,
        updatedData.acknowledgeAt,
        this.id,
      ]
    );
  }

  static async delete(id) {
    const connection = getConnection();
    await connection.query(`DELETE FROM responses WHERE id = ?`, [id]);
  }
}
