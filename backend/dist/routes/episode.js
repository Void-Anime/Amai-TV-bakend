"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const scraper_1 = require("../scraper");
const router = express_1.default.Router();
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
        const sources = await (0, scraper_1.fetchEpisodePlayers)(url);
        const data = {
            episodeUrl: url,
            sources,
            totalSources: sources.length
        };
        const response = {
            success: true,
            data,
            message: `Found ${sources.length} video sources for episode`
        };
        return res.json(response);
    }
    catch (error) {
        console.error('Error fetching episode players:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch episode players',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=episode.js.map