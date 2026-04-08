const validate = (schema) => {
  return (req, res, next) => {
    // If using a library like Joi or Zod in the future
    if (schema) {
      const { error } = schema.validate(req.body, { abortEarly: false });
      if (error) {
        return res.status(400).json({
          message: 'Validation Error',
          errors: error.details.map((detail) => detail.message),
        });
      }
    }
    next();
  };
};

module.exports = validate;
