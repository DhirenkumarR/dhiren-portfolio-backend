import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;
  const acceptsJson = req.headers.accept && req.headers.accept.includes('application/json');
  const isApiRequest = req.originalUrl.startsWith('/api') || req.xhr || acceptsJson;

  // Check for token in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } 
  // Check for token in cookies
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    if (isApiRequest) {
      return res.status(401).json({ message: 'Not authorized, no token provided' });
    } else {
      return res.redirect('/admin/login');
    }
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from the token, exclude password
    req.user = await User.findById(decoded.id).select('-password');
    
    if (!req.user) {
      if (isApiRequest) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      } else {
        return res.redirect('/admin/login');
      }
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    if (isApiRequest) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    } else {
      res.clearCookie('token');
      return res.redirect('/admin/login');
    }
  }
};
