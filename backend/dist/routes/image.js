"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const router = express_1.default.Router();
router.get('/proxy', async (req, res) => {
    try {
        const { src } = req.query;
        if (!src) {
            return res.status(400).json({
                success: false,
                error: 'Missing required parameter: src (image URL)'
            });
        }
        console.log(`Proxying image: ${src}`);
        let imageUrl;
        try {
            imageUrl = new URL(src).toString();
        }
        catch {
            return res.status(400).json({
                success: false,
                error: 'Invalid image URL'
            });
        }
        const response = await axios_1.default.get(imageUrl, {
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0',
                'Referer': 'https://animesalt.cc'
            },
            timeout: 10000,
        });
        res.set({
            'Content-Type': response.headers['content-type'] || 'image/jpeg',
            'Content-Length': response.headers['content-length'],
            'Cache-Control': 'public, max-age=86400',
            'Access-Control-Allow-Origin': '*',
        });
        return response.data.pipe(res);
    }
    catch (error) {
        console.error('Error proxying image:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to proxy image',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/info', async (req, res) => {
    try {
        const { src } = req.query;
        if (!src) {
            return res.status(400).json({
                success: false,
                error: 'Missing required parameter: src (image URL)'
            });
        }
        console.log(`Getting image info: ${src}`);
        let imageUrl;
        try {
            imageUrl = new URL(src).toString();
        }
        catch {
            return res.status(400).json({
                success: false,
                error: 'Invalid image URL'
            });
        }
        const response = await axios_1.default.head(imageUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0',
                'Referer': 'https://animesalt.cc'
            },
            timeout: 5000,
        });
        const data = {
            url: imageUrl,
            contentType: response.headers['content-type'],
            contentLength: response.headers['content-length'],
            lastModified: response.headers['last-modified'],
            etag: response.headers['etag'],
            available: true
        };
        const response_data = {
            success: true,
            data,
            message: 'Image information retrieved successfully'
        };
        return res.json(response_data);
    }
    catch (error) {
        console.error('Error getting image info:', error);
        const response_data = {
            success: false,
            error: 'Failed to get image information',
            message: error instanceof Error ? error.message : 'Unknown error',
            data: {
                url: req.query.src || '',
                available: false
            }
        };
        return res.status(500).json(response_data);
    }
});
exports.default = router;
//# sourceMappingURL=image.js.map