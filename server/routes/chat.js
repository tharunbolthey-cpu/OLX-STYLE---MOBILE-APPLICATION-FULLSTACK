const r = require('express').Router(),
  c = require('../controllers/chatController'),
  {protect} = require('../middleware/auth');

r.get('/', protect, c.list);

r.post('/', protect, c.start);

r.get('/:id/messages', protect, c.messages);

r.post('/:id/messages', protect, c.send);

module.exports = r;