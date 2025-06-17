import { withAuth } from "../../middleware/authMiddleware.js";
import pool from "../../lib/db.js";

async function harian(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { tanggal } = req.query;
  const { id } = req.user;

  if (!tanggal) {
    return res.status(400).json({ error: "Parameter 'tanggal' wajib diisi (format: YYYY-MM-DD)" });
  }

  const data = {
    date: new Date(tanggal),
    income: {
      domba: { transaksi: [] },
      pakan: { transaksi: [] },
      price: 0
    },
    expanse: {
      bahan_baku: { transaksi: [] },
      price: 0
    }
  };

  try {
    const query = `
      WITH 
      parameter AS (
        SELECT CAST($1 AS DATE) AS tanggal, CAST($2 AS INTEGER) AS account_uid
      ),
      domba_transaksi AS (
        SELECT 'Penjualan Domba' AS kategori, jd.jenis AS nama, kd.kondisi AS kondisi, 
               pd.jumblah, pd.harga, pd.total_harga, p.tanggal
        FROM penjualan_domba pd
        JOIN jenis_domba jd ON pd.jenis_id = jd.id
        JOIN kondisi_domba kd ON pd.kondisi_domba = kd.id
        JOIN pemasukan p ON pd.pemasukan_id = p.id
        JOIN parameter param ON DATE(p.tanggal) = param.tanggal
        WHERE p.account_uid = param.account_uid
      ),
      pakan_transaksi AS (
        SELECT 'Penjualan Pakan' AS kategori, jp.jenis AS nama, NULL AS kondisi,
               pp.jumblah, pp.harga, pp.total_harga, p.tanggal
        FROM penjualan_pakan pp
        JOIN jenis_pakan jp ON pp.jenis_id = jp.id
        JOIN pemasukan p ON pp.pemasukan_id = p.id
        JOIN parameter param ON DATE(p.tanggal) = param.tanggal
        WHERE p.account_uid = param.account_uid
      ),
      bahan_transaksi AS (
        SELECT 'Pembelian Bahan Baku' AS kategori, bb.nama_bahan AS nama, NULL AS kondisi,
               pb.jumblah, pb.harga, pb.total_harga, p.tanggal
        FROM pembelian_bahan_baku pb
        JOIN bahan_baku bb ON pb.jenis_id = bb.id
        JOIN pengeluaran p ON pb.pengeluaran_id = p.id
        JOIN parameter param ON DATE(p.tanggal) = param.tanggal
        WHERE p.account_uid = param.account_uid
      ),
      total_pemasukan AS (
        SELECT SUM(total_harga) AS total_pemasukan
        FROM pemasukan
        JOIN parameter param ON DATE(pemasukan.tanggal) = param.tanggal
        WHERE pemasukan.account_uid = param.account_uid
      ),
      total_pengeluaran AS (
        SELECT SUM(total_harga) AS total_pengeluaran
        FROM pengeluaran
        JOIN parameter param ON DATE(pengeluaran.tanggal) = param.tanggal
        WHERE pengeluaran.account_uid = param.account_uid
      )

      SELECT * FROM (
        SELECT kategori, nama, kondisi, jumblah, harga, total_harga, tanggal FROM domba_transaksi
        UNION ALL
        SELECT kategori, nama, kondisi, jumblah, harga, total_harga, tanggal FROM pakan_transaksi
        UNION ALL
        SELECT kategori, nama, kondisi, jumblah, harga, total_harga, tanggal FROM bahan_transaksi
      ) AS transaksi_hari_ini

      UNION ALL

      SELECT 'TOTAL PEMASUKAN', '', '', NULL, NULL, total_pemasukan, (SELECT tanggal FROM parameter) FROM total_pemasukan
      UNION ALL
      SELECT 'TOTAL PENGELUARAN', '', '', NULL, NULL, total_pengeluaran, (SELECT tanggal FROM parameter) FROM total_pengeluaran;
    `;

    const pendapatan = await pool.query(query, [tanggal, id]);

    for (const row of pendapatan.rows) {
      const { kategori, nama, kondisi, jumblah, harga, total_harga } = row;

      switch (kategori) {
        case 'Penjualan Domba':
          data.income.domba.transaksi.push({
            jenis: nama,
            kondisi: kondisi || null,
            count: jumblah,
            price_unit: harga,
            price: total_harga
          });
          break;
        case 'Penjualan Pakan':
          data.income.pakan.transaksi.push({
            jenis: nama,
            count: jumblah,
            price_unit: harga,
            price: total_harga
          });
          break;
        case 'Pembelian Bahan Baku':
          data.expanse.bahan_baku.transaksi.push({
            jenis: nama,
            count: jumblah,
            price_unit: harga,
            price: total_harga
          });
          break;
        case 'TOTAL PEMASUKAN':
          data.income.price = Number(total_harga) || 0;
          break;
        case 'TOTAL PENGELUARAN':
          data.expanse.price = Number(total_harga) || 0;
          break;
      }
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error("Gagal mengambil pendapatan:", error);
    return res.status(500).json({ error: "Terjadi kesalahan di server" });
  }
}

export default withAuth(harian);
