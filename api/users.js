import fs from 'fs';
import path from 'path';
import { parseBody } from '../utils/bodyParser.js';

const usersPath = path.join(process.cwd(), 'data', 'users.json');

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const users = JSON.parse(fs.readFileSync(usersPath));
    res.status(200).json(users);
  } else if (req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const users = JSON.parse(fs.readFileSync(usersPath));
      users.push(body);
      fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
      res.status(201).json({ message: 'User ditambahkan 💖', user: body });
    } catch (e) {
      res.status(400).json({ error: 'Gagal parsing body' });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
