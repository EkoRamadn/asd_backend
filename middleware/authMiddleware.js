import { verifyToken } from "../utils/jwt.js";

export function withAuth(handler) {
  return async function (req, res) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) return res.status(401).json({ error: "Token tidak ada " });

    try {
      const user = verifyToken(token);
      req.user = user;
      return handler(req, res);
    } catch (err) {
      return res.status(403).json({ error: "Token invalid atau expired " });
    }
  };
}
