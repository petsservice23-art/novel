const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Novel = require('./models/Novel');
const Chapter = require('./models/Chapter');

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const vivian = await Novel.findOne({ title: "Vivian’s Circumstances" });
    if (!vivian) {
      console.log("Vivian's Circumstances not found in DB.");
      process.exit(1);
    }
    console.log("Vivian ID:", vivian._id);
    
    // Now let's query chapters like getChaptersByNovel does
    const chapters = await Chapter.find({ novel_id: vivian._id })
      .select('-content')
      .sort({ chapter_number: 1 });
    
    console.log("Chapters in DB count:", chapters.length);
    
    const existingNumbers = chapters.map(c => c.chapter_number);
    const fullList = [...chapters.map(ch => ch.toObject())];

    for (let i = 1; i <= vivian.total_chapters; i++) {
      if (!existingNumbers.includes(i)) {
        fullList.push({
          _id: `dynamic_${vivian._id}_${i}`,
          novel_id: vivian._id,
          chapter_number: i,
          title: `Chapter ${i}: The Journey Unfolds`,
          is_locked: i > 3,
          price: i > 3 ? 10 : 0,
          createdAt: vivian.createdAt,
          updatedAt: vivian.updatedAt
        });
      }
    }

    fullList.sort((a, b) => a.chapter_number - b.chapter_number);
    console.log("Full List length:", fullList.length);
    console.log("Sample chapter:", fullList[0]);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

run();
