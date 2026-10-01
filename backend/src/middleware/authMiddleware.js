import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({ message: 'Not authorized: User not found' });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized: Invalid or expired token' });
    }
  } else {
    return res.status(401).json({ message: 'Not authorized: No token provided' });
  }
};

export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ message: 'Access forbidden: Admins only' });
  }
};
