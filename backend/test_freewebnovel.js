const axios = require('axios');
const cheerio = require('cheerio');

const test = async () => {
  try {
    const novelTitle = "Every Time The Villainess Opens Her Mouth Disaster Follows";
    console.log(`Searching Freewebnovel for: ${novelTitle}`);
    
    // We can do a POST search or a GET search on freewebnovel.com
    const url = `https://freewebnovel.com/search/?searchkey=${encodeURIComponent(novelTitle)}`;
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 10000
    });
    
    console.log("Success! Status code:", response.status);
    const $ = cheerio.load(response.data);
    
    console.log("Title of page:", $('title').text());
    
    // Find list of search results
    // Let's print out the images or items in `.li-row` or similar elements
    $('img').each((i, el) => {
      console.log(`Image ${i + 1}: src=${$(el).attr('src')}, alt=${$(el).attr('alt')}`);
    });
  } catch (err) {
    console.error("Error fetching Freewebnovel:", err.message);
  }
};

test();
