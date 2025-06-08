import { withAuth } from "../../middleware/authMiddleware.js";
import pool from "../../lib/db.js";

async function harian(req, res) {
  if (req.method === "GET") {
    const { tanggal } = req.query;

    if (!tanggal) {
      return res.status(400).json({ error: "Parameter 'tanggal' wajib diisi (format: YYYY-MM-DD)" });
    }

    try {
      const query = `
        SELECT 
          a.id AS pemasukan_id,
          a.total_harga AS total,
          a.tanggal,
          'domba' AS tipe,
          b.jenis_id AS jenis,
          b.harga,
          b.jumblah AS jumlah,
          b.total_harga
        FROM pemasukan a
        LEFT JOIN penjualan_domba b ON b.pemasukan_id = a.id
        WHERE a.tanggal::date = $1

        UNION ALL

        SELECT 
          a.id AS pemasukan_id,
          a.total_harga AS total,
          a.tanggal,
          'pakan' AS tipe,
          c.jenis_id AS jenis,
          c.harga,
          c.jumblah AS jumlah,
          c.total_harga
        FROM pemasukan a
        LEFT JOIN penjualan_pakan c ON c.pemasukan_id = a.id
        WHERE a.tanggal::date = $1
      `;

      const pendapatan = await pool.query(query, [tanggal]);
      const rows = pendapatan.rows;

      if (rows.length === 0) {
        return res.status(404).json({ message: "Tidak ada data pemasukan untuk tanggal ini" });
      }

      // ⬇️ Pindahkan ini ke setelah rows didefinisikan
      const data = {
        total: rows[0].total,
        tanggal: rows[0].tanggal,
        domba: [],
        pakan: []
      };

      rows.forEach(row => {
        const item = {
          jenis: row.jenis,
          harga: row.harga,
          jumlah: row.jumlah,
          total: row.total_harga
        };

        if (row.tipe === 'domba') {
          data.domba.push(item);
        } else if (row.tipe === 'pakan') {
          data.pakan.push(item);
        }
      });

      res.status(200).json(data);
    } catch (error) {
      console.error("Gagal mengambil pendapatan:", error);
      res.status(500).json({ error: "Terjadi kesalahan di server" });
    }
  } else {
    res.status(405).json({ error: "Method Not Allowed" });
  }
}

export default withAuth(harian);
