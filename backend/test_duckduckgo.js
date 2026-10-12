const axios = require('axios');
const cheerio = require('cheerio');

const test = async () => {
  try {
    const query = 'site:novelupdates.com "Every Time The Villainess Opens Her Mouth Disaster Follows"';
    console.log(`Searching DDG for: ${query}`);
    
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    console.log("DDG Success! status:", response.status);
    const $ = cheerio.load(response.data);
    
    const results = $('.result__url');
    console.log("Results found:", results.length);
    results.each((i, el) => {
      console.log(`URL ${i + 1}:`, $(el).text().trim());
    });
  } catch (err) {
    console.error("DDG Error:", err.message);
  }
};

test();
