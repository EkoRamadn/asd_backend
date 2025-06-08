import { parseBody } from "../utils/bodyParser.js";
import pool from "../lib/db.js"; // pool dari PostgreSQL
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { username, password } = await parseBody(req);

    const result = await pool.query(
      "SELECT uid FROM account WHERE username = $1",
      [username]
    );

    if (result.rows.length > 0) {
      return res.status(409).json({ error: "Username sudah ada " });
    }

    const hashed = await bcrypt.hash(password, 10);

    await pool.query(
      "INSERT INTO account (username, password) VALUES ($1, $2)",
      [username, hashed]
    );

    res.status(201).json({ message: "Registrasi sukses! " });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error saat register user " });
  }
}
