const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Chapter = require('./models/Chapter');

dotenv.config();

const lockChapters = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB...");

    // Find all chapters with chapter_number > 10 and set them to locked and price 10
    const result = await Chapter.updateMany(
      { chapter_number: { $gt: 10 } },
      { $set: { is_locked: true, price: 10 } }
    );

    console.log(`Locked ${result.modifiedCount} chapters.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

lockChapters();
