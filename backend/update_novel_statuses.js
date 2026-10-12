const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Novel = require('./models/Novel');

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for status updates...");

    // Update Under the Oak Tree to 'completed'
    const completedResult = await Novel.updateMany(
      { title: { $regex: /Under the Oak Tree/i } },
      { $set: { publishing_status: 'completed' } }
    );
    console.log(`Updated Under the Oak Tree: modified ${completedResult.modifiedCount} document(s).`);

    // Update all other novels to 'ongoing'
    const ongoingResult = await Novel.updateMany(
      { title: { $not: /Under the Oak Tree/i } },
      { $set: { publishing_status: 'ongoing' } }
    );
    console.log(`Updated other novels to 'ongoing': modified ${ongoingResult.modifiedCount} document(s).`);

    process.exit(0);
  } catch (error) {
    console.error("Error updating novel statuses:", error);
    process.exit(1);
  }
};

run();
