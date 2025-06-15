import { parseBody } from "../utils/bodyParser.js";
import pool from "../lib/db.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/jwt.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { email, password } = await parseBody(req);

    const result = await pool.query(
      "SELECT * FROM account WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "email tidak ditemukan " });
    }

    const user = result.rows[0];

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Password salah" });
    }
    console.log(user.uid)

    const token = generateToken({ id: user.uid, username: user.username });

    res.status(200).json({ username: user.username, email: user.email, message: "Login sukses! ", token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login gagal " });
  }
}
