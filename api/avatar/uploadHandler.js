import fs from 'fs';
import { IncomingForm } from 'formidable';
import { createClient } from '@supabase/supabase-js';
import pool from '../../lib/db.js';
import { withAuth } from '../../middleware/authMiddleware.js';
import { withCORS } from '../../utils/withCORS.js';

export const config = {
    api: {
        bodyParser: false,
    },
};

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

async function uploadHandler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    const { id } = req.user;

    const form = new IncomingForm({ keepExtensions: true });
    form.parse(req, async (err, fields, files) => {
        if (err) {
            return res.status(500).json({ error: 'Upload gagal!' });
        }

        const file = files.gambar?.[0];
        if (!file) {
            return res.status(400).json({ error: "File tidak ditemukan!" });
        }

        try {
            const fileBuffer = await fs.promises.readFile(file.filepath);
            const filename = `avatar-${id}-${Date.now()}.jpg`;

            const { data, error } = await supabase.storage
                .from('avatar')
                .upload(filename, fileBuffer, {
                    contentType: file.mimetype,
                    upsert: true,
                });

            if (error) {
                console.error("Gagal upload ke Supabase:", error.message);
                return res.status(500).json({ error: "Gagal upload ke Supabase" });
            }

            // Update database PostgreSQL
            const result = await pool.query(
                'SELECT file FROM avatar WHERE account_uid = $1 LIMIT 1',
                [id]
            );

            const hasExisting = result.rows.length > 0;

            if (hasExisting) {
                await pool.query(
                    'UPDATE avatar SET file = $1 WHERE account_uid = $2',
                    [filename, id]
                );
            } else {
                await pool.query(
                    'INSERT INTO avatar (file, account_uid) VALUES ($1, $2)',
                    [filename, id]
                );
            }

            res.status(200).json({ status: "success", filename });
        } catch (err) {
            console.error("Gagal simpan avatar:", err);
            res.status(500).json({ error: "Gagal simpan ke database 😭" });
        }
    });
}

export default withCORS(withAuth(uploadHandler));
