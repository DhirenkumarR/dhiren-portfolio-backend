import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ContactRequest from '../models/ContactRequest.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Helper to check if already logged in (redirect logged-in users from login page to dashboard)
const checkLoggedIn = async (req, res, next) => {
  if (req.cookies && req.cookies.token) {
    try {
      const decoded = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (user) {
        return res.redirect('/admin/dashboard');
      }
    } catch (err) {
      // Token invalid, clear cookie and proceed to login
      res.clearCookie('token');
    }
  }
  next();
};

// @desc    Render login page
// @route   GET /admin/login
// @access  Public (Redirects if logged in)
router.get('/login', checkLoggedIn, (req, res) => {
  res.render('login');
});

// @desc    Handle web admin login
// @route   POST /admin/login
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.render('login', { error: 'Please enter all fields', email });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (user && (await user.comparePassword(password))) {
      // Generate JWT
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
      });

      // Set cookie
      res.cookie('token', token, {
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });

      return res.redirect('/admin/dashboard');
    } else {
      return res.render('login', { error: 'Invalid email or password', email });
    }
  } catch (error) {
    console.error('Web login error:', error.message);
    return res.render('login', { error: 'An error occurred during login. Try again.', email });
  }
});

// @desc    Render admin dashboard
// @route   GET /admin/dashboard
// @access  Private (Admin only)
router.get('/dashboard', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    // Filter to exclude archived requests
    const filter = { isArchived: { $ne: true } };
    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [
        { name: regex },
        { email: regex },
        { subject: regex },
        { message: regex }
      ];
    }

    const total = await ContactRequest.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);
    const requests = await ContactRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.render('dashboard', {
      requests,
      page,
      totalPages,
      search,
      total,
      limit
    });
  } catch (error) {
    console.error('Fetch dashboard inquiries error:', error.message);
    return res.status(500).send('Server Error');
  }
});

// @desc    Render archived inquiries screen
// @route   GET /admin/archives
// @access  Private (Admin only)
router.get('/archives', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    // Filter for archived requests
    const filter = { isArchived: true };
    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [
        { name: regex },
        { email: regex },
        { subject: regex },
        { message: regex }
      ];
    }

    const total = await ContactRequest.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);
    const requests = await ContactRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.render('archives', {
      requests,
      page,
      totalPages,
      search,
      total,
      limit
    });
  } catch (error) {
    console.error('Fetch archives error:', error.message);
    return res.status(500).send('Server Error');
  }
});

// @desc    Archive a contact request
// @route   POST /admin/contact/:id/archive
// @access  Private (Admin only)
router.post('/contact/:id/archive', protect, async (req, res) => {
  try {
    await ContactRequest.findByIdAndUpdate(req.params.id, { isArchived: true });
    return res.json({ success: true, message: 'Inquiry archived successfully' });
  } catch (error) {
    console.error('Archive error:', error.message);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @desc    Unarchive a contact request
// @route   POST /admin/contact/:id/unarchive
// @access  Private (Admin only)
router.post('/contact/:id/unarchive', protect, async (req, res) => {
  try {
    await ContactRequest.findByIdAndUpdate(req.params.id, { isArchived: false });
    return res.json({ success: true, message: 'Inquiry restored successfully' });
  } catch (error) {
    console.error('Unarchive error:', error.message);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @desc    Delete a contact request
// @route   POST /admin/contact/:id/delete
// @access  Private (Admin only)
router.post('/contact/:id/delete', protect, async (req, res) => {
  try {
    await ContactRequest.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Inquiry deleted permanently' });
  } catch (error) {
    console.error('Delete error:', error.message);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @desc    Clear cookies and logout
// @route   GET /admin/logout
// @access  Public
router.get('/logout', (req, res) => {
  res.clearCookie('token');
  return res.redirect('/admin/login');
});

export default router;
