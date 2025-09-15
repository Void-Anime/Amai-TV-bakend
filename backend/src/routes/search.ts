import express from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { parseAnimeListFromHtml } from '../scraper';
import { ApiResponse } from '../types';

const router = express.Router();
const BASE = 'https://animesalt.cc';

// GET /api/search - Search for anime, movies, cartoons
router.get('/', async (req, res) => {
  try {
    const { q: query, type = 'all' } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: q (query)'
      });
    }
    
    console.log(`Searching for: "${query}" (type: ${type})`);
    
    // Build search URL based on type
    let searchUrl = `${BASE}/?s=${encodeURIComponent(query as string)}`;
    
    if (type === 'movies') {
      searchUrl += '&post_type=movies';
    } else if (type === 'cartoons') {
      searchUrl += '&post_type=post';
    } else if (type === 'series') {
      searchUrl += '&post_type=series';
    }
    
    // Fetch search results
    const response = await axios.get(searchUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 20000,
    });
    
    const html = String(response.data || '');
    const allResults = parseAnimeListFromHtml(html);
    
    // Filter results based on type
    let filteredResults = allResults;
    
    if (type === 'movies') {
      filteredResults = allResults.filter(item => 
        item.url.includes('/movies/')
      );
    } else if (type === 'cartoons') {
      filteredResults = allResults.filter(item => 
        item.url.includes('/cartoon/') || 
        (item.title && item.title.toLowerCase().includes('cartoon')) ||
        (item.title && item.title.toLowerCase().includes('animation'))
      );
    } else if (type === 'series') {
      filteredResults = allResults.filter(item => 
        item.url.includes('/series/')
      );
    }
    
    const data = {
      query: query as string,
      type: type as string,
      results: filteredResults,
      total: filteredResults.length
    };
    
    const response_data: ApiResponse = {
      success: true,
      data,
      message: `Found ${filteredResults.length} results for "${query}"`
    };
    
    res.json(response_data);
  } catch (error) {
    console.error('Error searching:', error);
    res.status(500).json({
      success: false,
      error: 'Search failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/search/suggestions - Get search suggestions
router.get('/suggestions', async (req, res) => {
  try {
    const { q: query } = req.query;
    
    if (!query || (query as string).length < 2) {
      return res.json({
        success: true,
        data: { suggestions: [] },
        message: 'Query too short for suggestions'
      });
    }
    
    // This is a placeholder - you could implement actual search suggestions
    // by calling the search API and returning just titles
    const searchUrl = `${BASE}/?s=${encodeURIComponent(query as string)}`;
    
    const response = await axios.get(searchUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 10000,
    });
    
    const html = String(response.data || '');
    const results = parseAnimeListFromHtml(html);
    
    const suggestions = results
      .slice(0, 10) // Limit to 10 suggestions
      .map(item => ({
        title: item.title,
        url: item.url,
        type: item.url.includes('/movies/') ? 'movie' : 
              item.url.includes('/cartoon/') ? 'cartoon' : 'series'
      }));
    
    const response_data: ApiResponse = {
      success: true,
      data: { suggestions },
      message: `Found ${suggestions.length} suggestions`
    };
    
    res.json(response_data);
  } catch (error) {
    console.error('Error getting suggestions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get suggestions',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
