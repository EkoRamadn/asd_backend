import { createClient } from '@supabase/supabase-js';
import { withCORS } from '../../utils/withCORS.js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function image(req, res) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const filename = url.searchParams.get("file");

    if (!filename) {
        res.statusCode = 400;
        res.end("Parameter 'file' wajib diisi ya sayang 🥺");
        return;
    }

    // Ambil dari Supabase Storage (bucket: avatars)
    const { data, error } = await supabase
        .storage
        .from('avatar')
        .download(filename);

    if (error || !data) {
        res.statusCode = 404;
        res.end("Gambar tidak ditemukan di Supabase 😭");
        return;
    }

    // Ubah stream jadi buffer (karena Next/Vercel tidak support stream langsung)
    const buffer = await data.arrayBuffer();

    res.setHeader("Content-Type", "image/jpeg"); // Atau sesuaikan jika WebP/PNG
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.statusCode = 200;
    res.end(Buffer.from(buffer));
}

export default withCORS(image)