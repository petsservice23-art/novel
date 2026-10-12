const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const https = require('https');
const { Jimp } = require('jimp');
const Novel = require('./models/Novel');

dotenv.config();

const downloadImageBuffer = (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, { timeout: 8000 }, (res) => {
      if (res.statusCode === 200) {
        const data = [];
        res.on('data', (chunk) => data.push(chunk));
        res.on('end', () => resolve(Buffer.concat(data)));
        res.on('error', reject);
      } else if (res.statusCode === 301 || res.statusCode === 302) {
        downloadImageBuffer(res.headers.location).then(resolve).catch(reject);
      } else {
        res.resume();
        reject(new Error(`Status Code: ${res.statusCode}`));
      }
    }).on('error', reject).on('timeout', () => reject(new Error('Timeout')));
  });
};

const generateCover = async (novel, coversDir) => {
  const filename = `${novel._id}.jpg`;
  const filepath = path.join(coversDir, filename);
  
  if (fs.existsSync(filepath) && fs.statSync(filepath).size > 1000) {
    console.log(`Skipping ${novel.title}, already exists.`);
    novel.cover_image = `/covers/${filename}`;
    await novel.save();
    return true;
  }

  console.log(`Generating cover for: ${novel.title}`);
  
  try {
    // Try pollinations, fallback to picsum
    let buffer;
    try {
      const prompt = `Korean manhwa cover art for romance fantasy novel, beautiful highly detailed anime style, ${novel.title}`;
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=400&height=600&nologo=true`;
      buffer = await downloadImageBuffer(url);
    } catch (e) {
      console.log(`Pollinations failed for ${novel.title}, using fallback.`);
      buffer = await downloadImageBuffer(`https://picsum.photos/seed/${novel._id}/400/600`);
    }

    // Load into Jimp
    const image = await Jimp.read(buffer);
    image.resize({ w: 400, h: 600 });
    
    // Create a dark gradient overlay at the bottom for text readability
    image.scan(0, 400, 400, 200, function(x, y, idx) {
      const opacity = ((y - 400) / 200) * 0.85; // up to 85% opacity
      this.bitmap.data[idx + 0] = Math.floor(this.bitmap.data[idx + 0] * (1 - opacity));
      this.bitmap.data[idx + 1] = Math.floor(this.bitmap.data[idx + 1] * (1 - opacity));
      this.bitmap.data[idx + 2] = Math.floor(this.bitmap.data[idx + 2] * (1 - opacity));
      // alpha (idx+3) remains unchanged
    });

    // Load font and draw text
    const font = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
    image.print({
      font: font,
      x: 20,
      y: 450,
      text: novel.title,
      maxWidth: 360,
      maxHeight: 130,
      alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
      alignmentY: Jimp.VERTICAL_ALIGN_BOTTOM
    });

    await image.write(filepath);
    
    novel.cover_image = `/covers/${filename}`;
    await novel.save();
    return true;
  } catch (err) {
    console.error(`Error processing ${novel.title}:`, err.message);
    return false;
  }
};

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const novels = await Novel.find({});
    const coversDir = path.join(__dirname, '../frontend/public/covers');
    if (!fs.existsSync(coversDir)) fs.mkdirSync(coversDir, { recursive: true });

    let count = 0;
    for (const novel of novels) {
      await generateCover(novel, coversDir);
      count++;
      if (count % 10 === 0) console.log(`${count}/${novels.length} covers generated.`);
    }

    console.log("Finished generating all covers with text!");
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

run();
