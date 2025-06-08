import { getOrCreatePemasukanHariIni } from "../../utils/getOrCreatePemasukanHariIni.js";
import { withAuth } from "../../middleware/authMiddleware.js";
import pool from "../../lib/db.js";

async function insertPenjualanDomba(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { jenis_id, harga, jumblah, total_harga } = req.body;

    const pemasukanId = await getOrCreatePemasukanHariIni(total_harga);

    await pool.query(
      `INSERT INTO penjualan_domba(pemasukan_id, jenis_id, harga, jumblah, total_harga)
       VALUES ($1, $2, $3, $4, $5)`,
      [pemasukanId, jenis_id, harga, jumblah, total_harga]
    );

    res.status(201).json({ message: "Penjualan domba berhasil ditambahkan" });
  } catch (error) {
    console.error("Gagal insert penjualan domba:", error);
    res.status(500).json({ error: "Terjadi kesalahan di server" });
  }
}

export default withAuth(insertPenjualanDomba);