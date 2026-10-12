const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const Novel = require('./models/Novel');
const Chapter = require('./models/Chapter');

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to database.");
    
    // Load novels list from novelsData.json
    const novelsDataPath = 'C:\\Users\\admin\\.gemini\\antigravity\\brain\\5487a710-4833-48dc-8f7a-2cfc6fd8d96d\\scratch\\novelsData.json';
    let novels = JSON.parse(fs.readFileSync(novelsDataPath, 'utf8'));

    // Missing novels
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
      }
    });

    const meadow = novels.find(n => n.title.toLowerCase() === "forgotten meadow");
    if (meadow) {
      meadow.chaptersCount = 244;
    }

    console.log(`Total novels configuration: ${novels.length}`);

    let doneCount = 0;
    let remainingCount = 0;
    let doneList = [];
    let remainingList = [];

    for (const n of novels) {
      if (n.title.toLowerCase() === "under the oak tree") {
        doneCount++;
        doneList.push({ title: n.title, expected: n.chaptersCount, actual: n.chaptersCount, status: 'skipped (completed)' });
        continue;
      }

      const dbNovel = await Novel.findOne({ title: n.title });
      if (!dbNovel) {
        remainingCount++;
        remainingList.push({ title: n.title, expected: n.chaptersCount, actual: 0, reason: 'Not in DB' });
        continue;
      }

      const existingChaptersCount = await Chapter.countDocuments({ novel_id: dbNovel._id });
      if (existingChaptersCount === n.chaptersCount) {
        doneCount++;
        doneList.push({ title: n.title, expected: n.chaptersCount, actual: existingChaptersCount });
      } else {
        remainingCount++;
        remainingList.push({ title: n.title, expected: n.chaptersCount, actual: existingChaptersCount });
      }
    }

    console.log(`\n=================== SCRAPING PROGRESS ===================`);
    console.log(`DONE NOVELS: ${doneCount}`);
    console.log(`REMAINING NOVELS: ${remainingCount}`);
    console.log(`TOTAL NOVELS: ${novels.length}`);
    console.log(`=========================================================\n`);

    if (remainingList.length > 0) {
      console.log("REMAINING NOVELS DETAILS:");
      remainingList.forEach((rn, idx) => {
        console.log(`${idx + 1}. "${rn.title}" | Expected: ${rn.expected} | Actual (in DB): ${rn.actual}`);
      });
    } else {
      console.log("All novels have been fully scraped!");
    }

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

run();
