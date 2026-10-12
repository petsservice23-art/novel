const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Novel = require('./models/Novel');
const Chapter = require('./models/Chapter');

dotenv.config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const novels = await Novel.find({}).lean();
    const stats = await Chapter.aggregate([
      { $group: {
          _id: '$novel_id',
          total: { $sum: 1 },
          free: { $sum: { $cond: [{ $eq: ['$is_locked', false] }, 1, 0] } },
          locked: { $sum: { $cond: [{ $eq: ['$is_locked', true] }, 1, 0] } },
          ch1Free: { $sum: { $cond: [{ $and: [{ $eq: ['$chapter_number', 1] }, { $eq: ['$is_locked', false] }] }, 1, 0] } }
        }
      }
    ]);
    const map = {};
    stats.forEach(s => { map[s._id.toString()] = s; });

    const doneProperly = [];
    for (const n of novels) {
      const s = map[n._id.toString()];
      if (s && s.total === n.total_chapters && s.ch1Free > 0) {
        doneProperly.push({ title: n.title, expected: n.total_chapters, actual: s.total, free: s.free, locked: s.locked });
      }
    }

    console.log('DONE PROPERLY NOVELS (' + doneProperly.length + '):');
    doneProperly.forEach((n, i) => console.log(`${i+1}. "${n.title}" | ${n.actual}/${n.expected} chapters (${n.free} free, ${n.locked} locked)`));

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
