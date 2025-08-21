import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors, badRequest, serverError } from './_utils';
import { parseAnimeListFromHtml } from '../src/scraper';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;
  try {
    const q = String(req.query.q || '').trim();
    if (!q) return badRequest(res, 'Missing q');
    const axios = (await import('axios')).default;
    const { data: html } = await axios.get(`https://animesalt.cc/?s=${encodeURIComponent(q)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 20000,
    });
    const items = parseAnimeListFromHtml(String(html));
    res.status(200).json({ q, items });
  } catch (err: any) {
    serverError(res, err, 'Failed to search');
  }
}


