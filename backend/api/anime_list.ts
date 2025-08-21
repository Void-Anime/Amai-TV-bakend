import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors, badRequest, serverError } from './_utils';
import { fetchAnimeList } from '../src/scraper';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;
  try {
    const pageRaw = req.query.page as string | undefined;
    const page = Number(pageRaw || 1);
    const data = await fetchAnimeList(Number.isFinite(page) ? page : 1);
    res.status(200).json(data);
  } catch (err: any) {
    serverError(res, err, 'Failed to fetch anime list');
  }
}


