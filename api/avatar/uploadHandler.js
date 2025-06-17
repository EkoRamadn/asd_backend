import fs from 'fs';
import path from 'path';
import { IncomingForm } from 'formidable';
import pool from '../../lib/db.js';
import { withAuth } from '../../middleware/authMiddleware.js';

const assetsPath = path.join(process.cwd(), 'public', 'assets');

async function uploadHandler(req, res) {
    if (req.method !== "POST") {
        res.status(405).json({ error: "Method Not Allowed" });
        return;
    }

    const { id } = req.user;
    const form = new IncomingForm({ uploadDir: assetsPath, keepExtensions: true });

    form.parse(req, async (err, fields, files) => {
        if (err) {
            res.writeHead(500);
            res.end('Upload gagal!');
            return;
        }

        const file = files.gambar;
        if (!file) {
            res.writeHead(400);
            res.end('File tidak ditemukan!');
            return;
        }

        const filename = path.basename(file[0].filepath);

        try {
            // Ambil file lama (jika ada)
            const result = await pool.query(
                'SELECT file FROM avatar WHERE account_uid = $1 LIMIT 1',
                [id]
            );

            const hasExisting = result.rows.length > 0;

            if (hasExisting) {
                const oldFile = result.rows[0].file;
                const oldPath = path.join(assetsPath, oldFile);

                // Hapus file lama kalau ada
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }

                // Update nama file di database
                await pool.query(
                    'UPDATE avatar SET file = $1 WHERE account_uid = $2',
                    [filename, id]
                );
            } else {
                // Belum ada file sebelumnya, insert baru
                await pool.query(
                    'INSERT INTO avatar (file, account_uid) VALUES ($1, $2)',
                    [filename, id]
                );
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: "success", filename }));

        } catch (err) {
            console.error("Gagal simpan atau update avatar:", err);
            res.writeHead(500);
            res.end('Gagal simpan ke database 😭');
        }
    });
}

export default withAuth(uploadHandler);
