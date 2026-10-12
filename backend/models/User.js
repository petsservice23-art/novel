const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'author', 'admin'], default: 'user' },
  avatar: { type: String, default: '' },
  coins: { type: Number, default: 100 },
  xp: { type: Number, default: 0 },
  badges: [{ type: String }],
  reading_streak: {
    current_streak: { type: Number, default: 0 },
    longest_streak: { type: Number, default: 0 },
    last_read_date: { type: Date }
  },
  library: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Novel' }],
  reading_history: [{
    novel_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Novel' },
    last_chapter_read: { type: Number },
    updated_at: { type: Date, default: Date.now }
  }],
  unlocked_chapters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' }],
  ad_unlocked_chapters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' }],
  last_daily_reward: { type: Date },
  unlock_tickets: { type: Number, default: 3 },
  last_ticket_claim: { type: Date },
  ad_unlocks_today: { type: Number, default: 0 },
  last_ad_unlock_reset: { type: Date },
  notification_tokens: [{ type: String }],
  is_vip: { type: Boolean, default: false }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function() {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
