const r = require('express').Router(),
  upload = require('../middleware/upload'),
  {protect} = require('../middleware/auth'),
  {ok} = require('../utils/apiResponse');

r.post(
  '/',
  protect,
  upload.array('images', 8),
  (req, res) =>
    ok(
      res,
      {
        urls: req.files.map(
          f =>
            `${req.protocol}://${req.get('host')}/uploads/${f.filename}`
        )
      },
      'Uploaded',
      201
    )
);

module.exports = r;