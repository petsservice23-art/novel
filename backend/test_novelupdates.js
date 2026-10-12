const axios = require('axios');
const cheerio = require('cheerio');

const test = async () => {
  try {
    const novelTitle = "Every Time The Villainess Opens Her Mouth Disaster Follows";
    console.log(`Searching for: ${novelTitle}`);
    
    const searchUrl = `https://www.novelupdates.com/?s=${encodeURIComponent(novelTitle)}&post_type=series_post`;
    
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.novelupdates.com/'
      },
      timeout: 10000
    });
    
    console.log("Success! Status code:", response.status);
    const $ = cheerio.load(response.data);
    
    console.log("Title of page:", $('title').text());
    
    const links = $('.search_title a');
    console.log("Found search results:", links.length);
    links.each((i, el) => {
      console.log(`Result ${i + 1}: ${$(el).text()} - ${$(el).attr('href')}`);
    });
    
    if (links.length > 0) {
      const firstLink = $(links[0]).attr('href');
      console.log(`Fetching series page: ${firstLink}`);
      
      const seriesResponse = await axios.get(firstLink, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': searchUrl
        }
      });
      
      const $series = cheerio.load(seriesResponse.data);
      const imgUrl = $series('.seriesimg img').attr('src');
      console.log("Cover image URL found:", imgUrl);
    } else {
      const imgUrl = $('.seriesimg img').attr('src');
      if (imgUrl) {
        console.log("Redirected directly! Cover image URL found:", imgUrl);
      } else {
        console.log("No cover image found directly on search page.");
      }
    }
  } catch (err) {
    console.error("Error fetching NovelUpdates:", err.message);
    if (err.response) {
      console.log("Status:", err.response.status);
      console.log("Data snippet:", err.response.data.substring(0, 500));
    }
  }
};

test();
