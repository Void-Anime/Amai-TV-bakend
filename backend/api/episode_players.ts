import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors, badRequest, serverError } from './_utils';
import { fetchEpisodePlayers } from '../src/scraper';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;
  try {
    const url = String(req.query.url || '');
    if (!url) return badRequest(res, 'Missing url');
    const items = await fetchEpisodePlayers(url);
    res.status(200).json({ url, items });
  } catch (err: any) {
    serverError(res, err, 'Failed to fetch players');
  }
}


