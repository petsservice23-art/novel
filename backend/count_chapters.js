const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Novel = require('./models/Novel');
const Chapter = require('./models/Chapter');

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const novels = await Novel.find({});
    console.log(`Total novels in DB: ${novels.length}`);
    
    for (const n of novels) {
      const count = await Chapter.countDocuments({ novel_id: n._id });
      if (count > 0) {
        console.log(`- ${n.title}: ${count} chapters in DB (Novel total_chapters: ${n.total_chapters})`);
      }
    }
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

run();
