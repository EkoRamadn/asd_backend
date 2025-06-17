import { withAuth } from "../../middleware/authMiddleware.js";
import pool from "../../lib/db.js";
import { withCORS } from "../../utils/withCORS.js";

async function bulanan(req, res) {
  if (req.method === "GET") {
    const { tahun, bulan } = req.query;
    const { id } = req.user;

    if (!bulan || !tahun) {
      return res.status(400).json({ error: "Parameter 'bulan tahun' wajib diisi (format: YYYY-MM-DD)" });
    }

    try {
      const query = `
WITH param AS (
    SELECT CAST($1 AS INTEGER) AS tahun, CAST($2 AS INTEGER) AS bulan
),
tanggal_range AS (
  SELECT
    make_date(tahun, bulan, 1) AS tanggal_mulai,
    (make_date(tahun, bulan, 1) + INTERVAL '1 month - 1 day')::date AS tanggal_selesai
  FROM param
),
tanggal_bulan_ini AS (
  SELECT generate_series(
    (SELECT tanggal_mulai FROM tanggal_range),
    (SELECT tanggal_selesai FROM tanggal_range),
    INTERVAL '1 day'
  )::date AS tanggal
),
pemasukan_per_hari AS (
  SELECT
    DATE(tanggal) AS tanggal,
    SUM(total_harga) AS total_pemasukan
  FROM pemasukan, param
  WHERE account_uid = $3
    AND EXTRACT(YEAR FROM tanggal) = param.tahun
    AND EXTRACT(MONTH FROM tanggal) = param.bulan
  GROUP BY DATE(tanggal)
),
pengeluaran_per_hari AS (
  SELECT
    DATE(tanggal) AS tanggal,
    SUM(total_harga) AS total_pengeluaran
  FROM pengeluaran, param
  WHERE account_uid = $3
    AND EXTRACT(YEAR FROM tanggal) = param.tahun
    AND EXTRACT(MONTH FROM tanggal) = param.bulan
  GROUP BY DATE(tanggal)
),
combined AS (
  SELECT
    t.tanggal,
    COALESCE(p.total_pemasukan, 0) AS total_pemasukan,
    COALESCE(pe.total_pengeluaran, 0) AS total_pengeluaran
  FROM tanggal_bulan_ini t
  LEFT JOIN pemasukan_per_hari p ON t.tanggal = p.tanggal
  LEFT JOIN pengeluaran_per_hari pe ON t.tanggal = pe.tanggal
),
prev_day_data AS (
  SELECT
    tanggal,
    total_pemasukan,
    total_pengeluaran,
    LAG(total_pemasukan) OVER (ORDER BY tanggal) AS prev_total_pemasukan,
    LAG(total_pengeluaran) OVER (ORDER BY tanggal) AS prev_total_pengeluaran
  FROM combined
)
SELECT
  tanggal,
  CASE 
    WHEN total_pemasukan = 0 THEN prev_total_pemasukan
    ELSE total_pemasukan
  END AS total_pemasukan,
  CASE 
    WHEN total_pengeluaran = 0 THEN prev_total_pengeluaran
    ELSE total_pengeluaran
  END AS total_pengeluaran
FROM prev_day_data
WHERE total_pemasukan > 0 OR total_pengeluaran > 0
ORDER BY tanggal;
      `;

      const pendapatan = await pool.query(query, [tahun, bulan, id]);
      res.status(200).json(pendapatan.rows);
    } catch (error) {
      console.error("Gagal mengambil pendapatan:", error);
      res.status(500).json({ error: "Terjadi kesalahan di server" });
    }
  } else {
    res.status(405).json({ error: "Method Not Allowed" });
  }
}

export default withCORS(withAuth(bulanan));
