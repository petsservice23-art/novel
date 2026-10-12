const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Novel = require('./models/Novel');

dotenv.config();

// Standard normalization function to match file names to novel titles resiliently
function normalizeString(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') // remove all spaces, punctuation, special chars
    .trim();
}

async function run() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected successfully.");

    // Folder containing your manually downloaded covers
    const manualCoversDir = path.join(__dirname, 'manual_covers');
    const destinationDir = path.join(__dirname, '../frontend/public/covers');

    // Create directories if they do not exist
    if (!fs.existsSync(manualCoversDir)) {
      fs.mkdirSync(manualCoversDir, { recursive: true });
      console.log(`\n📁 Created empty folder at: ${manualCoversDir}`);
      console.log(`👉 Please place your manually downloaded cover images (.jpg, .png, .jpeg) in this folder.`);
      console.log(`💡 Tip: Name each file closely to the novel's title (e.g., "Under the Oak Tree.jpg").`);
      console.log(`Then, re-run this script to automatically match and apply them!`);
      process.exit(0);
    }

    if (!fs.existsSync(destinationDir)) {
      fs.mkdirSync(destinationDir, { recursive: true });
    }

    const files = fs.readdirSync(manualCoversDir);
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const imageFiles = files.filter(file => imageExtensions.includes(path.extname(file).toLowerCase()));

    if (imageFiles.length === 0) {
      console.log(`\n⚠️ No cover image files found inside: ${manualCoversDir}`);
      console.log(`👉 Please drop some images inside that folder and re-run this script.`);
      process.exit(0);
    }

    console.log(`\n🔍 Found ${imageFiles.length} manual cover image(s) to process.`);

    // Fetch all novels from DB
    const allNovels = await Novel.find({});
    console.log(`Loaded ${allNovels.length} novels from database for matching.`);

    let matchedCount = 0;

    for (const imageFile of imageFiles) {
      const ext = path.extname(imageFile);
      const baseName = path.basename(imageFile, ext); // File name without extension
      const normalizedBase = normalizeString(baseName);

      // Find best match in DB
      let bestMatch = null;
      let highestSimilarity = 0;

      for (const novel of allNovels) {
        const normalizedTitle = normalizeString(novel.title);
        
        // Exact normalized match
        if (normalizedTitle === normalizedBase) {
          bestMatch = novel;
          break;
        }

        // Substring match check
        if (normalizedTitle.includes(normalizedBase) || normalizedBase.includes(normalizedTitle)) {
          bestMatch = novel;
          break;
        }
      }

      if (bestMatch) {
        const destFileName = `${bestMatch._id}.jpg`; // save always as .jpg for clean frontend handling
        const sourcePath = path.join(manualCoversDir, imageFile);
        const destPath = path.join(destinationDir, destFileName);

        // Copy file
        fs.copyFileSync(sourcePath, destPath);
        
        // Update database path
        bestMatch.cover_image = `/covers/${destFileName}`;
        await bestMatch.save();

        console.log(`✅ MATCHED & APPLIED: "${imageFile}"  ➡️  "${bestMatch.title}"`);
        matchedCount++;
      } else {
        console.log(`❌ NO MATCH FOUND FOR: "${imageFile}" (Make sure the filename matches the novel title in DB)`);
      }
    }

    console.log(`\n======================================================`);
    console.log(`🎉 Finished! Successfully applied ${matchedCount}/${imageFiles.length} covers.`);
    console.log(`======================================================\n`);
    process.exit(0);

  } catch (error) {
    console.error("Error applying manual covers:", error);
    process.exit(1);
  }
}

run();
