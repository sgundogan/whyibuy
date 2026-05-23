import { Redis } from "@upstash/redis";
import { NextRequest } from "next/server";

const MAX_CONCURRENT = 50;
const SESSION_TTL_SECONDS = 600; // 10 min auto-expire
const RATE_LIMIT_WINDOW = 60; // 1 min
const RATE_LIMIT_MAX = 5; // 5 starts per minute per IP

function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

/**
 * Count active sessions by counting session:* keys with TTLs.
 * This is drift-proof: sessions auto-expire, so the count is always accurate.
 * No more counter that can get stuck when clients disconnect without cleanup.
 */
async function countActiveSessions(redis: Redis): Promise<number> {
  const keys = await redis.keys("session:*");
  return keys.length;
}

export async function POST(request: NextRequest) {
  const agentId = process.env.ELEVENLABS_AGENT_ID;
  if (!agentId) {
    return Response.json({ error: "Agent not configured" }, { status: 500 });
  }

  const redis = getRedis();

  if (redis) {
    // IP-based rate limiting
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const rateKey = `rate:${ip}`;
    const rateCount = await redis.incr(rateKey);
    if (rateCount === 1) {
      await redis.expire(rateKey, RATE_LIMIT_WINDOW);
    }
    if (rateCount > RATE_LIMIT_MAX) {
      return Response.json({ error: "Too many requests" }, { status: 429 });
    }

    // Concurrency check by counting actual session keys (drift-proof)
    const activeCount = await countActiveSessions(redis);
    if (activeCount >= MAX_CONCURRENT) {
      return Response.json(
        { error: "Investing Brain is busy. Try again shortly." },
        { status: 503 }
      );
    }
  }

  // Generate signed URL from ElevenLabs
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "API key not configured" }, { status: 500 });
  }

  try {
    const params = new URLSearchParams({ agent_id: agentId });
    const branchId = process.env.ELEVENLABS_BRANCH_ID;
    if (branchId) params.set("branch_id", branchId);

    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?${params}`,
      {
        method: "GET",
        headers: { "xi-api-key": apiKey },
      }
    );

    if (!response.ok) {
      const text = await response.text();
      console.error("ElevenLabs API error:", response.status, text);
      return Response.json({ error: "Failed to start conversation" }, { status: 502 });
    }

    const data = await response.json();

    // Register session in Redis with TTL (auto-expires — no counter needed)
    if (redis) {
      const sessionId = crypto.randomUUID();
      await redis.set(`session:${sessionId}`, "active", { ex: SESSION_TTL_SECONDS });
      return Response.json({ signedUrl: data.signed_url, sessionId });
    }

    return Response.json({ signedUrl: data.signed_url });
  } catch (error) {
    console.error("Failed to get signed URL:", error);
    return Response.json({ error: "Service unavailable" }, { status: 503 });
  }
}

export async function DELETE(request: NextRequest) {
  const redis = getRedis();
  if (!redis) return Response.json({ ok: true });

  try {
    const { sessionId } = await request.json();
    if (sessionId && typeof sessionId === "string" && sessionId.length < 100) {
      await redis.del(`session:${sessionId}`);
    }
  } catch {
    // Best-effort cleanup
  }

  return Response.json({ ok: true });
}
