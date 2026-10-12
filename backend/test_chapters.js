const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Chapter = require('./models/Chapter');
const Novel = require('./models/Novel');

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  
  const novel = await Novel.findOne({ title: /Under the Oak Tree/i });
  console.log("Novel:", novel._id);

  try {
    const chapters = await Chapter.find({ novel_id: novel._id })
      .select('-content')
      .sort({ chapter_number: 1 });
      
    const existingNumbers = chapters.map(c => c.chapter_number);
    const fullList = [...chapters.map(ch => ch.toObject())];

    for (let i = 1; i <= novel.total_chapters; i++) {
      if (!existingNumbers.includes(i)) {
        fullList.push({
          _id: `dynamic_${novel._id}_${i}`,
          novel_id: novel._id,
          chapter_number: i,
          title: `Chapter ${i}: The Journey Unfolds`,
          is_locked: i > 3,
          price: i > 3 ? 10 : 0,
          createdAt: novel.createdAt,
          updatedAt: novel.updatedAt
        });
      }
    }
    
    console.log("Success! Chapters count:", fullList.length);
  } catch(e) {
    console.error("Error:", e);
  }
  process.exit();
}
test();
