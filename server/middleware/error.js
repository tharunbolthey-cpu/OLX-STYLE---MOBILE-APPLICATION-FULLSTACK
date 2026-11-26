function notFound(req, res) {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
}

function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: Object.fromEntries(
        Object.entries(err.errors).map(([key, value]) => [key, value.message])
      )
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: `Invalid ${err.path || 'id'}` });
  }

  if (err.code === 11000) {
    return res.status(409).json({ success: false, message: 'A record with this value already exists' });
  }

  if (err.name === 'MulterError') {
    return res.status(400).json({ success: false, message: err.message });
  }

  const status = Number(err.status) >= 400 && Number(err.status) < 600 ? Number(err.status) : 500;
  res.status(status).json({ success: false, message: err.message || 'Internal server error' });
}

module.exports = { notFound, errorHandler };
