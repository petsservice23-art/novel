const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '.env') });

const mongoose = require('mongoose');
const Chapter = require('./models/Chapter');
const Novel = require('./models/Novel');
const { uploadChapterContent } = require('./utils/r2Service');

async function migrate() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB.');

  const totalChapters = await Chapter.countDocuments();
  console.log(`Total chapters in database: ${totalChapters}`);

  // Find chapters that have content stored directly in MongoDB
  const chaptersWithContent = await Chapter.find({
    content: { $exists: true, $ne: null },
    $or: [{ r2_key: null }, { r2_key: { $exists: false } }]
  });

  console.log(`Found ${chaptersWithContent.length} chapters to migrate to Cloudflare R2.`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < chaptersWithContent.length; i++) {
    const chapter = chaptersWithContent[i];
    try {
      if (!chapter.content) continue;

      const r2Key = await uploadChapterContent(
        chapter.novel_id.toString(),
        chapter.chapter_number,
        chapter.content
      );

      // Update chapter in MongoDB: assign r2_key and nullify content
      chapter.r2_key = r2Key;
      chapter.content = null;
      await chapter.save();

      successCount++;

      if (successCount % 25 === 0 || i === chaptersWithContent.length - 1) {
        console.log(`Progress: ${successCount}/${chaptersWithContent.length} chapters migrated to Cloudflare R2.`);
      }
    } catch (err) {
      console.error(`Error migrating chapter ${chapter.chapter_number} (${chapter._id}):`, err.message);
      failCount++;
    }
  }

  console.log('--- Migration Completed ---');
  console.log(`Successfully migrated to R2: ${successCount}`);
  console.log(`Failed: ${failCount}`);

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB.');
}

migrate().catch(err => {
  console.error('Fatal migration error:', err);
  process.exit(1);
});
