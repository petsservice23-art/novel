const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const https = require('https');
const Novel = require('./models/Novel');

dotenv.config();

const downloadImage = (url, filepath) => {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: 8000 }, (res) => {
      if (res.statusCode === 200) {
        res.pipe(fs.createWriteStream(filepath))
           .on('error', reject)
           .once('close', () => resolve(filepath));
      } else if (res.statusCode === 301 || res.statusCode === 302) {
        downloadImage(res.headers.location, filepath).then(resolve).catch(reject);
      } else {
        res.resume();
        reject(new Error(`Request Failed With a Status Code: ${res.statusCode}`));
      }
    }).on('error', reject)
      .on('timeout', () => {
        req.destroy();
        reject(new Error('Request timed out'));
      });
  });
};

const chunkArray = (array, size) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

const generateCovers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for downloading covers...");

    const novels = await Novel.find({});
    
    // Create covers directory in frontend/public if it doesn't exist
    const coversDir = path.join(__dirname, '../frontend/public/covers');
    if (!fs.existsSync(coversDir)) {
      fs.mkdirSync(coversDir, { recursive: true });
    }

    let totalProcessed = 0;
    
    for (const novel of novels) {
      const filename = `${novel._id}.jpg`;
      const filepath = path.join(coversDir, filename);
      
      let success = false;
      let retries = 3;
      
      while (!success && retries > 0) {
        try {
          const prompt = `Korean manhwa cover art for romance fantasy novel, beautiful highly detailed anime style, ${novel.title}`;
          const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=400&height=600&nologo=true`;
          
          if (!fs.existsSync(filepath) || fs.statSync(filepath).size < 1000) {
             console.log(`Downloading ${novel.title}...`);
             await downloadImage(url, filepath);
          } else {
             console.log(`Skipping ${novel.title}, already exists.`);
          }
          
          novel.cover_image = `/covers/${filename}`;
          await novel.save();
          success = true;
        } catch (err) {
          console.error(`Failed to download for ${novel.title} (retries left: ${retries - 1}):`, err.message);
          retries--;
          if (retries > 0) {
            console.log("Waiting 3 seconds before retry...");
            await new Promise(r => setTimeout(r, 3000));
          }
        }
      }
      
      totalProcessed++;
      if (totalProcessed % 10 === 0) console.log(`Finished ${totalProcessed}/${novels.length} covers...`);
      
      // Be polite to the API
      await new Promise(r => setTimeout(r, 1500));
    }

    console.log("All covers generated and saved locally successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error generating covers:", error);
    process.exit(1);
  }
};

generateCovers();
