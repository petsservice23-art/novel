const mongoose = require('mongoose');
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();

const Novel = require('./models/Novel');
const Chapter = require('./models/Chapter');

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB, analyzing chapters...');

    const novels = await Novel.find().sort({ title: 1 });
    
    let report = `# Complete Novel Chapter Breakdown\n\n`;
    report += `Here is the detailed breakdown of all 116 novels, showing the total chapters, how many are free, how many are locked, and how many contain the generated placeholder text.\n\n`;
    report += `| Novel Title | Total Chapters | Free Chapters | Locked Chapters | Placeholders |\n`;
    report += `|-------------|----------------|---------------|-----------------|--------------|\n`;

    let totalOverall = 0;
    let totalFree = 0;
    let totalLocked = 0;
    let totalPlaceholders = 0;

    for (const novel of novels) {
      const chapters = await Chapter.find({ novel_id: novel._id });
      
      let free = 0;
      let locked = 0;
      let placeholders = 0;

      for (const ch of chapters) {
        if (ch.is_locked) {
          locked++;
        } else {
          free++;
        }

        // Check for placeholder text signature
        // Content might be an array (pre-compression) or a single string (post-compression)
        const contentStr = Array.isArray(ch.content) ? ch.content.join(' ') : (ch.content || '');
        
        // The procedural generator in bulk_scrape_ownverso.js used these strings:
        if (
          contentStr.includes('locked on ownverso.me') || 
          contentStr.includes('The journey continues as the characters') ||
          contentStr.includes('This premium chapter is locked')
        ) {
          placeholders++;
        }
      }

      report += `| ${novel.title} | ${chapters.length} | ${free} | ${locked} | ${placeholders} |\n`;
      
      totalOverall += chapters.length;
      totalFree += free;
      totalLocked += locked;
      totalPlaceholders += placeholders;
    }

    report += `| **TOTALS** | **${totalOverall}** | **${totalFree}** | **${totalLocked}** | **${totalPlaceholders}** |\n`;

    const outputPath = 'C:\\Users\\admin\\.gemini\\antigravity\\brain\\5487a710-4833-48dc-8f7a-2cfc6fd8d96d\\novel_chapter_stats.md';
    fs.writeFileSync(outputPath, report);
    
    console.log('Successfully generated report!');
    process.exit(0);

  } catch (err) {
    console.error('Error generating report:', err);
    process.exit(1);
  }
}

run();
