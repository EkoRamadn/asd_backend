import { getOrCreatePemasukanHariIni } from "../utils/getOrCreatePemasukanHariIni.js";
import { withAuth } from "../middleware/authMiddleware.js";
import pool from "../lib/db.js";

async function insertPenjualanDomba(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    try {
        const { id } = req.user
        const data = await pool.query(
            `SELECT a.username,a.email,av.file FROM account a LEFT JOIN avatar av ON a.uid = av.account_uid WHERE uid=$1`,
            [id]
        );
        console.log(id)

        res.status(201).json(data.rows);
    } catch (error) {
        console.error("Gagal insert penjualan domba:", error);
        res.status(500).json({ error: "Terjadi kesalahan di server" });
    }
}

export default withAuth(insertPenjualanDomba);