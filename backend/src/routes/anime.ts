import express from 'express';
import { 
  fetchAnimeList, 
  fetchAnimeDetails, 
  fetchMoviesList, 
  fetchCartoonList, 
  fetchOngoingSeries, 
  fetchUpcomingEpisodes 
} from '../scraper';
import { ApiResponse } from '../types';

const router = express.Router();

// GET /api/anime/list - Get paginated anime list
router.get('/list', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const data = await fetchAnimeList(page);
    
    const response: ApiResponse = {
      success: true,
      data,
      message: `Fetched ${data.items.length} anime items for page ${page}`
    };
    
    return res.json(response);
  } catch (error) {
    console.error('Error fetching anime list:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch anime list',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/anime/details - Get anime details with episodes
router.get('/details', async (req, res) => {
  try {
    const { url, post_id, season } = req.query;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: url'
      });
    }
    
    const postId = post_id ? parseInt(post_id as string) : 0;
    const seasonNum = season ? parseInt(season as string) : null;
    
    const data = await fetchAnimeDetails({
      url: url as string,
      postId,
      season: seasonNum
    });
    
    const response: ApiResponse = {
      success: true,
      data,
      message: 'Fetched anime details'
    };
    
    return res.json(response);
  } catch (error) {
    console.error('Error fetching anime details:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch anime details',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/anime/movies - Get movies list
router.get('/movies', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const query = req.query.q as string || '';
    
    const data = await fetchMoviesList(page, query);
    
    const response: ApiResponse = {
      success: true,
      data,
      message: `Fetched ${data.items.length} movies for page ${page}`
    };
    
    return res.json(response);
  } catch (error) {
    console.error('Error fetching movies:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch movies',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/anime/cartoons - Get cartoons list
router.get('/cartoons', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const query = req.query.q as string || '';
    
    const data = await fetchCartoonList(page, query);
    
    const response: ApiResponse = {
      success: true,
      data,
      message: `Fetched ${data.items.length} cartoons for page ${page}`
    };
    
    return res.json(response);
  } catch (error) {
    console.error('Error fetching cartoons:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch cartoons',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/anime/ongoing - Get ongoing series
router.get('/ongoing', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const query = req.query.q as string || '';
    
    const data = await fetchOngoingSeries(page, query);
    
    const response: ApiResponse = {
      success: true,
      data,
      message: `Fetched ${data.items.length} ongoing series for page ${page}`
    };
    
    return res.json(response);
  } catch (error) {
    console.error('Error fetching ongoing series:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch ongoing series',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/anime/upcoming - Get upcoming episodes
router.get('/upcoming', async (req, res) => {
  try {
    const data = await fetchUpcomingEpisodes();
    
    const response: ApiResponse = {
      success: true,
      data,
      message: `Fetched ${data.episodes.length} upcoming episodes`
    };
    
    return res.json(response);
  } catch (error) {
    console.error('Error fetching upcoming episodes:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch upcoming episodes',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
