import { getOrCreatePemasukanHariIni } from "../../utils/getOrCreatePemasukanHariIni.js";
import { withAuth } from "../../middleware/authMiddleware.js";
import pool from "../../lib/db.js";
import { withCORS } from "../../utils/withCORS.js";

async function insertPenjualanDomba(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }




  try {
    const { jenisDomba, kondisi, jumlahDomba, hargaDomba, totalDomba } = req.body;
    const { id } = req.user

    // const pemasukanId = await getOrCreatePemasukanHariIni(totalDomba);

    await pool.query(
      `INSERT INTO penjualan_domba( jenis_id, harga, jumblah, total_harga, account_uid, kondisi_domba)
       VALUES ($1, $2, $3, $4, $5 ,$6)`,
      [jenisDomba, hargaDomba, jumlahDomba, totalDomba, id, kondisi]
    );
    console.log(id)

    res.status(201).json({ message: "Penjualan domba berhasil ditambahkan" });
  } catch (error) {
    console.error("Gagal insert penjualan domba:", error);
    res.status(500).json({ error: "Terjadi kesalahan di server" });
  }
}

export default withCORS(withAuth(insertPenjualanDomba));