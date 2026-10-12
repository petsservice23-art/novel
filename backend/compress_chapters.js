const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Chapter = require('./models/Chapter');

dotenv.config();

async function run() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected successfully.");

    console.log("Fetching chapters for compression analysis...");
    
    // We will process in batches to prevent memory overflow
    const batchSize = 1000;
    let skip = 0;
    let totalCompressed = 0;
    let alreadyCompressed = 0;
    
    while (true) {
      const chapters = await Chapter.find({}).skip(skip).limit(batchSize);
      
      if (chapters.length === 0) break;
      
      console.log(`Processing batch ${skip} to ${skip + batchSize}...`);
      
      for (let chapter of chapters) {
        if (Array.isArray(chapter.content)) {
          // If it's a 1-element array that already starts with <p>, it's basically already compressed inside an array.
          if (chapter.content.length === 1 && chapter.content[0].startsWith('<p>')) {
             chapter.content = chapter.content[0];
          } else {
             // Compress by wrapping paragraphs in <p> tags
             const compressedString = chapter.content.map(p => `<p style="margin-bottom: 1.5em">${p}</p>`).join('');
             chapter.content = compressedString;
          }
          await chapter.save();
          totalCompressed++;
        } else if (typeof chapter.content === 'string') {
          alreadyCompressed++;
        }
      }
      
      skip += batchSize;
    }

    console.log(`\n======================================================`);
    console.log(`✅ DATABASE COMPRESSION COMPLETE`);
    console.log(`======================================================`);
    console.log(`Newly Compressed Chapters: ${totalCompressed}`);
    console.log(`Already Compressed:        ${alreadyCompressed}`);
    console.log(`Total Chapters Processed:  ${totalCompressed + alreadyCompressed}`);
    console.log(`======================================================\n`);

    process.exit(0);
  } catch (error) {
    console.error("Error compressing database:", error);
    process.exit(1);
  }
}

run();
