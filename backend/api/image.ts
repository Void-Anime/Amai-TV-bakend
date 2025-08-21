import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors, badRequest } from './_utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;
  try {
    const src = String(req.query.src || '');
    if (!src) return badRequest(res, 'Missing src');
    if (/^data:/i.test(src)) {
      const match = src.match(/^data:([^;]+);base64,(.*)$/i);
      if (match) {
        const mime = match[1] || 'image/png';
        const b64 = match[2] || '';
        res.setHeader('Content-Type', mime);
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.send(Buffer.from(b64, 'base64'));
        return;
      }
      res.redirect(302, src);
      return;
    }
    if (!/^https?:\/\//i.test(src)) return badRequest(res, 'Invalid src');
    const origin = 'https://animesalt.cc';
    const axios = (await import('axios')).default;
    const resp = await axios.get<ArrayBuffer>(src, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0',
        Referer: origin + '/',
        Origin: origin,
        Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
      timeout: 20000,
    });
    const ct = resp.headers['content-type'] || 'image/jpeg';
    res.setHeader('Content-Type', Array.isArray(ct) ? ct[0] : ct);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(Buffer.from(resp.data));
  } catch (err: any) {
    try {
      const src = String(req.query.src || '');
      if (src) {
        res.redirect(302, src);
        return;
      }
    } catch {}
    res.status(502).json({ error: true, message: 'Image proxy failed' });
  }
}


