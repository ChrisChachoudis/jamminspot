// Express 4 does not catch rejected promises from async route handlers —
// an uncaught rejection crashes the whole process instead of returning a
// response. Wrapping every async handler routes the error to next(err)
// and the error middleware in server.js instead.
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
