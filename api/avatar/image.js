import fs from 'fs';
import path from 'path';

export default function image(req, res) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const filename = url.searchParams.get("file");

    const filePath = path.join(process.cwd(), 'public', 'assets', filename);

    if (!fs.existsSync(filePath)) {
        res.writeHead(404);
        res.end("File tidak ditemukan");
        return;
    }

    const stream = fs.createReadStream(filePath);
    res.writeHead(200, { 'Content-Type': 'image/jpeg' });
    stream.pipe(res);
}
