"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const scraper_1 = require("../scraper");
const router = express_1.default.Router();
router.get('/list', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const data = await (0, scraper_1.fetchAnimeList)(page);
        const response = {
            success: true,
            data,
            message: `Fetched ${data.items.length} anime items for page ${page}`
        };
        return res.json(response);
    }
    catch (error) {
        console.error('Error fetching anime list:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch anime list',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/details', async (req, res) => {
    try {
        const { url, post_id, season } = req.query;
        if (!url) {
            return res.status(400).json({
                success: false,
                error: 'Missing required parameter: url'
            });
        }
        const postId = post_id ? parseInt(post_id) : 0;
        const seasonNum = season ? parseInt(season) : null;
        const data = await (0, scraper_1.fetchAnimeDetails)({
            url: url,
            postId,
            season: seasonNum
        });
        const response = {
            success: true,
            data,
            message: 'Fetched anime details'
        };
        return res.json(response);
    }
    catch (error) {
        console.error('Error fetching anime details:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch anime details',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/movies', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const query = req.query.q || '';
        const data = await (0, scraper_1.fetchMoviesList)(page, query);
        const response = {
            success: true,
            data,
            message: `Fetched ${data.items.length} movies for page ${page}`
        };
        return res.json(response);
    }
    catch (error) {
        console.error('Error fetching movies:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch movies',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/cartoons', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const query = req.query.q || '';
        const data = await (0, scraper_1.fetchCartoonList)(page, query);
        const response = {
            success: true,
            data,
            message: `Fetched ${data.items.length} cartoons for page ${page}`
        };
        return res.json(response);
    }
    catch (error) {
        console.error('Error fetching cartoons:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch cartoons',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/ongoing', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const query = req.query.q || '';
        const data = await (0, scraper_1.fetchOngoingSeries)(page, query);
        const response = {
            success: true,
            data,
            message: `Fetched ${data.items.length} ongoing series for page ${page}`
        };
        return res.json(response);
    }
    catch (error) {
        console.error('Error fetching ongoing series:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch ongoing series',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/upcoming', async (req, res) => {
    try {
        const data = await (0, scraper_1.fetchUpcomingEpisodes)();
        const response = {
            success: true,
            data,
            message: `Fetched ${data.episodes.length} upcoming episodes`
        };
        return res.json(response);
    }
    catch (error) {
        console.error('Error fetching upcoming episodes:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch upcoming episodes',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=anime.js.map