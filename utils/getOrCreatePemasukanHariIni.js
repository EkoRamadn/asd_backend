import pool from "../lib/db.js"

export async function getOrCreatePemasukanHariIni(total_harga = 0) {

    const check = await pool.query(
        `SELECT id FROM pemasukan WHERE tanggal::date = CURRENT_DATE`
    );

    if (check.rows.length > 0) {
        return check.rows[0].id;
    }


    const insert = await pool.query(
        `INSERT INTO pemasukan(tanggal, total_harga) VALUES (NOW(), $1) RETURNING id`,
        [total_harga]
    );

    return insert.rows[0].id;
}
