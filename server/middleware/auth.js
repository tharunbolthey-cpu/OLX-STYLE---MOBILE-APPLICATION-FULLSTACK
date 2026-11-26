const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const bearerToken = header.startsWith('Bearer ') ? header.slice(7) : null;
    const token = req.cookies?.marketly_token || bearerToken;
    if (!token) return res.status(401).json({ success: false, message: 'Authentication required' });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.userId).select('-password');
    if (!user || user.status === 'suspended') return res.status(401).json({ success: false, message: 'Invalid or inactive account' });
    req.user = user;
    next();
  } catch (e) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

function authorize(...roles) {
  return (req, res, next) => roles.includes(req.user?.role) ? next() : res.status(403).json({ success: false, message: 'Forbidden' });
}

module.exports = { protect, authorize };
