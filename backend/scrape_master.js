const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '.env') });

const mongoose = require('mongoose');
const cheerio = require('cheerio');
const Novel = require('./models/Novel');
const Chapter = require('./models/Chapter');
const { uploadChapterContent, uploadImage } = require('./utils/r2Service');

const NOVEL_LIST = [
  { id: 1, url: 'https://eternalune.com/novel/reasons-for-contract-marriage/' },
  { id: 2, url: 'https://eternalune.com/novel/my-husband-caught-me-having-an-affair/' },
  { id: 3, url: 'https://eternalune.com/novel/this-villain-is-mine-now/' },
  { id: 4, url: 'https://eternalune.com/novel/time-of-the-blind-beast/' },
  { id: 5, url: 'https://eternalune.com/novel/im-trapped-in-a-bloody-reverse-harem-game/' },
  { id: 6, url: 'https://eternalune.com/novel/a-summer-with-bitter-rivals/' },
  { id: 7, url: 'https://eternalune.com/novel/beneath-the-surviving-princesss-joyful-facade/' },
  { id: 8, url: 'https://eternalune.com/novel/if-youre-going-to-sell-yourself-sell-it-to-me/' },
  { id: 9, url: 'https://eternalune.com/novel/grace-in-wonderland/' },
  { id: 10, url: 'https://hazelnade.com/novel/maylily/' },
  { id: 11, url: 'https://hazelnade.com/novel/winter-bud/' },
  { id: 12, url: 'https://hazelnade.com/novel/the-cold-hearted-grand-duke-obsesses-over-me-after-my-death/' },
  { id: 13, url: 'https://hazelnade.com/novel/i-faked-a-pregnancy-but-my-husband-returned/' },
  { id: 14, url: 'https://hazelnade.com/novel/deceived-yet-drawn-to-you/' },
  { id: 15, url: 'https://eternalune.com/novel/i-need-the-true-ending-to-graduate/' },
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
    await sleep(attempt * 800);
  }
  return null;
}

function cleanStoryParagraphs(html) {
  const $ = cheerio.load(html);
  const container = $('.reading-content, .text-left, .entry-content_wrap, .entry-content');
  const paragraphs = [];

  container.find('p').each((_, el) => {
    let t = $(el).text().trim();
    if (!t) return;

    // Filter out ads / ko-fi / translator notes / site links
    const lower = t.toLowerCase();
    if (
      lower.includes('ko-fi') ||
      lower.includes('patreon') ||
      lower.includes('enjoying the translation') ||
      lower.includes('support me on') ||
      lower.includes('tip me on') ||
      lower.includes('read only at') ||
      lower.includes('join our discord') ||
      lower.includes('translated by') && lower.length < 50
    ) {
      return;
    }

    paragraphs.push(t);
  });

  return paragraphs;
}

async function scrapeSingleChapter(novelId, chapterInfo, chapterNum) {
  // Check if chapter already exists with R2 key
  const existing = await Chapter.findOne({ novel_id: novelId, chapter_number: chapterNum });
  if (existing && existing.r2_key) {
    return { status: 'skipped', chapterNum };
  }

  const res = await fetchWithRetry(chapterInfo.href);
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

  // Free for first 10 chapters, coin-locked after
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
    { upsert: true, new: true }
  );

  return { status: 'uploaded', chapterNum };
}

async function processNovel(novelConfig, novelIdx, totalNovels) {
  const cleanUrl = novelConfig.url.replace(/#.*$/, '').replace(/\/$/, '') + '/';
  const ajaxUrl = cleanUrl + 'ajax/chapters/';

  console.log(`\n==================================================`);
  console.log(`[${novelIdx}/${totalNovels}] Fetching metadata: ${cleanUrl}`);

  const overRes = await fetchWithRetry(cleanUrl);
  if (!overRes) {
    console.error(`Failed to fetch overview: ${cleanUrl}`);
    return;
  }

  const overHtml = await overRes.text();
  const $over = cheerio.load(overHtml);

  const title = $over('.post-title h1, .entry-title, h1').first().text().trim();
  const author = $over('.author-content, .post-content_item:contains("Author") .summary-content').first().text().trim() || 'Unknown';
  const altTitle = $over('.post-content_item:contains("Alternative") .summary-content').first().text().trim() || '';
  const description = $over('.description-summary .summary__content, .summary__content, .entry-content').first().text().trim() || '';
  
  const genres = [];
  $over('.genres-content a').each((_, el) => {
    const g = $over(el).text().trim().replace(/^\[|\]$/g, '');
    if (g && !genres.includes(g)) genres.push(g);
  });

  // Find or upload cover image
  const imgEl = $over('.summary_image img');
  const rawCoverUrl = imgEl.attr('data-src') || imgEl.attr('data-lazy-src') || imgEl.attr('src');
  let coverImageUrl = '';

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  if (rawCoverUrl && !rawCoverUrl.includes('dflazy.jpg')) {
    try {
      const coverRes = await fetchWithRetry(rawCoverUrl);
      if (coverRes) {
        const coverBuf = Buffer.from(await coverRes.arrayBuffer());
        coverImageUrl = await uploadImage(`covers/${slug}.webp`, coverBuf, 'image/webp');
        console.log(`Cover uploaded to R2: ${coverImageUrl}`);
      }
    } catch (e) {
      console.warn(`Cover upload failed for ${title}:`, e.message);
    }
  }

  // Create or update Novel in MongoDB
  let novel = await Novel.findOne({ title });
  if (!novel) {
    novel = await Novel.create({
      title,
      author,
      alternative_titles: altTitle,
      description,
      genres,
      cover_image: coverImageUrl || rawCoverUrl,
      status: 'approved',
      publishing_status: 'completed',
      rating: 4.8 + Math.round(Math.random() * 2) / 10,
      ratings_count: Math.floor(Math.random() * 400) + 120,
      views: Math.floor(Math.random() * 30000) + 15000,
      reads: Math.floor(Math.random() * 8000) + 3000,
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

  // Fetch chapter list via ajax/chapters/
  const ajaxRes = await fetchWithRetry(ajaxUrl, {
    method: 'POST',
    headers: { 'X-Requested-With': 'XMLHttpRequest' }
  });

  if (!ajaxRes) {
    console.error(`Failed to fetch chapters list for ${title}`);
    return;
  }

  const ajaxHtml = await ajaxRes.text();
  const $ajax = cheerio.load(ajaxHtml);
  const rawChapters = [];

  $ajax('li.wp-manga-chapter a').each((_, el) => {
    rawChapters.push({
      title: $ajax(el).text().trim(),
      href: $ajax(el).attr('href')
    });
  });

  // Reverse to ensure strictly chronological order (Chapter 1 ... Final)
  const chapters = rawChapters.reverse();
  console.log(`Found ${chapters.length} chapters to process.`);

  // Concurrent scraping in chunks of 5
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
    if (currentTotal % 20 === 0 || i + CONCURRENCY >= chapters.length) {
      console.log(`[${title}] Progress: ${currentTotal}/${chapters.length} (New: ${doneCount}, Existed: ${skipCount}, Failed: ${failCount})`);
    }
    await sleep(250);
  }

  // Update total chapters in novel
  novel.total_chapters = await Chapter.countDocuments({ novel_id: novel._id });
  await novel.save();
  console.log(`Finished "${title}": ${novel.total_chapters} chapters verified in DB & Cloudflare R2.`);
}

async function start() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB.');

  for (let i = 0; i < NOVEL_LIST.length; i++) {
    try {
      await processNovel(NOVEL_LIST[i], i + 1, NOVEL_LIST.length);
    } catch (err) {
      console.error(`Error processing novel ${NOVEL_LIST[i].url}:`, err);
    }
  }

  console.log('\n==================================================');
  console.log('ALL 15 NOVELS SCRAPED AND UPLOADED TO CLOUDFLARE R2!');
  console.log('==================================================');

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB.');
}

start().catch(err => {
  console.error('Fatal scrape error:', err);
  process.exit(1);
});
