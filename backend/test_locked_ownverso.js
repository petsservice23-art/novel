const axios = require('axios');

const checkChapter = async (num) => {
  const url = `https://www.ownverso.me/novels/vivians-circumstances/chapter-${num}`;
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 10000
    });
    
    const regex = /self\.__next_f\.push\(\[\d+,\s*"([\s\S]*?)"\]\)/g;
    let match;
    let fullPayload = "";
    while ((match = regex.exec(data)) !== null) {
      fullPayload += match[1];
    }
    let decoded = fullPayload
      .replace(/\\u([0-9a-fA-F]{4})/g, (match, grp) => String.fromCharCode(parseInt(grp, 16)))
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');

    const paras = [];
    const pRegex = /<p>([\s\S]*?)<\/p>/gi;
    let pMatch;
    while ((pMatch = pRegex.exec(decoded)) !== null) {
      paras.push(pMatch[1].trim());
    }
    
    console.log(`Chapter ${num}: ${paras.length > 0 ? 'FREE' : 'LOCKED'} (${paras.length} paragraphs)`);
  } catch (e) {
    console.log(`Chapter ${num}: ERROR (${e.message})`);
  }
};

const run = async () => {
  await checkChapter(20);
  await checkChapter(25);
  await checkChapter(30);
  await checkChapter(40);
  await checkChapter(50);
  await checkChapter(60);
};

run();
