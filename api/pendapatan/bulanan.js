import { withAuth } from "../../middleware/authMiddleware.js";
import pool from "../../lib/db.js";

async function bulanan(req, res) {
  if (req.method === "GET") {
    const { dari, sampai } = req.query;

    if (!dari || !sampai) {
      return res.status(400).json({ error: "Parameter 'bulan tahun' wajib diisi (format: YYYY-MM-DD)" });
    }

    try {
      const query = `
       SELECT 
        a.tanggal::date AS tanggal,
        TO_CHAR(MIN(a.tanggal), 'HH24:MI:SS') AS jam,
        SUM(DISTINCT a.total_harga) AS total,
        COALESCE(SUM(b.total_harga), 0) AS domba,
        COALESCE(SUM(c.total_harga), 0) AS pakan
      FROM pemasukan a
      LEFT JOIN penjualan_domba b ON b.pemasukan_id = a.id
      LEFT JOIN penjualan_pakan c ON c.pemasukan_id = a.id
      WHERE a.tanggal::date BETWEEN $1 AND $2
      GROUP BY a.tanggal::date
      ORDER BY a.tanggal::date;
      `;

      const pendapatan = await pool.query(query, [dari, sampai]);
      res.status(200).json(pendapatan.rows);
    } catch (error) {
      console.error("Gagal mengambil pendapatan:", error);
      res.status(500).json({ error: "Terjadi kesalahan di server" });
    }
  } else {
    res.status(405).json({ error: "Method Not Allowed" });
  }
}

export default withAuth(bulanan);
