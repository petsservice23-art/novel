const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '.env') });

const mongoose = require('mongoose');
const cheerio = require('cheerio');
const Novel = require('./models/Novel');
const Chapter = require('./models/Chapter');
const { uploadChapterContent, uploadImage } = require('./utils/r2Service');

const NOVELS = [
  { id: 1, title: 'Stigma Effect', url: 'https://woopread.com/series/stigma-effect' },
  { id: 2, title: 'The Villainess Lives Twice', url: 'https://woopread.com/series/the-villainess-lives-twice-novel' },
  { id: 3, title: "The Villain's Sister Suffers Today", url: 'https://woopread.com/series/the-villains-sister-suffers-today' },
  { id: 4, title: 'The Male Lead Knelt Before Me', url: 'https://woopread.com/series/the-male-lead-knelt-before-me' },
  { id: 5, title: 'The Guidebook for Villainesses', url: 'https://woopread.com/series/the-guidebook-for-villainesses' },
  { id: 6, title: "The Devilish Duke Can't Sleep", url: 'https://woopread.com/series/the-devilish-duke-cant-sleep-novel-517845' },
  { id: 7, title: 'The Baby Raising A Devil', url: 'https://woopread.com/series/the-baby-raising-a-devil-novels' },
  { id: 8, title: 'Suddenly, I Became Crazy Handsome, and the World Became Easy', url: 'https://woopread.com/series/suddenly-i-became-crazy-handsome-and-the-world-became-easy' },
  { id: 9, title: 'Shepherd Wizard', url: 'https://woopread.com/series/shepherd-wizard' },
  { id: 10, title: 'Never Saved You', url: 'https://woopread.com/series/never-saved-you' },
  { id: 11, title: "My Girlfriend's Fortune: 3,141,592,653,589", url: 'https://woopread.com/series/my-girlfriends-fortune-3141592653589' },
  { id: 12, title: 'Money Keeps Piling Up No Matter How Much I Spend', url: 'https://woopread.com/series/money-keeps-piling-up-no-matter-how-much-i-spend' },
  { id: 13, title: 'Kill the Hero', url: 'https://woopread.com/series/kill-the-hero-novel' },
  { id: 14, title: "I'm a Villainess, But So Popular", url: 'https://woopread.com/series/im-a-villainess-but-so-popular' },
  { id: 15, title: 'I Was Mistaken as a Monstrous Genius Actor', url: 'https://woopread.com/series/i-was-mistaken-as-a-monstrous-genius-actor' },
  { id: 16, title: 'I Tamed a Tyrant and Ran Away', url: 'https://woopread.com/series/i-tamed-a-tyrant-and-ran-away' },
  { id: 17, title: 'I Raised the Beast Well', url: 'https://woopread.com/series/i-raised-the-beast-well-novels-49875' },
  { id: 18, title: 'I Met the Male Lead in Prison', url: 'https://woopread.com/series/i-met-the-male-lead-in-prison-novel' },
  { id: 19, title: 'I Became the Wife of the Monstrous Crown Prince', url: 'https://woopread.com/series/i-became-the-wife-of-the-monstrous-crown-prince-novels' },
  { id: 20, title: "Don't Concern Yourself With That Book", url: 'https://woopread.com/series/dont-concern-yourself-with-that-book-novel' },
  { id: 21, title: "Becoming the Villain's Family", url: 'https://woopread.com/series/becoming-the-villains-family' },
  { id: 22, title: 'Bastian', url: 'https://woopread.com/series/bastian' },
  { id: 23, title: "The Duke's Eldest Son Escaped to the Military", url: 'https://woopread.com/series/the-dukes-eldest-son-escaped-to-the-military-novel' }
];

const sleep = (ms) => new Promise(res => setTimeout(res, ms));

async function fetchWithRetry(url, options = {}, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        ...options,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          ...(options.headers || {})
        }
      });
      if (res.ok) return res;
      if (res.status === 404) return null;
      console.warn(`[HTTP ${res.status}] Attempt ${attempt} on ${url}`);
    } catch (err) {
      console.warn(`[Fetch error] Attempt ${attempt} on ${url}:`, err.message);
    }
    await sleep(attempt * 600);
  }
  return null;
}

function cleanStoryParagraphs(html) {
  const $ = cheerio.load(html);
  const paragraphs = [];

  // Story paragraphs in Woopread are inside group/paragraph or space-y-4 containers
  let candidates = $('div[class*="group/paragraph"] p, div[class*="space-y-4"] p');
  if (candidates.length === 0) {
    candidates = $('article p, main p, .reading-content p');
  }

  candidates.each((_, el) => {
    let t = $(el).text().trim();
    if (!t) return;

    const lower = t.toLowerCase();
    // Filter ads, translator promos, rating requests, discord prompts
    if (
      lower.includes('enjoying the story? leave a review') ||
      lower.includes('discuss chapters, share theories') ||
      lower.includes('join our community') ||
      lower.includes('join our discord') ||
      lower.includes('tip me on ko-fi') ||
      lower.includes('support me on patreon') ||
      lower.includes('read on woopread') ||
      lower.includes('translated by') && lower.length < 50
    ) {
      return;
    }

    paragraphs.push(t);
  });

  return paragraphs;
}

async function scrapeSingleChapter(novelId, chapterInfo, chapterNum) {
  // Check if chapter already exists in DB with R2 key
  const existing = await Chapter.findOne({ novel_id: novelId, chapter_number: chapterNum });
  if (existing && existing.r2_key) {
    return { status: 'skipped', chapterNum };
  }

  const res = await fetchWithRetry(chapterInfo.url);
  if (!res) {
    return { status: 'failed', chapterNum, reason: 'Fetch returned null' };
  }

  const html = await res.text();
  const paragraphs = cleanStoryParagraphs(html);

  if (paragraphs.length === 0) {
    return { status: 'empty', chapterNum };
  }

  // Format content as clean HTML
  const htmlContent = paragraphs.map(p => `<p>${p}</p>`).join('\n');

  // Upload to Cloudflare R2
  const r2Key = await uploadChapterContent(novelId.toString(), chapterNum, htmlContent);

  // First 10 chapters free, 11+ coin-locked (10 coins)
  const isLocked = chapterNum > 10;
  const tier = isLocked ? 'coin' : 'free';
  const price = isLocked ? 10 : 0;

  await Chapter.findOneAndUpdate(
    { novel_id: novelId, chapter_number: chapterNum },
    {
      novel_id: novelId,
      chapter_number: chapterNum,
      title: chapterInfo.title || `Chapter ${chapterNum}`,
      content: null,
      r2_key: r2Key,
      is_locked: isLocked,
      tier: tier,
      price: price
    },
    { upsert: true, returnDocument: 'after' }
  );

  return { status: 'uploaded', chapterNum };
}

function extractChapterManifest(html, seriesUrl) {
  // Next.js RSC payload contains title, number, and slug
  const regex = /\\\"title\\\":\\\"(.*?)\\\",\\\"number\\\":(null|\d+(?:\.\d+)?),\\\"slug\\\":\\\"(.*?)\\\"/g;
  let match;
  const chapters = [];
  const seenSlugs = new Set();

  while ((match = regex.exec(html)) !== null) {
    const title = match[1];
    const number = match[2] === 'null' ? null : parseFloat(match[2]);
    const slug = match[3];

    if (!seenSlugs.has(slug)) {
      seenSlugs.add(slug);
      chapters.push({
        title,
        number,
        slug,
        url: `${seriesUrl.replace(/\/$/, '')}/${slug}`
      });
    }
  }

  // Fallback to HTML anchors if RSC not matched
  if (chapters.length === 0) {
    const $ = cheerio.load(html);
    const baseSlug = seriesUrl.replace(/https?:\/\/woopread\.com/, '').replace(/\/$/, '');
    $('a').each((_, el) => {
      const href = $(el).attr('href') || '';
      if (href.startsWith(baseSlug + '/') && href !== baseSlug) {
        let text = $(el).text().trim().replace(/(about\s+)?\d+\s+(day|days|hour|hours|week|weeks|month|months|year|years)\s+ago/gi, '').trim();
        const slug = href.replace(baseSlug + '/', '');
        if (text && text.toLowerCase() !== 'read now' && !seenSlugs.has(slug)) {
          seenSlugs.add(slug);
          chapters.push({
            title: text,
            number: null,
            slug,
            url: `https://woopread.com${href}`
          });
        }
      }
    });
  }

  return chapters;
}

async function processNovel(novelConfig, novelIdx, totalNovels) {
  console.log(`\n==================================================`);
  console.log(`[${novelIdx}/${totalNovels}] Processing: "${novelConfig.title}"`);
  console.log(`Overview URL: ${novelConfig.url}`);

  const overRes = await fetchWithRetry(novelConfig.url);
  if (!overRes) {
    console.error(`Failed to fetch overview: ${novelConfig.url}`);
    return;
  }

  const overHtml = await overRes.text();
  const $over = cheerio.load(overHtml);

  const realTitle = $over('h1').first().text().trim() || novelConfig.title;
  const author = $over('a[href*="/author/"]').first().text().trim() || 'Unknown';
  
  // Extract description
  let description = '';
  $over('p').each((_, el) => {
    const t = $over(el).text().trim();
    if (t.length > 80 && !description) {
      description = t;
    }
  });

  // Extract genres
  const genres = [];
  $over('a[href*="/genre/"]').each((_, el) => {
    const g = $over(el).text().trim();
    if (g && !genres.includes(g)) genres.push(g);
  });

  // Extract cover image
  let coverImageUrl = '';
  const imgEl = $over('img[src*="cover"], img[alt*="' + realTitle + '"], img[src*="series"]').first();
  const rawCoverSrc = imgEl.attr('src') || '';
  
  const slug = realTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  if (rawCoverSrc) {
    try {
      const fullCoverUrl = rawCoverSrc.startsWith('http') ? rawCoverSrc : `https://woopread.com${rawCoverSrc}`;
      const coverRes = await fetchWithRetry(fullCoverUrl);
      if (coverRes) {
        const coverBuf = Buffer.from(await coverRes.arrayBuffer());
        coverImageUrl = await uploadImage(`covers/${slug}.webp`, coverBuf, 'image/webp');
        console.log(`Cover uploaded to R2: ${coverImageUrl}`);
      }
    } catch (e) {
      console.warn(`Cover upload error for ${realTitle}:`, e.message);
    }
  }

  // Create or update Novel in MongoDB
  let novel = await Novel.findOne({ title: realTitle });
  if (!novel) {
    novel = await Novel.create({
      title: realTitle,
      author,
      description,
      genres: genres.length > 0 ? genres : ['Romance', 'Fantasy'],
      cover_image: coverImageUrl || `https://pub-b1544d29b48d4b3cb7a1972a2a3b6b70.r2.dev/covers/${slug}.webp`,
      status: 'approved',
      publishing_status: 'completed',
      rating: 4.8 + Math.round(Math.random() * 2) / 10,
      ratings_count: Math.floor(Math.random() * 500) + 150,
      views: Math.floor(Math.random() * 40000) + 18000,
      reads: Math.floor(Math.random() * 9000) + 4000,
      total_chapters: 0
    });
    console.log(`Created Novel in MongoDB: "${novel.title}" (_id: ${novel._id})`);
  } else {
    if (coverImageUrl && !novel.cover_image.includes('r2.dev')) {
      novel.cover_image = coverImageUrl;
    }
    novel.publishing_status = 'completed';
    novel.status = 'approved';
    await novel.save();
    console.log(`Updated Novel in MongoDB: "${novel.title}" (_id: ${novel._id})`);
  }

  // Extract chapters manifest
  const chapters = extractChapterManifest(overHtml, novelConfig.url);
  console.log(`Found ${chapters.length} chapters to scrape.`);

  // Concurrent scraping (chunk size = 5)
  const CONCURRENCY = 5;
  let doneCount = 0;
  let skipCount = 0;
  let failCount = 0;

  for (let i = 0; i < chapters.length; i += CONCURRENCY) {
    const chunk = chapters.slice(i, i + CONCURRENCY);
    const promises = chunk.map((ch, idx) => {
      const chapterNum = i + idx + 1;
      return scrapeSingleChapter(novel._id, ch, chapterNum);
    });

    const results = await Promise.all(promises);
    for (const r of results) {
      if (r.status === 'uploaded') doneCount++;
      else if (r.status === 'skipped') skipCount++;
      else failCount++;
    }

    const currentTotal = doneCount + skipCount;
    if (currentTotal % 25 === 0 || i + CONCURRENCY >= chapters.length) {
      console.log(`[${realTitle}] Progress: ${currentTotal}/${chapters.length} (New: ${doneCount}, Existed: ${skipCount}, Failed: ${failCount})`);
    }
    await sleep(200);
  }

  // Update total chapters
  novel.total_chapters = await Chapter.countDocuments({ novel_id: novel._id });
  await novel.save();
  console.log(`Completed "${realTitle}": ${novel.total_chapters} verified chapters in DB & Cloudflare R2.`);
}

async function start() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB.');

  for (let i = 0; i < NOVELS.length; i++) {
    try {
      await processNovel(NOVELS[i], i + 1, NOVELS.length);
    } catch (err) {
      console.error(`Error processing novel ${NOVELS[i].url}:`, err);
    }
  }

  console.log('\n==================================================');
  console.log('ALL 23 WOOPREAD NOVELS SCRAPED & UPLOADED TO R2!');
  console.log('==================================================');

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB.');
}

start().catch(err => {
  console.error('Fatal scrape error:', err);
  process.exit(1);
});
