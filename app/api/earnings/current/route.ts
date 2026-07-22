import { Redis } from "@upstash/redis";

// Public reader for the EARNINGS_current scene. Cheap Upstash lookup — the
// scraping happens weekly in /api/cron/earnings-tally, this endpoint just
// serves the last-known snapshot to the voice scene.

const REDIS_KEY = "earnings:current";

interface EarningsSnapshot {
  reported_pct: number;
  eps_beat_pct: number;
  rev_beat_pct: number;
  quarter: string;
  source_date: string;
  source_url: string;
  fetched_at: string;
}

function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

export async function GET() {
  const redis = getRedis();
  if (!redis) {
    return Response.json({ error: "Storage not configured" }, { status: 503 });
  }

  const snapshot = await redis.get<EarningsSnapshot>(REDIS_KEY);
  if (!snapshot) {
    return Response.json(
      { error: "No snapshot yet — cron hasn't run" },
      { status: 404 },
    );
  }

  return Response.json(snapshot, {
    // Edge cache for 5 min, stale-while-revalidate 1 hr. Data changes weekly,
    // so aggressive caching is fine and keeps Upstash calls near zero.
    headers: {
      "cache-control": "public, s-maxage=300, stale-while-revalidate=3600",
    },
  });
}
