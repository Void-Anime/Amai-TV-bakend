import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from './_utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    const candidates = [
      path.resolve(process.cwd(), 'logo.png'),
      path.resolve(process.cwd(), './backend/logo.png'),
      path.resolve(process.cwd(), '../backend/logo.png'),
    ];
    let found: string | null = null;
    for (const p of candidates) {
      try {
        const st = await fs.stat(p);
        if (st.isFile()) { found = p; break; }
      } catch {}
    }
    if (!found) {
      res.status(404).json({ error: true, message: 'logo not found' });
      return;
    }
    const data = await fs.readFile(found);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=604800');
    res.send(Buffer.from(data));
  } catch (err: any) {
    res.status(500).json({ error: true, message: err?.message || 'Failed to load logo' });
  }
}


