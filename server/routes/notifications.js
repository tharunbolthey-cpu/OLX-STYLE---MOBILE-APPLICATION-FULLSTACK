const r = require('express').Router();

const {
  protect
} = require('../middleware/auth');

const controller =
  require('../controllers/notificationController');


r.get(
  '/',
  protect,
  controller.list
);


r.get(
  '/unread-count',
  protect,
  controller.unreadCount
);


r.put(
  '/read-all',
  protect,
  controller.readAll
);


r.put(
  '/:id/read',
  protect,
  controller.read
);


r.delete(
  '/:id',
  protect,
  controller.remove
);


module.exports = r;