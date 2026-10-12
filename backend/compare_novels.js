const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const Novel = require('./models/Novel');

dotenv.config();

async function run() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);

    // 1. Get the list of novels from the JSON target list (Ownverso list)
    const novelsDataPath = 'C:\\Users\\admin\\.gemini\\antigravity\\brain\\5487a710-4833-48dc-8f7a-2cfc6fd8d96d\\scratch\\novelsData.json';
    
    let ownversoNovels = [];
    if (fs.existsSync(novelsDataPath)) {
      ownversoNovels = JSON.parse(fs.readFileSync(novelsDataPath, 'utf8'));
    } else {
      console.log("Could not find novelsData.json");
      process.exit(1);
    }
    
    // As per the script, 5 novels were manually added. Let's add them to the master list.
    const missingNovels = [
      { title: "The Search for the Duchess's Husband", chaptersCount: 185 },
      { title: "The Scandal Maker Has Returned", chaptersCount: 209 },
      { title: "Vivian’s Circumstances", chaptersCount: 124 },
      { title: "The Youngest Hides a Lot", chaptersCount: 291 },
      { title: "Windburg", chaptersCount: 184 }
    ];
    missingNovels.forEach(mn => {
      if (!ownversoNovels.some(n => n.title.toLowerCase() === mn.title.toLowerCase())) {
        ownversoNovels.push(mn);
      }
    });

    const targetTitles = ownversoNovels.map(n => n.title.toLowerCase().trim());

    // 2. Get the list of novels we actually have in the Database
    const dbNovels = await Novel.find({});
    const dbTitles = dbNovels.map(n => n.title.toLowerCase().trim());

    // 3. Find missing (In Ownverso list, but not in DB)
    const missingFromDB = ownversoNovels.filter(n => !dbTitles.includes(n.title.toLowerCase().trim()));

    // 4. Find extra (In DB, but not in Ownverso list - like Under the Oak Tree if it was seeded separately)
    const extraInDB = dbNovels.filter(n => !targetTitles.includes(n.title.toLowerCase().trim()));

    // Create a report
    let report = `# Novel Comparison Report: Ownverso vs Novelverse\n\n`;
    
    report += `### Summary\n`;
    report += `- Total Novels Targeted (Ownverso List): **${ownversoNovels.length}**\n`;
    report += `- Total Novels in Database (Novelverse): **${dbNovels.length}**\n\n`;

    report += `### ❌ Novels Missing from Database (We don't have them)\n`;
    if (missingFromDB.length === 0) {
      report += `*Great news! You have every single novel from the Ownverso list in your database.*\n`;
    } else {
      missingFromDB.forEach(n => {
        report += `- **${n.title}** (Expected: ${n.chaptersCount} chapters)\n`;
      });
    }

    report += `\n### ➕ Extra Novels in Database (Not in original Ownverso target list)\n`;
    if (extraInDB.length === 0) {
      report += `*None.*\n`;
    } else {
      extraInDB.forEach(n => {
        report += `- **${n.title}** (Has ${n.total_chapters} chapters)\n`;
      });
    }

    fs.writeFileSync('C:\\Users\\admin\\.gemini\\antigravity\\brain\\5487a710-4833-48dc-8f7a-2cfc6fd8d96d\\novel_comparison_report.md', report);
    
    console.log("Report generated successfully!");
    process.exit(0);

  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

run();
