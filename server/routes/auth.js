const r = require('express').Router();

const c = require('../controllers/authController');

const { protect } = require('../middleware/auth');

const upload = require('../middleware/upload');

r.post(
  '/register',
  upload.single('avatar'),
  c.register
);

r.post('/login', c.login);

r.post('/logout', c.logout);

r.get('/me', protect, c.me);

module.exports = r;