const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const https = require('https');
const Novel = require('./models/Novel');

dotenv.config();

const downloadImage = (url, filepath, retries = 3) => {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: 10000 }, (res) => {
      if (res.statusCode === 200) {
        const stream = fs.createWriteStream(filepath);
        res.pipe(stream);
        stream.on('finish', () => resolve(true));
        stream.on('error', (err) => reject(err));
      } else if (res.statusCode === 301 || res.statusCode === 302) {
        downloadImage(res.headers.location, filepath, retries).then(resolve).catch(reject);
      } else {
        res.resume();
        reject(new Error(`Status Code: ${res.statusCode}`));
      }
    });

    req.on('error', (err) => reject(err));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  }).catch(async (err) => {
    if (retries > 0) {
      console.log(`Retrying... (${retries} left)`);
      await new Promise(r => setTimeout(r, 2000));
      return downloadImage(url, filepath, retries - 1);
    } else {
      throw err;
    }
  });
};

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const novels = await Novel.find({});
    const coversDir = path.join(__dirname, '../frontend/public/covers');
    if (!fs.existsSync(coversDir)) fs.mkdirSync(coversDir, { recursive: true });

    let count = 0;
    // Process sequentially to be nice to the API
    for (const novel of novels) {
      const filename = `${novel._id}.jpg`;
      const filepath = path.join(coversDir, filename);

      // Skip if valid file exists
      if (fs.existsSync(filepath) && fs.statSync(filepath).size > 1000) {
        console.log(`Skipping ${novel.title}, already exists.`);
        novel.cover_image = `/covers/${filename}`;
        await novel.save();
        count++;
        continue;
      }

      console.log(`Downloading cover for: ${novel.title}`);
      try {
        const prompt = `Korean manhwa cover art for romance fantasy novel, beautiful highly detailed anime style, ${novel.title}`;
        const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=400&height=600&nologo=true`;
        
        await downloadImage(url, filepath, 2);
      } catch (err) {
        console.log(`Pollinations failed for ${novel.title}, using fallback...`);
        try {
          await downloadImage(`https://picsum.photos/seed/${novel._id}/400/600`, filepath, 2);
        } catch (e) {
          console.error(`Fallback failed for ${novel.title}.`);
          continue;
        }
      }

      novel.cover_image = `/covers/${filename}`;
      await novel.save();
      count++;
      
      // Delay to avoid hitting rate limits
      await new Promise(r => setTimeout(r, 1000));
    }

    console.log(`Successfully generated ${count}/${novels.length} covers.`);
    process.exit(0);
  } catch (e) {
    console.error('Script failed:', e);
    process.exit(1);
  }
};

run();
