const mongoose = require('mongoose');

function slugify(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/['’]/g, '') // Remove apostrophes e.g. Reader's -> Readers
    .replace(/[^\w\s-]/g, '') // Remove non-word characters except spaces and hyphens
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with a single hyphen
    .replace(/^-+|-+$/g, ''); // Trim leading and trailing hyphens
}

const novelSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, unique: true, sparse: true, index: true },
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
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'hidden'], default: 'approved' },
  is_hidden: { type: Boolean, default: false },
  publishing_status: { type: String, enum: ['ongoing', 'completed', 'hiatus'], default: 'ongoing' },
  alternative_titles: { type: String, default: '' },
  published_year: { type: String, default: '' }
}, { timestamps: true });

// Pre-save hook: Auto-generate unique slug if not provided or title changed
novelSchema.pre('save', async function (next) {
  if (!this.slug || this.isModified('title')) {
    let baseSlug = slugify(this.title) || 'novel';
    let candidateSlug = baseSlug;
    let count = 1;
    while (true) {
      const existing = await this.constructor.findOne({
        slug: candidateSlug,
        _id: { $ne: this._id }
      });
      if (!existing) {
        this.slug = candidateSlug;
        break;
      }
      count++;
      candidateSlug = `${baseSlug}-${count}`;
    }
  }
  next();
});

// Text indexing for search
novelSchema.index({ title: 'text', genres: 'text', tags: 'text' });

module.exports = mongoose.model('Novel', novelSchema);
module.exports.slugify = slugify;
