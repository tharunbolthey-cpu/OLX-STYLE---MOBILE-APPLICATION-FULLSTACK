const r = require('express').Router(),
  c = require('../controllers/categoryController');

r.get('/', c.list);

r.get('/:id', c.get);

module.exports = r;