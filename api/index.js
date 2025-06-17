import { withCORS } from "../utils/withCORS";

function handler(req, res) {
  res.status(200).json({ message: 'Halo dari API Vercel! 😘' });
}

export default withCORS(handler)