const SupportTicket = require('../models/SupportTicket');
const User = require('../models/User');

// @desc    Send a support message (user or guest)
// @route   POST /api/support/message
// @access  Public / Optional Auth
const sendMessage = async (req, res) => {
  try {
    const { session_id, content, attachment, category, sender_name, sender_email } = req.body;

    if (!session_id || !content) {
      return res.status(400).json({ message: 'Session ID and message content are required' });
    }

    let userId = null;
    let name = sender_name || 'Guest Reader';
    let email = sender_email || '';

    if (req.user) {
      userId = req.user._id;
      name = req.user.username || name;
      email = req.user.email || email;
    }

    // Find active ticket for this user or session
    let ticket = null;
    if (userId) {
      ticket = await SupportTicket.findOne({ user_id: userId, status: { $ne: 'resolved' } }).sort({ updatedAt: -1 });
    }
    if (!ticket && session_id) {
      ticket = await SupportTicket.findOne({ session_id, status: { $ne: 'resolved' } }).sort({ updatedAt: -1 });
    }

    const newMessage = {
      sender: 'user',
      content,
      attachment: attachment || null,
      createdAt: new Date()
    };

    if (ticket) {
      ticket.messages.push(newMessage);
      ticket.status = 'open'; // Re-open if user sends new message
      if (category) ticket.category = category;
      await ticket.save();
    } else {
      ticket = await SupportTicket.create({
        user_id: userId,
        session_id,
        sender_name: name,
        sender_email: email,
        category: category || 'general',
        status: 'open',
        messages: [newMessage]
      });
    }

    res.status(201).json(ticket);
  } catch (error) {
    console.error('Error in sendMessage:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
};

// @desc    Get user's support chat thread
// @route   GET /api/support/thread
// @access  Public / Optional Auth
const getThread = async (req, res) => {
  try {
    const { session_id } = req.query;

    let query = {};
    if (req.user) {
      query = { user_id: req.user._id };
    } else if (session_id) {
      query = { session_id };
    } else {
      return res.json({ messages: [] });
    }

    const ticket = await SupportTicket.findOne(query).sort({ updatedAt: -1 });
    if (!ticket) {
      return res.json({ messages: [] });
    }

    res.json(ticket);
  } catch (error) {
    console.error('Error in getThread:', error);
    res.status(500).json({ message: 'Failed to fetch thread' });
  }
};

// @desc    Get all tickets for Admin
// @route   GET /api/support/admin/tickets
// @access  Private/Admin
const getAdminTickets = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }

    const tickets = await SupportTicket.find(filter)
      .populate('user_id', 'username email coins role')
      .sort({ updatedAt: -1 });

    res.json(tickets);
  } catch (error) {
    console.error('Error in getAdminTickets:', error);
    res.status(500).json({ message: 'Failed to fetch tickets' });
  }
};

// @desc    Admin reply to ticket
// @route   POST /api/support/admin/reply
// @access  Private/Admin
const replyTicket = async (req, res) => {
  try {
    const { ticket_id, content, status } = req.body;

    if (!ticket_id || !content) {
      return res.status(400).json({ message: 'Ticket ID and content are required' });
    }

    const ticket = await SupportTicket.findById(ticket_id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    ticket.messages.push({
      sender: 'support',
      content,
      createdAt: new Date()
    });

    if (status) {
      ticket.status = status;
    } else {
      ticket.status = 'in_progress';
    }

    await ticket.save();
    res.json(ticket);
  } catch (error) {
    console.error('Error in replyTicket:', error);
    res.status(500).json({ message: 'Failed to reply to ticket' });
  }
};

module.exports = {
  sendMessage,
  getThread,
  getAdminTickets,
  replyTicket
};
