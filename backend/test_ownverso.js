const axios = require('axios');
const cheerio = require('cheerio');

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
    
    console.log("Title tag:", $('title').text());
    console.log("h1 tags:", $('h1').map((i, el) => $(el).text()).get());
    console.log("h2 tags:", $('h2').map((i, el) => $(el).text()).get());
    
    // Check if there is some common class/id like content, chapter-inner, etc.
    let contentDiv = null;
    let maxParagraphs = 0;
    $('div').each((i, el) => {
      const pCount = $(el).find('p').length;
      if (pCount > maxParagraphs) {
        maxParagraphs = pCount;
        contentDiv = el;
      }
    });
    
    if (contentDiv) {
      console.log(`Found div with class "${$(contentDiv).attr('class') || ''}" containing ${maxParagraphs} paragraphs.`);
      const paras = $(contentDiv).find('p').map((i, el) => $(el).text().trim()).get();
      console.log("First 3 paragraphs:");
      console.log(paras.slice(0, 3));
    } else {
      console.log("No div containing paragraphs found.");
    }
  } catch (e) {
    console.error("Error:", e.message);
  }
};

testFetch();
