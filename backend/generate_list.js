const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const Novel = require('./models/Novel');
const Chapter = require('./models/Chapter');

dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const novels = await Novel.find({}).sort({ title: 1 });
    
    let markdown = `# Novel Sourcing & Status Report\n\n`;
    markdown += `Below is the list of all ${novels.length} novels in your database, their total chapters, and the recommended sites to find their complete free or raw versions.\n\n`;
    markdown += `| No. | Title | Chapters | Status | Free English Sources | Raw Sources (KR/CN) |\n`;
    markdown += `|---|---|---|---|---|---|\n`;

    for (let i = 0; i < novels.length; i++) {
      const n = novels[i];
      // Estimate sources based on title
      const searchTitle = encodeURIComponent(n.title);
      const englishSources = `[NovelBin](https://novelbin.com/search?keyword=${searchTitle}), [LightNovelPub](https://www.lightnovelpub.com/search?keyword=${searchTitle})`;
      const rawSources = `[BookToki (KR)](https://booktoki.com), [69shu (CN)](https://69shu.com)`;
      
      markdown += `| ${i+1} | **${n.title}** | ${n.total_chapters || 0} | ${n.publishing_status || 'Ongoing'} | ${englishSources} | ${rawSources} |\n`;
    }

    const artifactPath = path.join(__dirname, '../..', '.gemini/antigravity/brain/5487a710-4833-48dc-8f7a-2cfc6fd8d96d/novel_sourcing_list.md');
    
    // We will save it to the scratch folder if the brain folder isn't easily accessible, but actually I can just output it to the frontend public folder temporarily or scratch folder.
    // Wait, the agent has a built-in artifact mechanism. I'll just write it to the brain directory.
    // Actually, I'll write it to scratch/novel_sourcing_list.md
    
    fs.writeFileSync('novel_sourcing_list.md', markdown);
    console.log("List generated successfully at novel_sourcing_list.md");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
