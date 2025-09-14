export default async function handler(req, res) {
  try {
    const { query } = req.query;
    const API_KEY = "a6042a94d5273c9abd084294d505c7b0";
    
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
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
    
    const url = `https://api.themoviedb.org/3/search/tv?api_key=${API_KEY}&query=${encodeURIComponent(query)}&with_genres=16`;
    
    const response = await fetchWithBypass(url);
    const data = await response.json();
    
    res.status(200).json(data);
  } catch (error) {
    console.error('Error searching anime:', error);
    res.status(500).json({ error: 'Failed to search anime' });
  }
}