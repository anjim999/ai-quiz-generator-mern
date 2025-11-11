export function errorHandler(err, _req, res, _next) {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    detail: err.detail || err.message || "Internal Server Error",
  });
}
