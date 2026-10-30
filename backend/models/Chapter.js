const mongoose = require('mongoose');

const chapterSchema = new mongoose.Schema({
  novel_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Novel', required: true },
  chapter_number: { type: Number, required: true },
  title: { type: String, required: true },
  content: { type: mongoose.Schema.Types.Mixed }, // Stores either array of paragraphs or compressed HTML string
  r2_key: { type: String, default: null }, // Cloudflare R2 object key
  is_locked: { type: Boolean, default: false },
  price: { type: Number, default: 0 }, // Price in coins
  tier: { type: String, enum: ['free', 'coin', 'paid'], default: 'free' }
}, { timestamps: true });

module.exports = mongoose.model('Chapter', chapterSchema);
