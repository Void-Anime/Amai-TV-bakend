"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const scraper_1 = require("../scraper");
const router = express_1.default.Router();
const BASE = 'https://animesalt.cc';
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
        let searchUrl = `${BASE}/?s=${encodeURIComponent(query)}`;
        if (type === 'movies') {
            searchUrl += '&post_type=movies';
        }
        else if (type === 'cartoons') {
            searchUrl += '&post_type=post';
        }
        else if (type === 'series') {
            searchUrl += '&post_type=series';
        }
        const response = await axios_1.default.get(searchUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 20000,
        });
        const html = String(response.data || '');
        const allResults = (0, scraper_1.parseAnimeListFromHtml)(html);
        let filteredResults = allResults;
        if (type === 'movies') {
            filteredResults = allResults.filter(item => item.url.includes('/movies/'));
        }
        else if (type === 'cartoons') {
            filteredResults = allResults.filter(item => item.url.includes('/cartoon/') ||
                (item.title && item.title.toLowerCase().includes('cartoon')) ||
                (item.title && item.title.toLowerCase().includes('animation')));
        }
        else if (type === 'series') {
            filteredResults = allResults.filter(item => item.url.includes('/series/'));
        }
        const data = {
            query: query,
            type: type,
            results: filteredResults,
            total: filteredResults.length
        };
        const response_data = {
            success: true,
            data,
            message: `Found ${filteredResults.length} results for "${query}"`
        };
        return res.json(response_data);
    }
    catch (error) {
        console.error('Error searching:', error);
        return res.status(500).json({
            success: false,
            error: 'Search failed',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/suggestions', async (req, res) => {
    try {
        const { q: query } = req.query;
        if (!query || query.length < 2) {
            return res.json({
                success: true,
                data: { suggestions: [] },
                message: 'Query too short for suggestions'
            });
        }
        const searchUrl = `${BASE}/?s=${encodeURIComponent(query)}`;
        const response = await axios_1.default.get(searchUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 10000,
        });
        const html = String(response.data || '');
        const results = (0, scraper_1.parseAnimeListFromHtml)(html);
        const suggestions = results
            .slice(0, 10)
            .map(item => ({
            title: item.title,
            url: item.url,
            type: item.url.includes('/movies/') ? 'movie' :
                item.url.includes('/cartoon/') ? 'cartoon' : 'series'
        }));
        const response_data = {
            success: true,
            data: { suggestions },
            message: `Found ${suggestions.length} suggestions`
        };
        return res.json(response_data);
    }
    catch (error) {
        console.error('Error getting suggestions:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to get suggestions',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=search.js.map