import type { VercelRequest, VercelResponse } from '@vercel/node';

export function applyCors(req: VercelRequest, res: VercelResponse): boolean {
  const allowed = process.env.CORS_ORIGINS || '*';
  res.setHeader('Access-Control-Allow-Origin', allowed);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  return false;
}

export function badRequest(res: VercelResponse, message: string) {
  res.status(400).json({ error: true, message });
}

export function serverError(res: VercelResponse, err: any, fallback: string) {
  res.status(500).json({ error: true, message: err?.message || fallback });
}


