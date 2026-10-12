const mongoose = require('mongoose');

const novelSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  author: { type: String, default: '' },
  cover_image: { type: String, default: '' },
  author_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  genres: [{ type: String }],
  tags: [{ type: String }],
  total_chapters: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  ratings_count: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  reads: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
  publishing_status: { type: String, enum: ['ongoing', 'completed', 'hiatus'], default: 'ongoing' },
  alternative_titles: { type: String, default: '' },
  published_year: { type: String, default: '' }
}, { timestamps: true });

// Text indexing for search
novelSchema.index({ title: 'text', genres: 'text', tags: 'text' });

module.exports = mongoose.model('Novel', novelSchema);
