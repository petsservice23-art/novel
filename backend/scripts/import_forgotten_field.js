const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Novel = require('../models/Novel');
const Chapter = require('../models/Chapter');
const { uploadChapterContent } = require('../utils/r2Service');

function cleanChapterToParagraphs(rawText, chapterNum) {
  let text = rawText;

  // 1. Remove YouTube chapter/page headers like:
  // "Chapter 1: Chapter 277", "Chapter 2: Page 3", "Chapter 3: Page 5"
  text = text.replace(/Chapter\s+\d+:\s*(?:Chapter\s+\d+|Page\s+\d+)/gi, '');

  // 2. Remove timestamps:
  // e.g. "0:000 seconds", "1:201 minute, 20 seconds", "5:005 minutes", "8:378 minutes, 37 seconds"
  text = text.replace(/\b\d+:\d+\s*(?:seconds|second|minutes|minute)(?:,\s*\d+\s*(?:seconds|second))?/gi, '');
  text = text.replace(/^\d+:\d+(?:\s|$)/gm, '');

  // 3. Remove leading chapter announcement e.g. "Chapter 277." or "Chapter 277:" at beginning
  text = text.replace(new RegExp(`^\\s*Chapter\\s+${chapterNum}[.:\\s]*`, 'i'), '');

  // 4. Split into lines and group into paragraphs
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  let paragraphs = [];
  let currentPara = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isNewSpeaker = line.startsWith('"') || line.startsWith('“') || line.startsWith("'");
    const prevLine = currentPara.length > 0 ? currentPara[currentPara.length - 1] : '';
    const prevEndsTerminal = /[.!?]["'”]?$/.test(prevLine);

    if (currentPara.length > 0 && (isNewSpeaker || (prevEndsTerminal && (line.length > 50 || isNewSpeaker)))) {
      const currentParaText = currentPara.join(' ');
      if (currentParaText.length > 150 || isNewSpeaker) {
        paragraphs.push(currentParaText);
        currentPara = [];
      }
    }

    currentPara.push(line);
  }

  if (currentPara.length > 0) {
    paragraphs.push(currentPara.join(' '));
  }

  // Filter out any empty paragraphs
  return paragraphs.map(p => p.trim()).filter(p => p.length > 0);
}

async function runImport() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected.');

  const novel = await Novel.findOne({ title: { $regex: /forgotten field/i } });
  if (!novel) {
    console.error('Novel "The Forgotten Field" not found!');
    process.exit(1);
  }
  console.log(`Found novel: ${novel.title} (_id: ${novel._id}, current total_chapters: ${novel.total_chapters})`);

  const filePath = 'C:\\Users\\admin\\.gemini\\antigravity\\brain\\5487a710-4833-48dc-8f7a-2cfc6fd8d96d\\.user_uploaded\\media_1795521805924_9a104132.txt';
  const rawContent = fs.readFileSync(filePath, 'utf8');

  // Match all "chapter <number>" headers
  const chapterRegex = /(?:^|\n)chapter\s+(\d+)\s*(?:\r?\n|$)/gi;
  let markers = [];
  let match;
  while ((match = chapterRegex.exec(rawContent)) !== null) {
    markers.push({
      num: parseInt(match[1], 10),
      index: match.index,
      length: match[0].length
    });
  }

  console.log(`Extracted ${markers.length} chapter markers (Chapters ${markers[0].num} to ${markers[markers.length - 1].num}).`);

  let importedCount = 0;
  for (let i = 0; i < markers.length; i++) {
    const cur = markers[i];
    const nextIndex = (i + 1 < markers.length) ? markers[i + 1].index : rawContent.length;
    const rawChapterSlice = rawContent.substring(cur.index + cur.length, nextIndex);

    const paragraphs = cleanChapterToParagraphs(rawChapterSlice, cur.num);
    const wordCount = paragraphs.reduce((sum, p) => sum + p.split(/\s+/).length, 0);

    // Attempt upload to Cloudflare R2
    let r2Key = null;
    try {
      r2Key = await uploadChapterContent(novel._id.toString(), cur.num, paragraphs);
    } catch (r2Err) {
      console.warn(`R2 upload skipped for Ch ${cur.num}: ${r2Err.message}`);
    }

    // Upsert into Chapter collection
    await Chapter.findOneAndUpdate(
      { novel_id: novel._id, chapter_number: cur.num },
      {
        novel_id: novel._id,
        chapter_number: cur.num,
        title: `Chapter ${cur.num}`,
        content: paragraphs,
        r2_key: r2Key,
        is_locked: true,
        price: 10,
        tier: 'coin'
      },
      { upsert: true, new: true }
    );

    importedCount++;
    if (cur.num % 10 === 0 || cur.num === 276 || cur.num === 330) {
      console.log(`✓ Chapter ${cur.num} imported (${paragraphs.length} paragraphs, ~${wordCount} words, r2_key: ${r2Key ? 'OK' : 'none'})`);
    }
  }

  // Update novel metadata
  const newTotal = Math.max(novel.total_chapters || 0, 330);
  await Novel.updateOne(
    { _id: novel._id },
    {
      $set: {
        total_chapters: newTotal,
        updatedAt: new Date()
      }
    }
  );

  console.log(`\n Successfully imported ${importedCount} chapters (276 to 330) into "The Forgotten Field"!`);
  console.log(`Novel total_chapters updated to ${newTotal}, updatedAt touched to now.`);

  await mongoose.disconnect();
}

runImport().catch(err => {
  console.error('Fatal error during import:', err);
  process.exit(1);
});
