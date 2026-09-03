export function notFound(req, res) {
  res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "The requested page or record was not found." } });
}

export function errorHandler(error, _req, res, _next) {
  const status = error.statusCode || 500;
  res.status(status).json({
    success: false,
    error: {
      code: error.code || "SERVER_ERROR",
      message: status >= 500 ? "We could not complete this request right now. Please try again." : error.message
    }
  });
}
