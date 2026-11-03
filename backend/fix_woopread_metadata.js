const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '.env') });

const mongoose = require('mongoose');
const cheerio = require('cheerio');
const Novel = require('./models/Novel');

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

async function updateMetadata(nConfig, idx) {
  try {
    console.log(`[${idx}/${NOVELS.length}] Fetching metadata for: "${nConfig.title}"`);
    const res = await fetch(nConfig.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!res.ok) {
      console.warn(`Failed to fetch ${nConfig.url}: HTTP ${res.status}`);
      return;
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    const realTitle = $('h1').first().text().trim() || nConfig.title;

    // 1. Alternative Titles & Korean Name (directly following h1)
    let altTitle = $('h1').next().text().trim() || '';
    if (altTitle.startsWith('4.') || altTitle.startsWith('5.') || altTitle.includes('chapters')) {
      // Sometimes there are no alt titles, next sibling is rating
      altTitle = '';
    }

    // 2. Author Name
    let author = '';
    $('div, span, p, a').each((_, el) => {
      const text = $(el).clone().children().remove().end().text().trim();
      if (text === 'Author:' || text === 'Author') {
        const next = $(el).next().text().trim();
        const parent = $(el).parent().text().replace(/^Author:\s*/i, '').trim();
        author = next || parent;
      }
    });

    if (!author) {
      // Fallback regex in HTML
      const match = html.match(/Author:\s*([^<\n\r]+)/i);
      if (match) author = match[1].trim();
    }

    // 3. Description / Synopsis
    let description = '';
    $('*').each((_, el) => {
      const t = $(el).text().trim();
      if (t === 'Description' || t === 'Synopsis') {
        const nextText = $(el).next().text().trim();
        if (nextText.length > 50) {
          description = nextText;
        } else {
          const parentText = $(el).parent().text().replace(/^(Description|Synopsis)\s*/i, '').trim();
          if (parentText.length > 50) {
            description = parentText;
          }
        }
      }
    });

    // 4. Publish year (check if present in description or metadata)
    let year = '';
    const yearMatch = html.match(/\b(19\d\d|20[0-2]\d)\b/);
    // Only assign year if explicitly noted as year or publication
    const pubYearMatch = html.match(/(?:published|release|year|aired)\s*[:\-]?\s*(\d{4})/i);
    if (pubYearMatch) {
      year = pubYearMatch[1];
    }

    // Find novel in MongoDB (by real title or config title or regex)
    const query = {
      $or: [
        { title: realTitle },
        { title: nConfig.title },
        { title: new RegExp(nConfig.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }
      ]
    };

    const doc = await Novel.findOne(query);
    if (!doc) {
      console.warn(`Novel not found in DB: "${realTitle}" / "${nConfig.title}"`);
      return;
    }

    if (author) doc.author = author;
    if (altTitle) doc.alternative_titles = altTitle;
    if (description) doc.description = description;
    if (year) doc.published_year = year;
    doc.publishing_status = 'completed';

    await doc.save();

    console.log(`Updated "${doc.title}":`);
    console.log(`   Author: "${doc.author}"`);
    console.log(`   Alt/Korean Titles: "${doc.alternative_titles}"`);
    console.log(`   Year: "${doc.published_year || 'N/A'}"`);
    console.log(`   Synopsis length: ${doc.description ? doc.description.length : 0} chars`);
    console.log(`   Synopsis preview: "${doc.description ? doc.description.substring(0, 80) : ''}..."\n`);
  } catch (err) {
    console.error(`Error processing ${nConfig.title}:`, err.message);
  }
}

async function start() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB.\n');

  for (let i = 0; i < NOVELS.length; i++) {
    await updateMetadata(NOVELS[i], i + 1);
    await sleep(200);
  }

  console.log('All 23 novels updated with complete metadata!');
  await mongoose.disconnect();
}

start().catch(console.error);
