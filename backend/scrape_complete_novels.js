const mongoose = require('mongoose');
const axios = require('axios');
const cheerio = require('cheerio');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => { console.error('MongoDB connection error:', err); process.exit(1); });

const chapterSchema = new mongoose.Schema({}, { strict: false });
const Chapter = mongoose.models.Chapter || mongoose.model('Chapter', chapterSchema);
const Novel = mongoose.models.Novel || mongoose.model('Novel', new mongoose.Schema({}, { strict: false }));

// These are the predictable "Complete" novels from your list
const TARGETS = [
  {
    title: "I Pray That You Forget Me",
    generateUrl: (num) => `https://citrusaurora.com/series/please-forget-me/chapter-${num}/`,
    start: 1, end: 316
  },
  {
    title: "I Faked a Pregnancy, but My Husband Returned",
    generateUrl: (num) => `https://eternalune.com/novel/i-faked-a-pregnancy-but-my-husband-returned/chapter-${num}/`,
    start: 1, end: 160
  },
  {
    title: "My Husband Caught Me Having an Affair",
    generateUrl: (num) => `https://eternalune.com/novel/my-husband-caught-me-having-an-affair/chapter-${num}/`,
    start: 1, end: 169
  },
  {
    title: "I Became the Wife of the Beastly Grand Duke",
    generateUrl: (num) => `https://transcendentaltls.com/novelDetails/chapter?novelTag=BWBGD&chapterNumber=${num}`,
    start: 1, end: 117
  },
  {
    title: "I Became a Barbarian’s Bride",
    generateUrl: (num) => `https://tangerinearchive.com/series/i-became-a-barbarians-bride/chapter-${num}/`,
    start: 1, end: 184
  },
  {
    title: "How to Protect My Male Protagonist",
    generateUrl: (num) => `https://transcendentaltls.com/novelDetails/chapter?novelTag=HTPMP&chapterNumber=${num}`,
    start: 1, end: 205
  },
  {
    title: "Guidelines for the Perfect Goodbye",
    generateUrl: (num) => `https://tangerinearchive.com/series/guidelines-for-the-perfect-goodbye/chapter-${num}/`,
    start: 1, end: 280
  },
  {
    title: "A Secretly Capable Child Is Seeking For Her Dad",
    generateUrl: (num) => `https://lunoxscans.com/series/a-secretly-capable-child-is-seeking-for-her-dad/chapter-${num}/`,
    start: 1, end: 325
  },
  {
    title: "I'm Trying to End This Possession",
    generateUrl: (num) => `https://readhive.org/series/111674/${num}/`,
    start: 1, end: 245
  }
];

// Helper: Sleep to avoid rate limits
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function scrapeContent(url) {
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
      },
      timeout: 10000
    });
    
    const $ = cheerio.load(data);
    
    // Remove typical junk
    $('script, style, iframe, nav, header, footer, .ad, .comments').remove();

    // Universal Heuristic: Find the container with the most <p> tags
    let maxP = 0;
    let bestContainer = null;
    $('div, article, section').each((i, el) => {
      const pCount = $(el).children('p').length;
      if (pCount > maxP) {
        maxP = pCount;
        bestContainer = $(el);
      }
    });

    if (bestContainer) {
      // Just extract the raw HTML of the paragraphs to save DB space
      let cleanedHtml = '';
      bestContainer.children('p').each((i, el) => {
        const text = $(el).text().trim();
        if(text && !text.includes('lunoxscans') && !text.includes('citrusaurora') && text.length > 5) {
          cleanedHtml += `<p>${text}</p>`;
        }
      });
      return cleanedHtml;
    }
    
    return null;
  } catch (error) {
    console.error(`  [!] Failed to scrape ${url}: ${error.message}`);
    return null;
  }
}

async function run() {
  console.log('Starting Gray-Market Universal Scraper...');
  
  for (const target of TARGETS) {
    console.log(`\n========================================`);
    console.log(`Processing Novel: ${target.title}`);
    
    const novel = await Novel.findOne({ title: target.title });
    if (!novel) {
      console.log(`Novel not found in DB. Skipping...`);
      continue;
    }

    console.log(`Found Novel ID: ${novel._id}. Fetching chapters ${target.start} to ${target.end}...`);
    
    let successCount = 0;
    
    for (let i = target.start; i <= target.end; i++) {
      const chapter = await Chapter.findOne({ novel_id: novel._id, chapter_number: i });
      
      // Only overwrite if it's a generated placeholder or completely empty
      if (chapter && chapter.content && !chapter.content.includes('premium chapter is locked') && chapter.content.length > 500) {
        // Looks like it already has real content, skip
        continue;
      }
      
      const url = target.generateUrl(i);
      console.log(`  -> Scraping Ch ${i} from ${url}`);
      
      const content = await scrapeContent(url);
      
      if (content && content.length > 100) {
        if (chapter) {
          chapter.content = content; // Keep its tier (locked) but replace text
          await chapter.save();
        } else {
          // If it doesn't exist in DB at all, create it
          await Chapter.create({
            novel_id: novel._id,
            chapter_number: i,
            title: `Chapter ${i}`,
            content: content,
            tier: i > 50 ? 'coin' : 'free' // Standard logic: lock after ch 50
          });
        }
        successCount++;
        console.log(`  [OK] Saved Ch ${i}`);
      } else {
        console.log(`  [WARN] No readable content found for Ch ${i}`);
      }
      
      // Sleep to prevent getting banned by Cloudflare
      await sleep(2500); 
    }
    
    // Mark the novel as completed in the database
    novel.publishing_status = 'completed';
    await novel.save();
    
    console.log(`Finished ${target.title}. Successfully scraped & saved ${successCount} chapters. Marked as Completed.`);
  }

  console.log('\nAll complete targets finished!');
  process.exit(0);
}

run();
