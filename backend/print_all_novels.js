const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Novel = require('./models/Novel');

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const novels = await Novel.find({}).select('title total_chapters');
    console.log(`Total novels in DB: ${novels.length}`);
    novels.forEach((n, i) => {
      console.log(`${i + 1}: ${n.title} (${n.total_chapters} chapters)`);
    });
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

run();
