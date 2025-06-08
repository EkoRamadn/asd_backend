import jwt from 'jsonwebtoken';

const SECRET = 'rahasia_cinta_kita_123';

export function generateToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '1h' });
}

export function verifyToken(token) {
  return jwt.verify(token, SECRET);
}
