const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['new_chapter', 'reminder', 'promo'], required: true },
  message: { type: String, required: true },
  is_read: { type: Boolean, default: false },
  link: { type: String } // Optional link to redirect user when clicked
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
