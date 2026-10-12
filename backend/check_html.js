const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const url = 'https://www.ownverso.me/novels/vivians-circumstances/chapter-1';

const testFetch = async () => {
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 15000
    });
    console.log("Status: Success");
    const $ = cheerio.load(data);
    
    // Save to test file to inspect
    fs.writeFileSync('C:\\Users\\admin\\.gemini\\antigravity\\brain\\5487a710-4833-48dc-8f7a-2cfc6fd8d96d\\scratch\\ownverso_page.html', data);
    console.log("Saved page HTML to ownverso_page.html");
    
    // Let's print tag names under body
    const bodyChildren = $('body').children().map((i, el) => el.tagName).get();
    console.log("Body immediate children tags:", bodyChildren);
    
    // Let's print some text length of the body
    console.log("Body text length:", $('body').text().length);
    console.log("Body text snippet:", $('body').text().slice(0, 1000).replace(/\s+/g, ' '));
  } catch (e) {
    console.error("Error:", e.message);
  }
};

testFetch();
