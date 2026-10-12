const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Novel = require('./models/Novel');
const Chapter = require('./models/Chapter');

dotenv.config();

const targetNovels = [
  "Every Time The Villainess Opens Her Mouth Disaster Follows",
  "To You Who Will Ruin Me",
  "The Way to Protect the Female Lead’s Older Brother",
  "The Villainess Gets Her Sponsorship",
  "My Contract Husband Resembles the Male Protagonist",
  "The Count's Secret Maid",
  "Precipice Outside the Cage",
  "Looking for My Fiancé’s Lover",
  "This Is Clearly a Misunderstanding!",
  "I'm Leaving the Villainess's Station",
  "If I Don't Get Married I'll Die",
  "I'm Trying to End This Possession",
  "I Accidentally Saved the Male Lead's Brother",
  "Having Enemy's Baby",
  "Don't Look for the Resurrected Villainess"
];

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB...");

    let totalDeleted = 0;
    for (const title of targetNovels) {
      const novel = await Novel.findOne({ title: title });
      if (!novel) {
        console.log(`Warning: Novel not found in database: "${title}"`);
        continue;
      }
      const delResult = await Chapter.deleteMany({ novel_id: novel._id });
      totalDeleted += delResult.deletedCount;
      console.log(`Cleared ${delResult.deletedCount} chapters for "${title}".`);
    }

    console.log(`Successfully cleared a total of ${totalDeleted} chapters across the 15 target novels.`);
    process.exit(0);
  } catch (error) {
    console.error("Error clearing chapters:", error);
    process.exit(1);
  }
};

run();
