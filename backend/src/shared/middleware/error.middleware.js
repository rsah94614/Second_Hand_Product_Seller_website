const errorHandler = (err, req, res, next) => {
  console.error(`[Error] ${err.name}: ${err.message}`, {
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation Error',
      errors: Object.values(err.errors).map((e) => e.message),
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      message: 'Resource not found or invalid ID format',
    });
  }

  if (err.code === 11000) {
    return res.status(400).json({
      message: 'Duplicate key error. This resource already exists.',
    });
  }

  return res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
