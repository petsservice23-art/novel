const mongoose = require('mongoose');
const Novel = require('./models/Novel');
const Chapter = require('./models/Chapter');
require('dotenv').config();

const fixTotalChapters = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected...');

    const novels = await Novel.find({});
    console.log(`Found ${novels.length} novels.`);

    for (const novel of novels) {
      const chapterCount = await Chapter.countDocuments({ novel_id: novel._id });
      console.log(`Novel: ${novel.title} | Current count: ${novel.total_chapters} | Real count: ${chapterCount}`);
      
      novel.total_chapters = chapterCount;
      await novel.save();
    }

    console.log('All novels updated successfully.');
    process.exit();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

fixTotalChapters();
