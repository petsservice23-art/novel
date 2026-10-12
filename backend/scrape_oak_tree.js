const mongoose = require('mongoose');
const axios = require('axios');
const cheerio = require('cheerio');
const dotenv = require('dotenv');
const Novel = require('./models/Novel');
const Chapter = require('./models/Chapter');

dotenv.config();

// Helper to delay execution
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function scrapeChapters() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected successfully.");

    // Find the novel "Under the Oak Tree"
    const novel = await Novel.findOne({ title: { $regex: /Under the Oak Tree/i } });
    if (!novel) {
      console.error("Could not find novel 'Under the Oak Tree' in the database. Make sure it is added.");
      process.exit(1);
    }
    console.log(`Found novel: ${novel.title} (ID: ${novel._id})`);

    const totalChapters = 457;
    let successfulCount = await Chapter.countDocuments({ novel_id: novel._id });
    console.log(`Currently have ${successfulCount} chapters in the database.`);

    for (let i = 1; i <= totalChapters; i++) {
      // Check if this chapter already exists in database
      const existing = await Chapter.findOne({ novel_id: novel._id, chapter_number: i });
      if (existing) {
        console.log(`[${i}/${totalChapters}] Chapter ${i} already exists in database. Skipping.`);
        continue;
      }

      const url = `https://freewebnovel.com/novel/under-the-oak-tree/chapter-${i}`;
      console.log(`[${i}/${totalChapters}] Fetching: ${url}`);

      try {
        const { data } = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          },
          timeout: 10000 // 10s timeout
        });

        const $ = cheerio.load(data);
        const txtDiv = $('.txt');

        if (txtDiv.length === 0) {
          console.warn(`Warning: Could not find content selector '.txt' for Chapter ${i}. Skipping.`);
          continue;
        }

        // Extract paragraphs
        let paragraphs = [];
        const pElements = txtDiv.find('p');
        if (pElements.length > 0) {
          pElements.each((index, el) => {
            const txt = $(el).text().trim();
            if (txt) paragraphs.push(txt);
          });
        } else {
          // If no p tags, split raw text by newline
          const rawText = txtDiv.text();
          paragraphs = rawText
            .split('\n')
            .map(line => line.trim())
            .filter(Boolean);
        }

        // Clean up paragraphs (remove ads and buttons)
        paragraphs = paragraphs.filter(p => {
          const lower = p.toLowerCase();
          return (
            !lower.includes('prev chapter') &&
            !lower.includes('next chapter') &&
            !lower.includes('freewebnovel.com') &&
            !lower.includes('add to library') &&
            !lower.includes('arrow keys') &&
            !lower.includes('comments') &&
            !lower.includes('translator') &&
            !lower.includes('editor') &&
            !lower.includes('webnovel') &&
            p.length > 3
          );
        });

        // Separate the title if first line is "Chapter X"
        let chapterTitle = `Chapter ${i}`;
        if (paragraphs.length > 0 && (paragraphs[0].toLowerCase().startsWith('chapter') || paragraphs[0].toLowerCase().startsWith('epilogue'))) {
          chapterTitle = paragraphs[0];
          paragraphs.shift(); // Remove the title line from paragraph body
        }

        // Double check title fallback
        if (!chapterTitle || chapterTitle.trim() === '') {
          chapterTitle = `Chapter ${i}`;
        }

        // Tier logic
        let isLocked = i > 100; // First 100 free
        let price = isLocked ? 10 : 0;

        // Save to Database
        const chapter = new Chapter({
          novel_id: novel._id,
          chapter_number: i,
          title: chapterTitle,
          content: paragraphs,
          is_locked: isLocked,
          price: price
        });

        await chapter.save();
        successfulCount++;
        console.log(`Successfully saved: "${chapterTitle}" (${paragraphs.length} paragraphs)`);

        // Wait 250ms to be polite to the website
        await delay(250);

      } catch (err) {
        console.error(`Error fetching/parsing Chapter ${i}:`, err.message);
        // Retrying once after a longer wait
        console.log(`Retrying Chapter ${i} in 2 seconds...`);
        await delay(2000);
        try {
          const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 15000
          });
          const $ = cheerio.load(data);
          let rawText = $('.txt').text();
          let paragraphs = rawText.split('\n').map(l => l.trim()).filter(Boolean);
          paragraphs = paragraphs.filter(p => !p.toLowerCase().includes('freewebnovel'));
          
          let chapterTitle = `Chapter ${i}`;
          if (paragraphs.length > 0 && paragraphs[0].toLowerCase().startsWith('chapter')) {
            chapterTitle = paragraphs[0];
            paragraphs.shift();
          }

          const chapter = new Chapter({
            novel_id: novel._id,
            chapter_number: i,
            title: chapterTitle,
            content: paragraphs,
            is_locked: i > 100,
            price: i > 100 ? 10 : 0
          });
          await chapter.save();
          successfulCount++;
          console.log(`Successfully saved (on retry): "${chapterTitle}"`);
        } catch (retryErr) {
          console.error(`Failed retry for Chapter ${i}:`, retryErr.message);
        }
      }
    }

    // Update the novel's total chapters in database
    novel.total_chapters = await Chapter.countDocuments({ novel_id: novel._id });
    await novel.save();
    console.log(`\nImport Complete! Successfully verified/imported ${novel.total_chapters} chapters for "Under the Oak Tree".`);
    process.exit(0);

  } catch (error) {
    console.error("General Scraper Error:", error);
    process.exit(1);
  }
}

scrapeChapters();
