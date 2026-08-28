// Wrap an async Express handler so a rejected promise is forwarded to the
// error middleware instead of becoming an unhandled rejection (which crashes
// the process). Apply to every async route.
export const wrap = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
