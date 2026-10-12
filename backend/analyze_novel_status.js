const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const Novel = require('./models/Novel');
const Chapter = require('./models/Chapter');

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to database.");

    // Get all novels from DB
    const allNovels = await Novel.find({}).lean();
    console.log(`Total novels in DB: ${allNovels.length}`);

    // Use aggregation to get chapter stats per novel in one query
    const chapterStats = await Chapter.aggregate([
      {
        $group: {
          _id: "$novel_id",
          totalChapters: { $sum: 1 },
          freeChapters: { $sum: { $cond: [{ $eq: ["$is_locked", false] }, 1, 0] } },
          lockedChapters: { $sum: { $cond: [{ $eq: ["$is_locked", true] }, 1, 0] } },
          // Check if chapter 1 exists and is free
          ch1Free: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ["$chapter_number", 1] }, { $eq: ["$is_locked", false] }] },
                1, 0
              ]
            }
          }
        }
      }
    ]);

    // Map aggregation results by novel_id string
    const statsMap = {};
    chapterStats.forEach(s => {
      statsMap[s._id.toString()] = s;
    });

    const doneProperly = [];
    const donePlaceholder = [];
    const interrupted = [];
    const notScraped = [];

    for (const novel of allNovels) {
      const nid = novel._id.toString();
      const stats = statsMap[nid];
      const expected = novel.total_chapters || 0;

      if (!stats || stats.totalChapters === 0) {
        notScraped.push({ title: novel.title, expected });
        continue;
      }

      const info = {
        title: novel.title,
        expected,
        actual: stats.totalChapters,
        free: stats.freeChapters,
        locked: stats.lockedChapters
      };

      if (stats.totalChapters >= expected) {
        if (stats.ch1Free > 0) {
          doneProperly.push(info);
        } else {
          donePlaceholder.push(info);
        }
      } else {
        interrupted.push(info);
      }
    }

    console.log(`\n${"=".repeat(60)}`);
    console.log(`  NOVEL SCRAPING STATUS REPORT`);
    console.log(`${"=".repeat(60)}\n`);

    console.log(`✅ DONE PROPERLY (real content fetched): ${doneProperly.length}`);
    doneProperly.forEach((n, i) => {
      console.log(`   ${i+1}. "${n.title}" | ${n.actual} chapters (${n.free} free, ${n.locked} locked)`);
    });

    console.log(`\n⚠️  DONE WITH PLACEHOLDERS ONLY (ownverso was down/402): ${donePlaceholder.length}`);
    donePlaceholder.forEach((n, i) => {
      console.log(`   ${i+1}. "${n.title}" | ${n.actual} chapters (ALL placeholder/locked)`);
    });

    console.log(`\n🔄 INTERRUPTED (partial chapters): ${interrupted.length}`);
    interrupted.forEach((n, i) => {
      console.log(`   ${i+1}. "${n.title}" | ${n.actual}/${n.expected} chapters (${n.free} free, ${n.locked} locked)`);
    });

    console.log(`\n❌ NOT SCRAPED YET: ${notScraped.length}`);
    notScraped.forEach((n, i) => {
      console.log(`   ${i+1}. "${n.title}" | Expected: ${n.expected} chapters`);
    });

    console.log(`\n${"=".repeat(60)}`);
    console.log(`  SUMMARY`);
    console.log(`  Total novels in DB:       ${allNovels.length}`);
    console.log(`  Done properly:            ${doneProperly.length}`);
    console.log(`  Done (placeholders only): ${donePlaceholder.length}`);
    console.log(`  Interrupted:              ${interrupted.length}`);
    console.log(`  Not scraped:              ${notScraped.length}`);
    console.log(`${"=".repeat(60)}\n`);

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

run();
