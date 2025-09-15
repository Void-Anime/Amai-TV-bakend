# Anime Backend API

A standalone backend API for anime streaming platform built with Express.js and TypeScript. This backend provides scraping functionality for anime content from animesalt.cc.

## Features

- 🎌 **Anime Scraping** - Fetch anime lists, details, episodes, and metadata
- 🎬 **Movie Support** - Dedicated movie listing and details
- 🎨 **Cartoon Support** - Cartoon content filtering and listing
- 🔍 **Search Functionality** - Search across all content types
- 📺 **Episode Players** - Video source extraction for episodes
- 🖼️ **Image Proxy** - CORS-free image serving
- ⚡ **Rate Limiting** - Built-in request rate limiting
- 🛡️ **Security** - Helmet.js security headers
- 📊 **Health Monitoring** - Health check endpoints

## API Endpoints

### Anime Routes (`/api/anime`)
- `GET /list?page=1` - Get paginated anime list
- `GET /details?url=<series_url>&post_id=<id>&season=<n>` - Get anime details with episodes
- `GET /movies?page=1&q=<query>` - Get movies list
- `GET /cartoons?page=1&q=<query>` - Get cartoons list
- `GET /ongoing?page=1&q=<query>` - Get ongoing series
- `GET /upcoming` - Get upcoming episodes

### Search Routes (`/api/search`)
- `GET /?q=<query>&type=<all|movies|cartoons|series>` - Search content
- `GET /suggestions?q=<query>` - Get search suggestions

### Episode Routes (`/api/episode`)
- `GET /players?url=<episode_url>` - Get video sources for episode

### Image Routes (`/api/image`)
- `GET /proxy?src=<image_url>` - Proxy images to avoid CORS
- `GET /info?src=<image_url>` - Get image metadata

### Health Check
- `GET /health` - Server health status

## Installation

1. **Clone and navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Build for production:**
   ```bash
   npm run build
   npm start
   ```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3001 |
| `NODE_ENV` | Environment | development |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:3000 |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | 900000 |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | 100 |

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run tests

## API Response Format

All API responses follow this format:

```json
{
  "success": true|false,
  "data": {}, // Response data
  "error": "Error message", // Only on error
  "message": "Success message" // Optional success message
}
```

## Error Handling

The API includes comprehensive error handling:
- 400 - Bad Request (missing parameters)
- 404 - Not Found (invalid routes)
- 429 - Too Many Requests (rate limit exceeded)
- 500 - Internal Server Error

## Rate Limiting

- 100 requests per 15 minutes per IP
- Configurable via environment variables
- Headers include rate limit information

## CORS Configuration

- Configurable CORS origins
- Credentials support
- Preflight request handling

## Security Features

- Helmet.js security headers
- Request size limits
- Input validation
- Error message sanitization

## Development

The backend is built with:
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **Axios** - HTTP client for scraping
- **Cheerio** - HTML parsing
- **CORS** - Cross-origin resource sharing
- **Helmet** - Security headers
- **Morgan** - Request logging
- **Compression** - Response compression

## Deployment

1. Build the project: `npm run build`
2. Set production environment variables
3. Start the server: `npm start`
4. Use a process manager like PM2 for production

## Monitoring

- Health check endpoint: `GET /health`
- Request logging with Morgan
- Error logging to console
- Uptime tracking

## License

MIT License - See LICENSE file for details
