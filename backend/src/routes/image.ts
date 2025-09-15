import express from 'express';
import axios from 'axios';
import { ApiResponse } from '../types';

const router = express.Router();

// GET /api/image/proxy - Proxy images to avoid CORS issues
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
    
    // Validate URL
    let imageUrl: string;
    try {
      imageUrl = new URL(src as string).toString();
    } catch {
      return res.status(400).json({
        success: false,
        error: 'Invalid image URL'
      });
    }
    
    // Fetch image
    const response = await axios.get(imageUrl, {
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://animesalt.cc'
      },
      timeout: 10000,
    });
    
    // Set appropriate headers
    res.set({
      'Content-Type': response.headers['content-type'] || 'image/jpeg',
      'Content-Length': response.headers['content-length'],
      'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      'Access-Control-Allow-Origin': '*',
    });
    
    // Pipe image data to response
    response.data.pipe(res);
    
  } catch (error) {
    console.error('Error proxying image:', error);
    
    // Return a placeholder image or error response
    res.status(500).json({
      success: false,
      error: 'Failed to proxy image',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/image/info - Get image metadata
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
    
    // Validate URL
    let imageUrl: string;
    try {
      imageUrl = new URL(src as string).toString();
    } catch {
      return res.status(400).json({
        success: false,
        error: 'Invalid image URL'
      });
    }
    
    // Fetch image headers only
    const response = await axios.head(imageUrl, {
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
    
    const response_data: ApiResponse = {
      success: true,
      data,
      message: 'Image information retrieved successfully'
    };
    
    res.json(response_data);
    
  } catch (error) {
    console.error('Error getting image info:', error);
    
    const response_data: ApiResponse = {
      success: false,
      error: 'Failed to get image information',
      message: error instanceof Error ? error.message : 'Unknown error',
      data: {
        url: src as string,
        available: false
      }
    };
    
    res.status(500).json(response_data);
  }
});

export default router;
