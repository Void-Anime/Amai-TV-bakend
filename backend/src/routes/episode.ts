import express from 'express';
import { fetchEpisodePlayers } from '../scraper';
import { ApiResponse } from '../types';

const router = express.Router();

// GET /api/episode/players - Get episode video sources
router.get('/players', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: url'
      });
    }
    
    console.log(`Fetching players for episode: ${url}`);
    
    const sources = await fetchEpisodePlayers(url as string);
    
    const data = {
      episodeUrl: url as string,
      sources,
      totalSources: sources.length
    };
    
    const response: ApiResponse = {
      success: true,
      data,
      message: `Found ${sources.length} video sources for episode`
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching episode players:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch episode players',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
