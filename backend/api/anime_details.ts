import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors, badRequest, serverError } from './_utils';
import { fetchAnimeDetails } from '../src/scraper';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;
  try {
    const url = String(req.query.url || '');
    const postIdRaw = req.query.post_id as string | undefined;
    const seasonRaw = req.query.season as string | undefined;
    if (!url) return badRequest(res, 'Missing url');
    const postId = postIdRaw ? Number(postIdRaw) : 0;
    const season = seasonRaw ? Number(seasonRaw) : undefined;
    const data = await fetchAnimeDetails({ url, postId, season });
    res.status(200).json(data);
  } catch (err: any) {
    serverError(res, err, 'Failed to fetch anime details');
  }
}


