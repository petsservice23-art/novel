require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const Novel = require('../models/Novel');

function slugify(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/['’]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function migrateSlugs() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to database.');

  const novels = await Novel.find();
  console.log(`Found ${novels.length} novels to check for slugs.`);

  const usedSlugs = new Set();

  // First pass: register any slugs that already exist
  for (const novel of novels) {
    if (novel.slug) {
      usedSlugs.add(novel.slug);
    }
  }

  let updatedCount = 0;
  let skippedCount = 0;

  for (const novel of novels) {
    if (novel.slug) {
      skippedCount++;
      continue;
    }

    let baseSlug = slugify(novel.title) || `novel-${novel._id.toString().slice(-6)}`;
    let candidateSlug = baseSlug;
    let counter = 1;

    while (usedSlugs.has(candidateSlug)) {
      counter++;
      candidateSlug = `${baseSlug}-${counter}`;
    }

    usedSlugs.add(candidateSlug);
    novel.slug = candidateSlug;
    await Novel.updateOne({ _id: novel._id }, { $set: { slug: candidateSlug } });
    updatedCount++;
    console.log(`[${updatedCount}/${novels.length}] "${novel.title}" -> "${candidateSlug}"`);
  }

  console.log(`\nMigration Complete:`);
  console.log(`- Updated: ${updatedCount} novels with new unique slugs`);
  console.log(`- Already had slugs: ${skippedCount} novels`);

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB.');
}

migrateSlugs().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
