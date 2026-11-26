const r = require('express').Router(),
  c = require('../controllers/reportController'),
  {protect,authorize} = require('../middleware/auth');

r.post('/', protect, c.create);

r.get('/', protect, authorize('admin'), c.list);

r.put('/:id', protect, authorize('admin'), c.update);

module.exports = r;