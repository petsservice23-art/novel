const cheerio = require('cheerio');
const fs = require('fs');

const html = fs.readFileSync('C:\\Users\\admin\\.gemini\\antigravity\\brain\\5487a710-4833-48dc-8f7a-2cfc6fd8d96d\\scratch\\ownverso_page.html', 'utf8');
const $ = cheerio.load(html);

console.log("Total templates:", $('template').length);
$('template').each((i, el) => {
  const content = $(el).html();
  console.log(`Template ${i+1} html length:`, content ? content.length : 0);
  if (content && content.includes('<p>')) {
    console.log(`Template ${i+1} contains <p> tags!`);
  }
});

console.log("Total p tags in document:", $('p').length);

console.log("All script tags count:", $('script').length);
$('script').each((i, el) => {
  const content = $(el).html() || '';
  if (content.includes('self.__next_f')) {
    console.log(`Script ${i+1} has self.__next_f and length: ${content.length}`);
  }
});
