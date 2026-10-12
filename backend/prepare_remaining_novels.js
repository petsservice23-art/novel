const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Novel = require('./models/Novel');
const Chapter = require('./models/Chapter');

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB...");

    const novels = await Novel.find({}).lean();
    const stats = await Chapter.aggregate([
      { $group: {
          _id: '$novel_id',
          total: { $sum: 1 },
          free: { $sum: { $cond: [{ $eq: ['$is_locked', false] }, 1, 0] } },
          locked: { $sum: { $cond: [{ $eq: ['$is_locked', true] }, 1, 0] } },
          ch1Free: { $sum: { $cond: [{ $and: [{ $eq: ['$chapter_number', 1] }, { $eq: ['$is_locked', false] }] }, 1, 0] } }
        }
      }
    ]);
    const map = {};
    stats.forEach(s => { map[s._id.toString()] = s; });

    const doneProperlyIds = new Set();
    const doneProperlyTitles = [];

    for (const n of novels) {
      const s = map[n._id.toString()];
      if (s && s.total === n.total_chapters && s.ch1Free > 0) {
        doneProperlyIds.add(n._id.toString());
        doneProperlyTitles.push(n.title);
      }
    }

    console.log(`Found ${doneProperlyTitles.length} novels done properly.`);
    console.log("Novels to preserve chapters for:", doneProperlyTitles);

    let deletedCount = 0;
    let clearedNovels = [];

    for (const n of novels) {
      const nidStr = n._id.toString();
      if (n.title.toLowerCase() === "under the oak tree") {
        console.log(`Preserving "Under the Oak Tree" chapters.`);
        continue;
      }
      if (doneProperlyIds.has(nidStr)) {
        console.log(`Preserving "${n.title}" chapters.`);
        continue;
      }

      // This novel is either interrupted or has placeholders only. Let's clear its chapters.
      const delResult = await Chapter.deleteMany({ novel_id: n._id });
      deletedCount += delResult.deletedCount;
      clearedNovels.push(n.title);
      console.log(`Cleared ${delResult.deletedCount} chapters for "${n.title}".`);
    }

    console.log(`Total chapters deleted: ${deletedCount}`);
    console.log(`Successfully cleared ${clearedNovels.length} novels for re-scraping.`);

    process.exit(0);
  } catch (error) {
    console.error("Error clearing chapters:", error);
    process.exit(1);
  }
};

run();
