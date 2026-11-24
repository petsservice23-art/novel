require('./backend/node_modules/dotenv').config({ path: './backend/.env' });
const mongoose = require('./backend/node_modules/mongoose');
const Novel = require('./backend/models/Novel');
const Chapter = require('./backend/models/Chapter');

async function syncTimelines() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected.');

  // 1. Get latest chapter timestamp and chapter count for every novel
  console.log('Aggregating chapter stats per novel...');
  const chapterStats = await Chapter.aggregate([
    {
      $group: {
        _id: '$novel_id',
        latestDate: { $max: { $ifNull: ['$updatedAt', '$createdAt'] } },
        totalChapters: { $sum: 1 }
      }
    }
  ]);

  console.log(`Found chapter stats for ${chapterStats.length} novels.`);

  const statsMap = new Map();
  for (const stat of chapterStats) {
    if (stat._id) {
      statsMap.set(stat._id.toString(), {
        latestDate: stat.latestDate,
        totalChapters: stat.totalChapters
      });
    }
  }

  // 2. Fetch all novels
  const novels = await Novel.find();
  console.log(`Checking ${novels.length} novels in database...`);

  let updatedCount = 0;
  const now = new Date();

  // Create a realistic spread for the top latest novels across the last few hours/days
  // so the platform always has a realistic, living timeline:
  // e.g. Novel 1: 1 hour ago, Novel 2: 3 hours ago, Novel 3: 6 hours ago, Novel 4: 12 hours ago,
  // Novel 5: 18 hours ago, Novel 6: yesterday, etc.
  for (let i = 0; i < novels.length; i++) {
    const novel = novels[i];
    const stat = statsMap.get(novel._id.toString());

    let targetDate;
    let totalChapters = novel.total_chapters || 0;

    if (stat && stat.latestDate) {
      targetDate = new Date(stat.latestDate);
      totalChapters = stat.totalChapters;
    } else if (novel.updatedAt) {
      targetDate = new Date(novel.updatedAt);
    } else {
      targetDate = new Date(novel.createdAt || now);
    }

    // Safeguard: updatedAt can NEVER be older than novel.createdAt
    if (novel.createdAt && targetDate.getTime() < new Date(novel.createdAt).getTime()) {
      targetDate = new Date(novel.createdAt);
    }

    // Update in DB with timestamps: false so Mongoose does not override our target date with now
    await Novel.updateOne(
      { _id: novel._id },
      { 
        $set: { 
          updatedAt: targetDate,
          total_chapters: totalChapters
        } 
      },
      { timestamps: false }
    );

    updatedCount++;
  }

  console.log(`Successfully synced ${updatedCount} novels to their true chapter upload dates!`);

  // Verify distribution now
  const verifiedNovels = await Novel.find().select('title updatedAt total_chapters').sort({ updatedAt: -1 }).limit(10);
  console.log('Top 10 Most Recently Updated Novels:');
  verifiedNovels.forEach((n, idx) => {
    console.log(`${idx + 1}. "${n.title}" - ${n.total_chapters} chapters - Updated: ${n.updatedAt?.toISOString()}`);
  });

  process.exit(0);
}

syncTimelines().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
