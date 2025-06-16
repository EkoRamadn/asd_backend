import { withAuth } from "../../middleware/authMiddleware.js";
import pool from "../../lib/db.js";

async function harian(req, res) {
  if (req.method === "GET") {
    const { tanggal } = req.query;
    const { id } = req.user;

    const data = {
      date: new Date(tanggal),
      income: {
        domba: {
          jenis: [],
          count: [],
          pricelist: [],
          price: []
        },
        pakan: {
          jenis: [],
          count: [],
          priceList: [],
          price: []
        },
        price: 0
      },
      expanse: {
        bahan_baku: {
          jenis: [],
          count: [],
          pricelist: [],
          price: 0
        }
      }
    };

    if (!tanggal) {
      return res.status(400).json({ error: "Parameter 'tanggal' wajib diisi (format: YYYY-MM-DD)" });
    }

    try {
      const query = `
        WITH 
parameter AS (
  SELECT 
    CAST($1 AS DATE) AS tanggal,
     CAST($2 AS INTEGER) AS account_uid
),

-- Detail penjualan domba
domba_transaksi AS (
  SELECT 
    'Penjualan Domba' AS kategori,
    jd.jenis AS nama,
    pd.jumblah,
    pd.harga,
    pd.total_harga,
    p.tanggal
  FROM penjualan_domba pd
  JOIN jenis_domba jd ON pd.jenis_id = jd.id
  JOIN pemasukan p ON pd.pemasukan_id = p.id
  JOIN parameter param ON DATE(p.tanggal) = param.tanggal
  WHERE p.account_uid = param.account_uid
),

-- Detail penjualan pakan
pakan_transaksi AS (
  SELECT 
    'Penjualan Pakan' AS kategori,
    jp.jenis AS nama,
    pp.jumblah,
    pp.harga,
    pp.total_harga,
    p.tanggal
  FROM penjualan_pakan pp
  JOIN jenis_pakan jp ON pp.jenis_id = jp.id
  JOIN pemasukan p ON pp.pemasukan_id = p.id
  JOIN parameter param ON DATE(p.tanggal) = param.tanggal
  WHERE p.account_uid = param.account_uid
),

-- Detail pembelian bahan baku
bahan_transaksi AS (
  SELECT 
    'Pembelian Bahan Baku' AS kategori,
    bb.nama_bahan AS nama,
    pb.jumblah,
    pb.harga,
    pb.total_harga,
    p.tanggal
  FROM pembelian_bahan_baku pb
  JOIN bahan_baku bb ON pb.jenis_id = bb.id
  JOIN pengeluaran p ON pb.pengeluaran_id = p.id
  JOIN parameter param ON DATE(p.tanggal) = param.tanggal
  WHERE p.account_uid = param.account_uid
),

-- Total pemasukan
total_pemasukan AS (
  SELECT SUM(total_harga) AS total_pemasukan
  FROM pemasukan
  JOIN parameter param ON DATE(pemasukan.tanggal) = param.tanggal
  WHERE pemasukan.account_uid = param.account_uid
),

-- Total pengeluaran
total_pengeluaran AS (
  SELECT SUM(total_harga) AS total_pengeluaran
  FROM pengeluaran
  JOIN parameter param ON DATE(pengeluaran.tanggal) = param.tanggal
  WHERE pengeluaran.account_uid = param.account_uid
)

-- Gabungkan semua transaksi
SELECT * FROM (
  SELECT kategori, nama, jumblah, harga, total_harga, tanggal FROM domba_transaksi
  UNION ALL
  SELECT kategori, nama, jumblah, harga, total_harga, tanggal FROM pakan_transaksi
  UNION ALL
  SELECT kategori, nama, jumblah, harga, total_harga, tanggal FROM bahan_transaksi
) AS transaksi_hari_ini

UNION ALL

-- Tambahkan total pemasukan dan pengeluaran
SELECT 
  'TOTAL PEMASUKAN' AS kategori,
  '' AS nama,
  NULL AS jumblah,
  NULL AS harga,
  total_pemasukan,
  (SELECT tanggal FROM parameter)
FROM total_pemasukan

UNION ALL

SELECT 
  'TOTAL PENGELUARAN' AS kategori,
  '' AS nama,
  NULL AS jumblah,
  NULL AS harga,
  total_pengeluaran,
  (SELECT tanggal FROM parameter)
FROM total_pengeluaran;

      `;

      const pendapatan = await pool.query(query, [tanggal, id]);


      for (const row of pendapatan.rows) {
        const kategori = row.kategori;

        if (kategori === 'Penjualan Domba') {
          data.income.domba.jenis.push(row.nama);
          data.income.domba.count.push(row.jumblah);
          data.income.domba.pricelist.push(row.harga);
          data.income.domba.price.push(row.total_harga)
          // data.income.domba.price += Number(row.total_harga);
        } else if (kategori === 'Penjualan Pakan') {
          data.income.pakan.jenis.push(row.nama);
          data.income.pakan.count.push(row.jumblah);
          data.income.pakan.priceList.push(row.harga);
          data.income.pakan.price += Number(row.total_harga);
        } else if (kategori === 'Pembelian Bahan Baku') {
          data.expanse.bahan_baku.jenis.push(row.nama);
          data.expanse.bahan_baku.count.push(row.jumblah);
          data.expanse.bahan_baku.pricelist.push(row.harga);
          data.expanse.bahan_baku.price.push(row.total_harga)
          // data.expanse.bahan_baku.price += Number(row.total_harga);
        } else if (kategori === 'TOTAL PEMASUKAN') {
          data.income.price = Number(row.total_harga);
        } else if (kategori === 'TOTAL PENGELUARAN') {
          // Ini nggak disimpan ke data langsung, karena kita udah hitung `bahan_baku.price` sendiri
          // Bisa kamu simpan kalau mau bandingkan total expense lainnya
        }
      }

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
