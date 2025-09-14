export default async function handler(req, res) {
  try {
    const { id } = req.query;
    const API_KEY = "a6042a94d5273c9abd084294d505c7b0";
    
    if (!id) {
      return res.status(400).json({ error: 'ID parameter is required' });
    }
    
    const fetchWithBypass = async (url) => {
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'X-Forwarded-For': '8.8.8.8',
        'CF-IPCountry': 'US'
      };
      
      return fetch(url, { headers });
    };
    
    // Get TV show details first
    const showUrl = `https://api.themoviedb.org/3/tv/${id}?api_key=${API_KEY}`;
    const showResponse = await fetchWithBypass(showUrl);
    const showData = await showResponse.json();
    
    const episodeCount = showData.number_of_episodes || null;
    const seasons = showData.number_of_seasons || 1;
    
    // Generate episodes based on seasons
    const episodes = [];
    for (let season = 1; season <= seasons; season++) {
      try {
        const seasonUrl = `https://api.themoviedb.org/3/tv/${id}/season/${season}?api_key=${API_KEY}`;
        const seasonResponse = await fetchWithBypass(seasonUrl);
        const seasonData = await seasonResponse.json();
        
        seasonData.episodes?.forEach((episode, index) => {
          const minutes = Math.floor(Math.random() * 5) + 20;
          const seconds = Math.floor(Math.random() * 60);
          const duration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
          
          episodes.push({
            episodeNumber: episodes.length + 1,
            title: episode.name || `Episode ${episodes.length + 1}`,
            thumbnail: episode.still_path ? `https://image.tmdb.org/t/p/w300${episode.still_path}` : showData.backdrop_path ? `https://image.tmdb.org/t/p/w300${showData.backdrop_path}` : null,
            duration: duration,
            views: `${Math.floor(Math.random() * 5) + 1}.${Math.floor(Math.random() * 9)}M views`,
            uploadDate: `${Math.floor(Math.random() * 30) + 1} days ago`,
            season: season,
            episode: episode.episode_number
          });
        });
      } catch (error) {
        console.error(`Error fetching season ${season}:`, error);
      }
    }
    
    // If no episodes found, generate default episodes
    if (episodes.length === 0 && episodeCount) {
      const defaultEpisodes = Array.from({ length: episodeCount }, (_, i) => {
        const minutes = Math.floor(Math.random() * 5) + 20;
        const seconds = Math.floor(Math.random() * 60);
        const duration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        return {
          episodeNumber: i + 1,
          title: `Episode ${i + 1}`,
          thumbnail: showData.backdrop_path ? `https://image.tmdb.org/t/p/w300${showData.backdrop_path}` : null,
          duration: duration,
          views: `${Math.floor(Math.random() * 5) + 1}.${Math.floor(Math.random() * 9)}M views`,
          uploadDate: `${Math.floor(Math.random() * 30) + 1} days ago`,
          season: 1,
          episode: i + 1
        };
      });
      
      res.status(200).json(defaultEpisodes);
    } else {
      res.status(200).json(episodes);
    }
  } catch (error) {
    console.error('Error fetching episodes:', error);
    res.status(500).json({ error: 'Failed to fetch episodes' });
  }
}