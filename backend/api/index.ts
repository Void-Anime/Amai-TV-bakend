// Vercel serverless entry for the backend API
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createApp } from '../src/app';
import serverless from 'serverless-http';

// Create Express app once and wrap with serverless-http
const app = createApp();
const handler = serverless(app);

export default async function vercelHandler(req: VercelRequest, res: VercelResponse) {
  return handler(req as any, res as any);
}


