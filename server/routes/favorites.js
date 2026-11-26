const r = require('express').Router(),
  c = require('../controllers/favoriteController'),
  {protect} = require('../middleware/auth');

r.get('/', protect, c.list);

r.get('/:listingId', protect, c.check);

r.post('/:listingId', protect, c.add);

r.delete('/:listingId', protect, c.remove);

module.exports = r;