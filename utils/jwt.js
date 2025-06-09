import jwt from 'jsonwebtoken';
import { SECRET } from '../config';

export function generateToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '1h' });
}

export function verifyToken(token) {
  return jwt.verify(token, SECRET);
}
