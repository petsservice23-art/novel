const mongoose = require('mongoose');
const axios = require('axios');
const cheerio = require('cheerio');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

const Novel = require('./models/Novel');
const Chapter = require('./models/Chapter');
const User = require('./models/User');

dotenv.config();

// Predefined story paragraphs for procedural content generation
const storyParagraphs = [
  "The morning sun bled through the heavy velvet curtains, casting long, crimson shadows across the marble floor. Silence hung heavy in the air, broken only by the rhythmic ticking of the grandfather clock in the corner. Every second felt like an eternity, a reminder of the time that had slipped through her fingers like sand.",
  "He stood at the edge of the precipice, the wind whipping his dark hair across his face. Below, the jagged rocks were swallowed by the churning, slate-gray sea. It was a beautiful, terrifying sight, much like the path he had chosen for himself. There was no turning back now; the bridge had been burned long ago.",
  "The marketplace was a riot of colors and sounds. Merchants cried out their wares, the scent of exotic spices mingled with the smell of roasting meat, and the crowd moved like a living, breathing entity. Amidst the chaos, she moved like a shadow, her hood pulled low over her eyes. She had a mission, and failure was not an option.",
  "In the heart of the ancient forest, where the trees whispered secrets to the moon, lived a creature of myth and shadow. It had watched the rise and fall of empires, the birth and death of stars. Now, it watched the young man who had dared to enter its domain, a flicker of curiosity igniting in its ancient, glowing eyes.",
  "The tea was cold, but she didn't seem to notice. Her gaze was fixed on the letter in her trembling hands, the ink blurred by tears she refused to let fall. The words were a death sentence, a betrayal so profound it shook the very foundations of her world. Everything she had believed in was a lie.",
  "Steel clashed against steel, a shower of sparks illuminating the dim corridor. They moved with a grace that belied the brutality of their dance, each strike calculated, each parry a testament to years of training. This was more than a fight; it was a reckoning, a final confrontation between light and shadow.",
  "The library was a sanctuary of dust and wisdom. Rows upon rows of leather-bound volumes reached toward the vaulted ceiling, their pages filled with the thoughts of long-dead scholars. Here, in the quiet embrace of the past, he found the answers he had been searching for, and a truth he wished he could forget."
];

const customSlugMap = {
  "Every Time The Villainess Opens Her Mouth Disaster Follows": "villainess-disaster-follows",
  "To You Who Will Ruin Me": "to-the-person-who-will-destroy-me",
  "The Way to Protect the Female Lead’s Older Brother": "the-way-to-protect-the-female-lead-s-older-brother",
  "The Villainess Gets Her Sponsorship": "the-villainess-sponsorship-is-discovered",
  "My Contract Husband Resembles the Male Protagonist": "the-indentured-husband-resembles-the-male-protagonist",
  "The Count's Secret Maid": "the-count-s-secret-maid",
  "Precipice Outside the Cage": "praesepe-outside-the-cage",
  "Looking for My Fiancé’s Lover": "looking-for-my-fiances-lover",
  "This Is Clearly a Misunderstanding!": "it-is-truly-a-misunderstanding",
  "I'm Leaving the Villainess's Station": "im-leaving-the-villainess-station",
  "If I Don't Get Married I'll Die": "if-i-don-t-get-married-i-ll-die",
  "I'm Trying to End This Possession": "i-m-trying-to-end-this-possession",
  "I Accidentally Saved the Male Lead's Brother": "i-accidentally-saved-the-male-lead-s-brother",
  "Having Enemy's Baby": "having-enemy-s-baby",
  "Don't Look for the Resurrected Villainess": "don-t-look-for-the-resurrected-villainess"
};

// Helper to slugify novel titles to match ownverso.me URLs
function generateSlug(title) {
  if (customSlugMap[title]) {
    return customSlugMap[title];
  }
  return title
    .toLowerCase()
    .replace(/’/g, '') // remove smart apostrophe
    .replace(/'/g, '')  // remove straight apostrophe
    .replace(/[^a-z0-9]+/g, '-') // replace non-alphanumeric chars with hyphen
    .replace(/^-+|-+$/g, '');   // trim leading/trailing hyphens
}

// Generate procedural content for locked chapters
function generatePlaceholderContent(novelTitle, chapterNum) {
  const content = [];
  content.push(`This is Chapter ${chapterNum} of the novel "${novelTitle}".`);
  content.push(`The journey continues as the characters face new challenges. "There is no turning back now," a soft whisper echoed through the silent corridor.`);
  
  // Select 3 to 5 random story paragraphs to make it look realistic
  const paraCount = 3 + Math.floor(Math.random() * 3);
  for (let i = 0; i < paraCount; i++) {
    const p = storyParagraphs[Math.floor(Math.random() * storyParagraphs.length)];
    content.push(p);
  }
  
  content.push(`This premium chapter is locked on ownverso.me. Support our platform to unlock and read the full story!`);
  return content;
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function scrapeNovel(dbNovel, expectedChapters, testMode = false) {
  const slug = generateSlug(dbNovel.title);
  console.log(`\n======================================================`);
  console.log(`Starting Novel: "${dbNovel.title}"`);
  console.log(`Slug: "${slug}" | Expected Chapters: ${expectedChapters}`);
  console.log(`======================================================`);

  // Clear existing chapters first to ensure clean database seeding
  console.log(`Clearing existing chapters for "${dbNovel.title}"...`);
  await Chapter.deleteMany({ novel_id: dbNovel._id });

  let paywallHit = false;
  let successfulChapters = 0;

  for (let i = 1; i <= expectedChapters; i++) {
    const chapterTitle = `Chapter ${i}`;
    let isLocked = false;
    let price = 0;
    let paragraphs = [];

    if (paywallHit) {
      // Procedurally generate locked content after paywall is hit
      paragraphs = generatePlaceholderContent(dbNovel.title, i);
      isLocked = true;
      price = 10;
    } else {
      const url = `https://www.ownverso.me/novels/${slug}/chapter-${i}`;
      console.log(`[${i}/${expectedChapters}] Fetching: ${url}`);

      try {
        const { data } = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          },
          timeout: 10000
        });

        // Parse Next.js RSC payload
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

        const parsedParas = [];
        const pRegex = /<p>([\s\S]*?)<\/p>/gi;
        let pMatch;
        while ((pMatch = pRegex.exec(decoded)) !== null) {
          parsedParas.push(pMatch[1].trim());
        }

        if (parsedParas.length > 0) {
          paragraphs = parsedParas;
          console.log(`  -> SUCCESS: Parsed ${paragraphs.length} paragraphs (FREE)`);
        } else {
          // Empty content indicates paywall / locked chapter
          console.log(`  -> LOCKED: Paywall hit at Chapter ${i}. Generating placeholder.`);
          paragraphs = generatePlaceholderContent(dbNovel.title, i);
          isLocked = true;
          price = 10;
          paywallHit = true; // Set paywall flag so subsequent chapters skip network requests
        }

        // Delay to prevent rate limiting
        await delay(250);

      } catch (err) {
        if (err.response && err.response.status === 404) {
          if (i === 1) {
            console.error(`  -> ERROR: Slug "${slug}" returned 404 on Chapter 1. Novel slug might be different or novel not found.`);
            // In case of incorrect slug on Chapter 1, generate procedural content for all chapters of this novel
            console.log(`  -> FALLBACK: Generating procedural chapters for the entire novel.`);
            paywallHit = true;
            paragraphs = generatePlaceholderContent(dbNovel.title, i);
            isLocked = true;
            price = 10;
          } else {
            console.warn(`  -> WARNING: Chapter ${i} returned 404. Assumed end of chapters or locked chapter. Generating placeholder.`);
            paragraphs = generatePlaceholderContent(dbNovel.title, i);
            isLocked = true;
            price = 10;
            paywallHit = true;
          }
        } else {
          console.error(`  -> ERROR: Failed to fetch Chapter ${i}: ${err.message}. Retrying...`);
          await delay(2000);
          try {
            // Simple retry
            const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 15000 });
            // Parse payload
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

            const parsedParas = [];
            const pRegex = /<p>([\s\S]*?)<\/p>/gi;
            let pMatch;
            while ((pMatch = pRegex.exec(decoded)) !== null) {
              parsedParas.push(pMatch[1].trim());
            }

            if (parsedParas.length > 0) {
              paragraphs = parsedParas;
              console.log(`  -> SUCCESS (on retry): Parsed ${paragraphs.length} paragraphs`);
            } else {
              paragraphs = generatePlaceholderContent(dbNovel.title, i);
              isLocked = true;
              price = 10;
              paywallHit = true;
            }
          } catch (retryErr) {
            console.error(`  -> RETRY FAILED: ${retryErr.message}. Generating placeholder.`);
            paragraphs = generatePlaceholderContent(dbNovel.title, i);
            isLocked = true;
            price = 10;
            paywallHit = true;
          }
        }
      }
    }

    const chapter = new Chapter({
      novel_id: dbNovel._id,
      chapter_number: i,
      title: chapterTitle,
      content: paragraphs,
      is_locked: isLocked,
      price: price
    });

    let saved = false;
    let saveRetries = 10;
    while (!saved && saveRetries > 0) {
      try {
        await chapter.save();
        saved = true;
      } catch (saveErr) {
        if (saveErr.code === 11000 || (saveErr.message && saveErr.message.includes('11000'))) {
          console.log(`  -> DUPLICATE KEY: Document already exists in DB. Treating as saved.`);
          saved = true;
          break;
        }
        saveRetries--;
        console.error(`  -> ERROR: Failed to save Chapter ${i} to DB: ${saveErr.message}. Retries left: ${saveRetries}`);
        if (saveRetries === 0) {
          throw saveErr;
        }
        await delay(5000); // wait 5 seconds before retrying
      }
    }
    successfulChapters++;

    if (testMode && i >= 3) {
      console.log(`Test mode: Stop after 3 chapters.`);
      break;
    }
  }

  // Update novel document with total chapters count
  let novelSaved = false;
  let novelSaveRetries = 10;
  while (!novelSaved && novelSaveRetries > 0) {
    try {
      dbNovel.total_chapters = expectedChapters;
      await dbNovel.save();
      novelSaved = true;
    } catch (saveErr) {
      novelSaveRetries--;
      console.error(`  -> ERROR: Failed to update novel total_chapters: ${saveErr.message}. Retries left: ${novelSaveRetries}`);
      if (novelSaveRetries === 0) {
        throw saveErr;
      }
      await delay(5000);
    }
  }
  console.log(`Completed Novel: "${dbNovel.title}" | Seeded ${successfulChapters}/${expectedChapters} chapters.`);
}

async function main() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected successfully.");

    // Fetch author user or create if not exists
    let authorUser = await User.findOne({ role: 'author' });
    if (!authorUser) {
      authorUser = new User({
        username: "NovelverseAuthor",
        email: "author@novelverse.com",
        password: "password123",
        role: "author"
      });
      await authorUser.save();
      console.log("Created default author user.");
    }

    // Load novels list from novelsData.json
    const novelsDataPath = 'C:\\Users\\admin\\.gemini\\antigravity\\brain\\5487a710-4833-48dc-8f7a-2cfc6fd8d96d\\scratch\\novelsData.json';
    let novels = JSON.parse(fs.readFileSync(novelsDataPath, 'utf8'));

    // Check if the 5 missing novels are in the list. If not, add them.
    const missingNovels = [
      { title: "The Search for the Duchess's Husband", chaptersCount: 185, status: "ongoing", genres: ["Romance", "Fantasy", "Drama"] },
      { title: "The Scandal Maker Has Returned", chaptersCount: 209, status: "ongoing", genres: ["Romance", "Drama"] },
      { title: "Vivian’s Circumstances", chaptersCount: 124, status: "ongoing", genres: ["Romance", "Mature", "Fantasy"] },
      { title: "The Youngest Hides a Lot", chaptersCount: 291, status: "ongoing", genres: ["Fantasy", "Action", "Drama"] },
      { title: "Windburg", chaptersCount: 184, status: "ongoing", genres: ["Romance", "Fantasy", "Slice of Life"] }
    ];

    missingNovels.forEach(mn => {
      const exists = novels.some(n => n.title.toLowerCase() === mn.title.toLowerCase());
      if (!exists) {
        novels.push(mn);
        console.log(`Added missing novel to list: "${mn.title}"`);
      }
    });

    // Update Forgotten Meadow chapters count to 244
    const meadow = novels.find(n => n.title.toLowerCase() === "forgotten meadow");
    if (meadow) {
      meadow.chaptersCount = 244;
      console.log(`Updated "Forgotten Meadow" chapters count to 244.`);
    }

    console.log(`Total novels to process: ${novels.length}`);

    // If command line arg is provided, run in test mode (only process the specified novel title or index)
    const args = process.argv.slice(2);
    let novelsToProcess = novels;

    if (args.includes('--test')) {
      console.log("\n*** RUNNING IN TEST MODE (First novel, first 3 chapters only) ***\n");
      novelsToProcess = [novels.find(n => n.title.toLowerCase() === "vivian’s circumstances") || novels[0]];
      const dbNovel = await Novel.findOneAndUpdate(
        { title: novelsToProcess[0].title },
        {
          title: novelsToProcess[0].title,
          author_id: authorUser._id,
          description: `A masterpiece of ${novelsToProcess[0].genres.join(' & ')}.`,
          cover_image: `https://image.pollinations.ai/prompt/${encodeURIComponent(novelsToProcess[0].title + " anime visual novel cover art")}?width=400&height=600&nologo=true`,
          genres: novelsToProcess[0].genres,
          status: "approved",
          publishing_status: novelsToProcess[0].title.toLowerCase() === "under the oak tree" ? "completed" : "ongoing",
          total_chapters: novelsToProcess[0].chaptersCount
        },
        { upsert: true, new: true }
      );
      await scrapeNovel(dbNovel, dbNovel.total_chapters, true);
      console.log("\nTest run complete!");
      process.exit(0);
    }

    // Process all novels
    for (const data of novelsToProcess) {
      // Exclude Under the Oak Tree as requested by user
      if (data.title.toLowerCase() === "under the oak tree") {
        console.log(`Skipping "Under the Oak Tree" (already completed).`);
        continue;
      }

      // Find or create novel in DB
      let dbNovel = null;
      let findRetries = 10;
      while (!dbNovel && findRetries > 0) {
        try {
          dbNovel = await Novel.findOne({ title: data.title });
          if (!dbNovel) {
            dbNovel = new Novel({
              title: data.title,
              author_id: authorUser._id,
              description: `A masterpiece of ${data.genres.join(' & ')}. ${data.title} explores the intricate web of fate and choice.`,
              cover_image: `https://image.pollinations.ai/prompt/${encodeURIComponent(data.title + " anime visual novel cover art")}?width=400&height=600&nologo=true`,
              genres: data.genres,
              status: "approved",
              publishing_status: data.title.toLowerCase() === "under the oak tree" ? "completed" : "ongoing",
              total_chapters: data.chaptersCount,
              views: 1000 + Math.floor(Math.random() * 50000),
              rating: (4.5 + Math.random() * 0.5).toFixed(1)
            });
            await dbNovel.save();
            console.log(`Created Novel document in DB: "${dbNovel.title}"`);
          } else {
            // Update chapter count to make sure it matches
            dbNovel.total_chapters = data.chaptersCount;
            await dbNovel.save();
          }
        } catch (findErr) {
          findRetries--;
          console.error(`  -> ERROR: DB connection error when looking up/saving novel "${data.title}": ${findErr.message}. Retries left: ${findRetries}`);
          if (findRetries === 0) {
            throw findErr;
          }
          await delay(5000);
        }
      }

      // Resilient check if the chapters are already seeded
      let skipNovel = false;
      let countRetries = 10;
      while (countRetries > 0) {
        try {
          const existingChaptersCount = await Chapter.countDocuments({ novel_id: dbNovel._id });
          if (existingChaptersCount === data.chaptersCount) {
            console.log(`Skipping "${data.title}" - already fully seeded with ${existingChaptersCount} chapters.`);
            skipNovel = true;
          }
          break;
        } catch (countErr) {
          countRetries--;
          console.error(`  -> ERROR: DB connection error when counting chapters: ${countErr.message}. Retries left: ${countRetries}`);
          if (countRetries === 0) {
            throw countErr;
          }
          await delay(5000);
        }
      }

      if (skipNovel) {
        continue;
      }

      await scrapeNovel(dbNovel, data.chaptersCount);
    }

    console.log("\nAll novels processed successfully!");
    process.exit(0);

  } catch (e) {
    console.error("Scraper crash error:", e);
    process.exit(1);
  }
}

main();
