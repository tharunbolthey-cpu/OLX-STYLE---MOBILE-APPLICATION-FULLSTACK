const r = require('express').Router();

const c = require('../controllers/userController');

const {
  protect,
  authorize
} = require('../middleware/auth');

const upload = require('../middleware/upload');

r.get(
  '/profile',
  protect,
  c.profile
);

r.put(
  '/profile',
  protect,
  upload.single('avatar'),
  c.update
);

r.put(
  '/password',
  protect,
  c.changePassword
);

r.get(
  '/seller/:id',
  protect,
  c.seller
);

r.get(
  '/',
  protect,
  authorize('admin'),
  c.list
);

r.post(
  '/:id/suspend',
  protect,
  authorize('admin'),
  c.suspend
);

r.post(
  '/:id/activate',
  protect,
  authorize('admin'),
  c.activate
);

r.delete(
  '/:id',
  protect,
  authorize('admin'),
  c.remove
);

module.exports = r;