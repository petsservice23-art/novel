const axios = require('axios');
const cheerio = require('cheerio');

async function test() {
  try {
    const url = 'https://freewebnovel.com/novel/under-the-oak-tree/chapter-1';
    console.log("Fetching url:", url);
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const $ = cheerio.load(data);
    
    console.log("Checking classes and element selectors...");
    
    // Check .txt selector (frequently used on freewebnovel.com)
    const txtContent = $('.txt').text().trim();
    console.log(".txt content length:", txtContent.length);
    if (txtContent.length > 0) {
      console.log("Snippet (.txt):", txtContent.slice(0, 300));
    }
    
    // Check .detail-text-content
    const detailContent = $('.detail-text-content').text().trim();
    console.log(".detail-text-content length:", detailContent.length);
    if (detailContent.length > 0) {
      console.log("Snippet (.detail-text-content):", detailContent.slice(0, 300));
    }

    // Check h1 or .title for title
    const title = $('.title h1, h1, .chapter-title').text().trim();
    console.log("Found Title:", title);
    
  } catch (error) {
    console.error("Test failed:", error.message);
  }
}
test();
