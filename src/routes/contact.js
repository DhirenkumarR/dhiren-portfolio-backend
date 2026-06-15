import express from 'express';
import ContactRequest from '../models/ContactRequest.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @desc    Submit a contact request
// @route   POST /api/contact
// @access  Public
router.post('/', async (req, res) => {
  const { name, email, subject, message } = req.body;

  try {
    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Name, email, and message are required' });
    }

    const contactRequest = new ContactRequest({
      name,
      email,
      subject: subject || '',
      message,
    });

    const createdRequest = await contactRequest.save();
    res.status(201).json({
      message: 'Contact request submitted successfully',
      data: createdRequest,
    });
  } catch (error) {
    console.error('Contact request submission error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get all contact requests
// @route   GET /api/contact
// @access  Private (Admin Only)
router.get('/', protect, async (req, res) => {
  try {
    const requests = await ContactRequest.find({}).sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    console.error('Fetch contact requests error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
