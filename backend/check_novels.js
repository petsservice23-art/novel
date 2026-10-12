const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Novel = require('./models/Novel');
const Chapter = require('./models/Chapter');

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to database.");
    const count = await Novel.countDocuments();
    console.log("Total novels in DB:", count);
    const chapterCount = await Chapter.countDocuments();
    console.log("Total chapters in DB:", chapterCount);
    
    // Find some sample novels
    const samples = await Novel.find({}).limit(5).select('title total_chapters');
    console.log("Sample novels:", samples);
    
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

run();
