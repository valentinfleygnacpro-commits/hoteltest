const BUCKETS = new Map();

function getClientIp(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return "unknown";
}

function isRateLimited({ key, limit, windowMs }) {
  const now = Date.now();
  const entry = BUCKETS.get(key) || { count: 0, resetAt: now + windowMs };

  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + windowMs;
  }

  entry.count += 1;
  BUCKETS.set(key, entry);

  return entry.count > limit;
}

function enforceRateLimit(request, scope, limit = 20, windowMs = 60_000) {
  const ip = getClientIp(request);
  return isRateLimited({
    key: `${scope}:${ip}`,
    limit,
    windowMs,
  });
}

module.exports = {
  enforceRateLimit,
};
