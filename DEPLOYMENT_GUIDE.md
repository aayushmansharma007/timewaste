# Miyou Anime Site - Deployment Guide

## Overview
This anime site now uses Vercel's serverless functions as a proxy layer to bypass TMDB restrictions in India. The enhanced API includes better filtering for anime content and multiple bypass methods.

## Features Added
- ✅ Vercel serverless functions for TMDB API proxy
- ✅ Enhanced anime content filtering
- ✅ Multiple bypass methods for India restrictions
- ✅ Episode fetching functionality
- ✅ Video URL generation for different servers
- ✅ Fallback mechanisms for better reliability

## API Endpoints
- `/api/popular` - Popular anime
- `/api/trending` - Trending anime
- `/api/action` - Action anime
- `/api/latest` - Latest anime
- `/api/upcoming` - Upcoming anime
- `/api/search?query=` - Search anime
- `/api/details?id=` - Get anime details
- `/api/episodes?id=` - Get episodes for anime

## Deployment Steps

### 1. Vercel Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### 2. Environment Variables
No additional environment variables needed as API key is included in the code.

### 3. Domain Configuration
After deployment, you can add a custom domain in Vercel dashboard.

## Bypass Methods Implemented

### 1. Header Spoofing
- User-Agent rotation
- IP spoofing with X-Forwarded-For
- Country spoofing with CF-IPCountry

### 2. Enhanced Filtering
- Anime keyword detection
- Non-anime content exclusion
- Japanese animation prioritization
- Genre-based filtering

### 3. Fallback Mechanisms
- Manual anime fallback data
- Multiple API endpoint attempts
- Error handling with graceful degradation

## Testing
1. Deploy to Vercel
2. Test API endpoints: `https://your-domain.vercel.app/api/popular`
3. Check anime filtering quality
4. Verify bypass functionality from India

## Notes
- The site now uses enhanced TMDB API with bypass methods
- Better anime content filtering reduces non-anime results
- Serverless functions provide better reliability
- All API calls go through Vercel proxy to bypass restrictions

## Troubleshooting
If APIs fail:
1. Check Vercel function logs
2. Verify TMDB API key is working
3. Test different bypass methods
4. Use fallback anime data if needed

## Next Steps
1. Deploy to Vercel
2. Test from India to verify bypass works
3. Monitor API performance
4. Add more bypass methods if needed