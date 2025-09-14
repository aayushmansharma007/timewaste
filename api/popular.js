export default async function handler(req, res) {
  try {
    const API_KEY = "a6042a94d5273c9abd084294d505c7b0";
    const BASE_URL = "https://api.themoviedb.org/3";
    
    // Enhanced bypass methods for India
    const USER_AGENTS = [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    ];
    
    const fetchWithBypass = async (url) => {
      const headers = {
        'User-Agent': USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
        'Accept': 'application/json',
        'X-Forwarded-For': '8.8.8.8',
        'CF-IPCountry': 'US'
      };
      
      return fetch(url, { headers });
    };
    
    const urls = [
      `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_genres=16&sort_by=popularity.desc&vote_average.gte=7`,
      `${BASE_URL}/search/tv?api_key=${API_KEY}&query=popular anime&with_genres=16`,
      `${BASE_URL}/search/tv?api_key=${API_KEY}&query=best anime&with_genres=16`
    ];
    
    const responses = await Promise.allSettled(
      urls.map(url => fetchWithBypass(url))
    );
    
    const allResults = [];
    for (const response of responses) {
      if (response.status === 'fulfilled' && response.value.ok) {
        const data = await response.value.json();
        if (data.results) {
          allResults.push(...data.results);
        }
      }
    }
    
    res.status(200).json({ results: allResults });
  } catch (error) {
    console.error('Error fetching popular anime:', error);
    res.status(500).json({ error: 'Failed to fetch popular anime' });
  }
}