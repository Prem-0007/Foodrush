// Validates req.body against a zod schema. Unknown fields are rejected by .strict() in the schemas.
module.exports = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(422).json({
      error: 'Validation failed',
      details: result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
  }
  req.body = result.data;
  next();
};
