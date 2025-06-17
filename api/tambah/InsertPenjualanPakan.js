import { getOrCreatePemasukanHariIni } from "../../utils/getOrCreatePemasukanHariIni.js";
import { withAuth } from "../../middleware/authMiddleware.js";
import pool from "../../lib/db.js";
import { withCORS } from "../../utils/withCORS.js";

async function insertPenjualanPakan(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { jenis_id, harga, jumblah, total_harga } = req.body;
    const { id } = req.user;

    const pemasukanId = await getOrCreatePemasukanHariIni(total_harga);

    await pool.query(
      `INSERT INTO penjualan_pakan( jenis_id, harga, jumblah, total_harga,account_uid)
       VALUES ($1, $2, $3, $4, $5)`,
      [jenis_id, harga, jumblah, total_harga, id]
    );

    res.status(201).json({ message: "Penjualan pakan berhasil ditambahkan" });
  } catch (error) {
    console.error("Gagal insert penjualan pakan:", error);
    res.status(500).json({ error: "Terjadi kesalahan di server" });
  }
}

export default withCORS(withAuth(insertPenjualanPakan));
