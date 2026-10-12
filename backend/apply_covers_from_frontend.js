const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Novel = require('./models/Novel');

dotenv.config();

// Normalization function to match file names to novel titles resiliently
function normalizeString(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') // remove all spaces, punctuation, special chars
    .trim();
}

// Check if a string is a 24-character hex MongoDB ObjectId
function isObjectId(str) {
  return /^[0-9a-fA-F]{24}$/.test(str);
}

async function run() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected successfully.");

    const coversDir = path.join(__dirname, '../frontend/public/covers');

    if (!fs.existsSync(coversDir)) {
      console.error(`❌ Covers directory not found at: ${coversDir}`);
      process.exit(1);
    }

    const files = fs.readdirSync(coversDir);
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const imageFiles = files.filter(file => imageExtensions.includes(path.extname(file).toLowerCase()));

    if (imageFiles.length === 0) {
      console.log(`⚠️ No cover image files found inside: ${coversDir}`);
      process.exit(0);
    }

    console.log(`🔍 Found ${imageFiles.length} cover image files in frontend/public/covers.`);

    // Fetch all novels from DB
    const allNovels = await Novel.find({});
    console.log(`Loaded ${allNovels.length} novels from database for matching.\n`);

    let matchedCount = 0;
    let alreadyMatchedCount = 0;
    let unmatchedFiles = [];
    
    // Track matched novel IDs to avoid duplicate mapping conflicts
    const matchedNovelIds = new Set();

    // 1. Process files that are already ObjectIds first to establish existing mappings
    for (const imageFile of imageFiles) {
      const ext = path.extname(imageFile);
      const baseName = path.basename(imageFile, ext);

      if (isObjectId(baseName)) {
        const novel = allNovels.find(n => n._id.toString() === baseName);
        if (novel) {
          matchedNovelIds.add(novel._id.toString());
          const expectedPath = `/covers/${imageFile}`;
          if (novel.cover_image !== expectedPath) {
            novel.cover_image = expectedPath;
            await novel.save();
            console.log(`ℹ️ Already matched filename matched ID, updated DB: "${novel.title}" -> ${expectedPath}`);
          }
          alreadyMatchedCount++;
        }
      }
    }

    console.log(`\n======================================================`);
    console.log(`Processing title-named covers...`);
    console.log(`======================================================\n`);

    // 2. Process other cover files with title names
    for (const imageFile of imageFiles) {
      const ext = path.extname(imageFile);
      const baseName = path.basename(imageFile, ext);

      if (isObjectId(baseName)) {
        continue; // handled above
      }

      const normalizedBase = normalizeString(baseName);

      // Find best match in DB
      let bestMatch = null;

      // Try exact match first
      for (const novel of allNovels) {
        if (matchedNovelIds.has(novel._id.toString())) continue;
        const normalizedTitle = normalizeString(novel.title);
        if (normalizedTitle === normalizedBase) {
          bestMatch = novel;
          break;
        }
      }

      // Try substring/contains match if exact not found
      if (!bestMatch) {
        for (const novel of allNovels) {
          if (matchedNovelIds.has(novel._id.toString())) continue;
          const normalizedTitle = normalizeString(novel.title);
          if (normalizedTitle.includes(normalizedBase) || normalizedBase.includes(normalizedTitle)) {
            bestMatch = novel;
            break;
          }
        }
      }

      if (bestMatch) {
        const destFileName = `${bestMatch._id}.jpg`; // Renaming to standard .jpg matching standard schemas
        const sourcePath = path.join(coversDir, imageFile);
        const destPath = path.join(coversDir, destFileName);

        // Rename/move file in place
        fs.renameSync(sourcePath, destPath);
        
        // Update database path
        bestMatch.cover_image = `/covers/${destFileName}`;
        await bestMatch.save();

        matchedNovelIds.add(bestMatch._id.toString());
        console.log(`✅ MATCHED & RENAMED: "${imageFile}"  ➡️  "${bestMatch._id}.jpg" (for "${bestMatch.title}")`);
        matchedCount++;
      } else {
        unmatchedFiles.push(imageFile);
      }
    }

    // 3. Print report
    console.log(`\n======================================================`);
    console.log(`🎉 PROCESS COMPLETE`);
    console.log(`======================================================`);
    console.log(`Already ID-matched files: ${alreadyMatchedCount}`);
    console.log(`Newly matched & renamed:  ${matchedCount}`);
    console.log(`Total files matched:     ${alreadyMatchedCount + matchedCount}`);
    console.log(`Unmatched files:         ${unmatchedFiles.length}`);
    console.log(`======================================================`);

    if (unmatchedFiles.length > 0) {
      console.log(`\n❌ UNMATCHED FILES:`);
      unmatchedFiles.forEach(file => console.log(`   - "${file}"`));
    }

    const novelsWithoutCovers = allNovels.filter(n => !matchedNovelIds.has(n._id.toString()));
    console.log(`\n📖 Novels in DB still lacking covers: ${novelsWithoutCovers.length}`);
    if (novelsWithoutCovers.length > 0) {
      novelsWithoutCovers.slice(0, 15).forEach((n, i) => {
        console.log(`   ${i + 1}. "${n.title}" (ID: ${n._id})`);
      });
      if (novelsWithoutCovers.length > 15) {
        console.log(`   ... and ${novelsWithoutCovers.length - 15} more.`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error("Error applying manual covers:", error);
    process.exit(1);
  }
}

run();
