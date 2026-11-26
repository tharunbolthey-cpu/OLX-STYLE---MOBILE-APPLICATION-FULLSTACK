const r = require('express').Router(),
  c = require('../controllers/listingController'),
  {protect,authorize} = require('../middleware/auth'),
  upload = require('../middleware/upload');

r.get('/', c.list);

r.get('/mine', protect, c.my);

r.get('/admin/all', protect, authorize('admin'), c.adminList);

r.get('/:id', c.get);

r.post('/', protect, upload.array('images', 8), c.create);

r.put('/:id', protect, upload.array('images', 8), c.update);

r.delete('/:id', protect, c.remove);

r.post('/:id/sold', protect, c.markSold);

r.post('/:id/repost', protect, c.repost);

r.post('/:id/approve', protect, authorize('admin'), c.approve);

r.post('/:id/reject', protect, authorize('admin'), c.reject);

module.exports = r;