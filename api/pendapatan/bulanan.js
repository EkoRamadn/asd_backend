import { withAuth } from "../../middleware/authMiddleware.js";
import pool from "../../lib/db.js";

async function bulanan(req, res) {
  if (req.method === "GET") {
    const { bulan } = req.query;

    if (!bulan) {
      return res.status(400).json({ error: "Parameter 'bulan tahun' wajib diisi (format: YYYY-MM-DD)" });
    }

    try {
      const query = `
      SELECT
          tanggal_hari :: date AS tanggal,
          COALESCE(SUM(p.total_harga), 0) AS total_pemasukan,
          COALESCE(SUM(l.total_harga), 0) AS total_pengeluaran
      FROM
          generate_series(
              DATE_TRUNC('month',  $1::date),
              (
                  DATE_TRUNC('month',  $1::date) + INTERVAL '1 month - 1 day'
              ) :: date,
              INTERVAL '1 day'
          ) AS tanggal_hari
          LEFT JOIN pemasukan p ON p.tanggal :: date = tanggal_hari :: date
          AND p.accout_uid = '1'
          LEFT JOIN pengeluaran l ON l.tanggal :: date = tanggal_hari :: date
          AND l.accout_uid = '1'
      GROUP BY
          tanggal_hari
      HAVING
          SUM(p.total_harga) IS NOT NULL
          OR SUM(l.total_harga) IS NOT NULL
      ORDER BY
          tanggal_hari;
      `;

      const pendapatan = await pool.query(query, [bulan]);
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
