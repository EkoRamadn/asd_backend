import { withAuth } from "../../middleware/authMiddleware.js";
import pool from "../../lib/db.js";

async function tahunan(req, res) {
  if (req.method === "GET") {
    const { tanggal } = req.query;

    if (!tanggal) {
      return res.status(400).json({ error: "Parameter 'tanggal' wajib diisi (format: YYYY-MM-DD)" });
    }

    try {
      const query = `
        SELECT 
          a.total_harga AS total,
          a.tanggal::date AS tanggal,
          TO_CHAR(a.tanggal, 'HH24:MI:SS') AS jam,
          b.total_harga AS domba,
          c.total_harga AS pakan
        FROM pemasukan a
        LEFT JOIN penjualan_domba b ON b.pemasukan_id = a.id
        LEFT JOIN penjualan_pakan c ON c.pemasukan_id = a.id
        WHERE a.tanggal::date = $1
      `;

      const pendapatan = await pool.query(query, [tanggal]);
      res.status(200).json(pendapatan.rows);
    } catch (error) {
      console.error("Gagal mengambil pendapatan:", error);
      res.status(500).json({ error: "Terjadi kesalahan di server" });
    }
  } else {
    res.status(405).json({ error: "Method Not Allowed" });
  }
}

export default withAuth(tahunan);
