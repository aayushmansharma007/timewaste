// Vercel API routes for TMDB proxy - bypasses geo-restrictions
const BASE_URL = "/api";

// Cache for API responses
const cache = new Map();
const CACHE_DURATION = 300000; // 5 minutes

const rateLimitedFetch = async (url, cacheKey) => {
  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    cache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  } catch (error) {
    console.error('Error fetching from Vercel API:', error);
    throw error;
  }
};

// Filter out non-anime content
const filterAnimeContent = (shows) => {
  const animeKeywords = [
    'anime', 'manga', 'japanese', 'japan', 'otaku', 'shounen', 'shoujo', 'seinen', 'josei',
    'mecha', 'isekai', 'slice of life', 'magical girl', 'supernatural', 'fantasy', 'adventure',
    'demon', 'dragon', 'ninja', 'samurai', 'shinobi', 'hero', 'villain', 'magic', 'sword',
    'monster', 'ghost', 'spirit', 'angel', 'devil', 'school', 'high school', 'middle school',
    'club', 'sport', 'music', 'idol', 'cooking', 'food', 'romance', 'love', 'friendship',
    'battle', 'war', 'fight', 'power', 'energy', 'transformation', 'awakening', 'evolution',
    'destiny', 'prophecy', 'chosen one', 'legend', 'myth', 'ancient', 'future', 'space',
    'planet', 'world', 'dimension', 'portal', 'gate', 'summon', 'contract', 'pact'
  ];
  
  const nonAnimeKeywords = [
    'wednesday', 'addams', 'alien', 'terminal list', 'peacemaker', 'summer turned pretty',
    'riverdale', 'stranger things', 'outer banks', 'euphoria', 'bridgerton', 'witcher',
    'game of thrones', 'breaking bad', 'better call saul', 'walking dead', 'rick and morty',
    'office', 'workplace', 'reality tv', 'talk show', 'news', 'documentary', 'crime',
    'police', 'detective', 'lawyer', 'doctor', 'hospital', 'medical', 'legal', 'court',
    'sitcom', 'comedy', 'drama', 'thriller', 'horror', 'romance', 'western', 'historical',
    'biography', 'war', 'sport', 'music', 'variety', 'game show', 'reality', 'documentary',
    'summer', 'turned', 'pretty', 'dexter', 'resurrection', 'runarounds', 'marvel', 'zombies',
    'live action', 'live-action', 'american', 'british', 'european', 'hollywood', 'netflix',
    'hbo', 'amazon', 'disney', 'warner', 'paramount', 'universal', 'sony', 'fox'
  ];

  return shows.filter(show => {
    const title = (show.name || '').toLowerCase();
    const overview = (show.overview || '').toLowerCase();
    const originalName = (show.original_name || '').toLowerCase();
    
    // Check if it contains non-anime keywords (exclude these)
    const hasNonAnimeKeywords = nonAnimeKeywords.some(keyword => 
      title.includes(keyword) || overview.includes(keyword) || originalName.includes(keyword)
    );
    
    if (hasNonAnimeKeywords) return false;
    
    // Check if it has anime-like characteristics
    const hasAnimeKeywords = animeKeywords.some(keyword => 
      title.includes(keyword) || overview.includes(keyword) || originalName.includes(keyword)
    );
    
    // Check if it's Japanese animation or has anime-like characteristics
    const isJapaneseAnimation = show.origin_country && show.origin_country.includes('JP');
    const hasAnimationGenre = show.genre_ids && show.genre_ids.includes(16);
    
    if (isJapaneseAnimation) return true;
    
    // For non-Japanese content, be strict
    if (hasAnimationGenre && hasAnimeKeywords) {
      const hasAnimeStyle = /[a-zA-Z]+:\s*[a-zA-Z]+/.test(title) || 
                            /[a-zA-Z]+\s+[a-zA-Z]+/.test(title) ||
                            overview.includes('episode') || overview.includes('adventure');
      return hasAnimeStyle;
    }
    
    return false;
  });
};

// Transform TMDB TV show to anime-like format
const transformTMDBToAnime = (show) => ({
  id: show.id,
  title: {
    english: show.name,
    romaji: show.original_name,
    native: show.original_name
  },
  coverImage: {
    extraLarge: show.poster_path ? `https://image.tmdb.org/t/p/w500${show.poster_path}` : null,
    large: show.poster_path ? `https://image.tmdb.org/t/p/w342${show.poster_path}` : null,
    medium: show.poster_path ? `https://image.tmdb.org/t/p/w185${show.poster_path}` : null
  },
  bannerImage: show.backdrop_path ? `https://image.tmdb.org/t/p/w1280${show.backdrop_path}` : null,
  description: show.overview,
  episodes: show.number_of_episodes || null,
  status: show.status === 'Ended' ? 'FINISHED' : 'RELEASING',
  genres: show.genre_ids?.map(id => getGenreName(id)) || show.genres?.map(g => g.name) || [],
  averageScore: show.vote_average ? Math.round(show.vote_average * 10) : null,
  popularity: show.popularity,
  startDate: {
    year: show.first_air_date ? new Date(show.first_air_date).getFullYear() : null
  }
});

// Genre mapping for TMDB
const genreMap = {
  16: 'Animation',
  10759: 'Action & Adventure',
  35: 'Comedy',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  9648: 'Mystery',
  10765: 'Sci-Fi & Fantasy',
  10762: 'Kids',
  10764: 'Reality',
  10767: 'Talk'
};

const getGenreName = (id) => genreMap[id] || 'Unknown';

// Fetch detailed anime information including episode count
const fetchAnimeDetails = async (animeId) => {
  try {
    const data = await rateLimitedFetch(`${BASE_URL}/details?id=${animeId}`, `details_${animeId}`);
    return data;
  } catch (error) {
    console.error(`Error fetching details for anime ${animeId}:`, error);
    return null;
  }
};

// Enhanced transform function that includes detailed episode information
const transformTMDBToAnimeWithDetails = async (show) => {
  const baseAnime = transformTMDBToAnime(show);
  
  // If we already have episode count, return as is
  if (show.number_of_episodes) {
    return baseAnime;
  }
  
  // Fetch detailed information to get episode count
  try {
    const details = await fetchAnimeDetails(show.id);
    if (details && details.number_of_episodes) {
      baseAnime.episodes = details.number_of_episodes;
    }
  } catch (error) {
    console.error(`Failed to fetch episode details for ${show.name}:`, error);
  }
  
  return baseAnime;
};

export const fetchTrendingAnime = async () => {
  try {
    const data = await rateLimitedFetch(`${BASE_URL}/trending`, 'trending_anime');
    const filteredShows = filterAnimeContent(data.results || []);
    
    const animeWithDetails = await Promise.allSettled(
      filteredShows.map(show => transformTMDBToAnimeWithDetails(show))
    );
    
    return animeWithDetails
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value);
  } catch (error) {
    console.error('Error fetching trending anime:', error);
    return [];
  }
};

export const fetchPopularAnime = async () => {
  try {
    const data = await rateLimitedFetch(`${BASE_URL}/popular`, 'popular_anime');
    const filteredShows = filterAnimeContent(data.results || []);
    
    const animeWithDetails = await Promise.allSettled(
      filteredShows.map(show => transformTMDBToAnimeWithDetails(show))
    );
    
    return animeWithDetails
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value);
  } catch (error) {
    console.error('Error fetching popular anime:', error);
    return [];
  }
};

export const fetchActionAnime = async () => {
  try {
    const data = await rateLimitedFetch(`${BASE_URL}/action`, 'action_anime');
    const filteredShows = filterAnimeContent(data.results || []);
    
    const animeWithDetails = await Promise.allSettled(
      filteredShows.map(show => transformTMDBToAnimeWithDetails(show))
    );
    
    return animeWithDetails
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value);
  } catch (error) {
    console.error('Error fetching action anime:', error);
    return [];
  }
};

export const fetchLatestAnime = async () => {
  try {
    const data = await rateLimitedFetch(`${BASE_URL}/latest`, 'latest_anime');
    const filteredShows = filterAnimeContent(data.results || []);
    
    const animeWithDetails = await Promise.allSettled(
      filteredShows.map(show => transformTMDBToAnimeWithDetails(show))
    );
    
    return animeWithDetails
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value);
  } catch (error) {
    console.error('Error fetching latest anime:', error);
    return [];
  }
};

export const fetchUpcomingAnime = async () => {
  try {
    const data = await rateLimitedFetch(`${BASE_URL}/upcoming`, 'upcoming_anime');
    const filteredShows = filterAnimeContent(data.results || []);
    
    const animeWithDetails = await Promise.allSettled(
      filteredShows.map(show => transformTMDBToAnimeWithDetails(show))
    );
    
    return animeWithDetails
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value);
  } catch (error) {
    console.error('Error fetching upcoming anime:', error);
    return [];
  }
};

export const searchAnime = async (query) => {
  try {
    const data = await rateLimitedFetch(`${BASE_URL}/search?query=${encodeURIComponent(query)}`, `search_${query}`);
    const filteredShows = filterAnimeContent(data.results || []);
    
    const animeWithDetails = await Promise.allSettled(
      filteredShows.map(show => transformTMDBToAnimeWithDetails(show))
    );
    
    return animeWithDetails
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value);
  } catch (error) {
    console.error('Error searching anime:', error);
    return [];
  }
};

// Fetch episodes for a specific anime using Vercel API route
export const fetchEpisodes = async (animeId) => {
  try {
    const episodes = await rateLimitedFetch(`${BASE_URL}/episodes?id=${animeId}`, `episodes_${animeId}`);
    return episodes;
  } catch (error) {
    console.error('Error fetching episodes:', error);
    return [];
  }
};

// Get video URLs for different servers
export const getVideoUrl = (animeId, season, episode, serverType = 'sub') => {
  switch (serverType) {
    case 'sub1':
      return `https://api.cinepapa.com/TA/?id=${animeId}&season=${season}&episode=${episode}`;
    case 'hindi':
    case 'multi':
      return `https://api.flixindia.xyz/anime/${animeId}/${season}/${episode}`;
    case 'sub':
    case 'dub':
    default:
      return `https://api.cinepapa.com/TA/?id=${animeId}&season=${season}&episode=${episode}`;
  }
};

// Get fallback video URL when primary fails
export const getFallbackVideoUrl = (animeId, season, episode, serverType = 'sub') => {
  switch (serverType) {
    case 'sub1':
      return `https://api.cinepapa.com/TA/?id=${animeId}&season=${season}&episode=${episode}&fallback=true`;
    case 'hindi':
    case 'multi':
      return `https://api.flixindia.xyz/anime/${animeId}/${season}/${episode}?fallback=true`;
    case 'sub':
    case 'dub':
    default:
      return `https://api.cinepapa.com/TA/?id=${animeId}&season=${season}&episode=${episode}&fallback=true`;
  }
};

// Manual fallback with popular anime titles if API fails completely
export const getManualFallbackAnime = () => {
  return [
    {
      id: 'fallback_1',
      title: {
        english: 'Dragon Ball Z',
        romaji: 'Dragon Ball Z',
        native: 'ドラゴンボールZ'
      },
      coverImage: {
        extraLarge: 'https://image.tmdb.org/t/p/w500/placeholder.jpg',
        large: 'https://image.tmdb.org/t/p/w342/placeholder.jpg',
        medium: 'https://image.tmdb.org/t/p/w185/placeholder.jpg'
      },
      bannerImage: null,
      description: 'The adventures of Goku and his friends as they protect Earth from various threats.',
      episodes: 291,
      status: 'FINISHED',
      genres: ['Action', 'Adventure', 'Fantasy'],
      averageScore: 85,
      popularity: 100,
      startDate: { year: 1989 }
    },
    {
      id: 'fallback_2',
      title: {
        english: 'Naruto',
        romaji: 'Naruto',
        native: 'ナルト'
      },
      coverImage: {
        extraLarge: 'https://image.tmdb.org/t/p/w500/placeholder.jpg',
        large: 'https://image.tmdb.org/t/p/w342/placeholder.jpg',
        medium: 'https://image.tmdb.org/t/p/w185/placeholder.jpg'
      },
      bannerImage: null,
      description: 'A young ninja seeks to become the strongest ninja in his village.',
      episodes: 220,
      status: 'FINISHED',
      genres: ['Action', 'Adventure', 'Fantasy'],
      averageScore: 82,
      popularity: 95,
      startDate: { year: 2002 }
    },
    {
      id: 'fallback_3',
      title: {
        english: 'One Piece',
        romaji: 'One Piece',
        native: 'ワンピース'
      },
      coverImage: {
        extraLarge: 'https://image.tmdb.org/t/p/w500/placeholder.jpg',
        large: 'https://image.tmdb.org/t/p/w342/placeholder.jpg',
        medium: 'https://image.tmdb.org/t/p/w185/placeholder.jpg'
      },
      bannerImage: null,
      description: 'A pirate crew searches for the ultimate treasure in a world of adventure.',
      episodes: 1000,
      status: 'RELEASING',
      genres: ['Action', 'Adventure', 'Comedy'],
      averageScore: 88,
      popularity: 98,
      startDate: { year: 1999 }
    }
  ];
};

// Fallback function to ensure we have anime content
export const fetchFallbackAnime = async () => {
  try {
    const data = await rateLimitedFetch(`${BASE_URL}/popular`, 'fallback_anime');
    const filteredShows = filterAnimeContent(data.results || []);
    
    if (filteredShows.length < 5) {
      return getManualFallbackAnime();
    }
    
    return filteredShows.map(transformTMDBToAnime);
  } catch (error) {
    console.error('Error fetching fallback anime:', error);
    return getManualFallbackAnime();
  }
};