const mongoose = require('mongoose');

const messageSubSchema = new mongoose.Schema({
  sender: {
    type: String,
    enum: ['user', 'support'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  attachment: {
    type: String, // Base64 data URL or external URL for screenshots
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const supportTicketSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  session_id: {
    type: String,
    required: true,
    index: true
  },
  sender_name: {
    type: String,
    default: 'Guest Reader'
  },
  sender_email: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved'],
    default: 'open'
  },
  category: {
    type: String,
    enum: ['general', 'chapter_report', 'bug', 'novel_request', 'coins'],
    default: 'general'
  },
  messages: [messageSubSchema]
}, { timestamps: true });

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
