import { Redis } from "@upstash/redis";
import { NextRequest } from "next/server";

const MAX_CONCURRENT = 10;
const SESSION_TTL_SECONDS = 600; // 10 min auto-expire
const RATE_LIMIT_WINDOW = 60; // 1 min
const RATE_LIMIT_MAX = 5; // 5 starts per minute per IP

const ALLOWED_ORIGINS = [
  "https://whyibuy.io",
  "https://www.whyibuy.io",
  "https://whyibuy.vercel.app",
  ...(process.env.NODE_ENV === "development" ? ["http://localhost:3000"] : []),
];

function getCorsHeaders(request: NextRequest) {
  const origin = request.headers.get("origin") ?? "";
  const isAllowed = ALLOWED_ORIGINS.includes(origin);
  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Methods": "POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

// CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new Response(null, { status: 204, headers: getCorsHeaders(request) });
}

export async function POST(request: NextRequest) {
  const cors = getCorsHeaders(request);
  const agentId = process.env.ELEVENLABS_AGENT_ID;
  if (!agentId) {
    return Response.json({ error: "Agent not configured" }, { status: 500, headers: cors });
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
      return Response.json({ error: "Too many requests" }, { status: 429, headers: cors });
    }

    // Concurrency check using atomic counter instead of KEYS scan
    const activeCount = await redis.incr("active_sessions");
    if (activeCount > MAX_CONCURRENT) {
      await redis.decr("active_sessions");
      return Response.json(
        { error: "Investing Brain is busy. Try again shortly." },
        { status: 503, headers: cors }
      );
    }
  }

  // Generate signed URL from ElevenLabs
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "API key not configured" }, { status: 500, headers: cors });
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
      // Roll back counter on failure
      if (redis) await redis.decr("active_sessions");
      return Response.json({ error: "Failed to start conversation" }, { status: 502, headers: cors });
    }

    const data = await response.json();

    // Register session in Redis with TTL
    if (redis) {
      const sessionId = crypto.randomUUID();
      await redis.set(`session:${sessionId}`, "active", { ex: SESSION_TTL_SECONDS });
      return Response.json({ signedUrl: data.signed_url, sessionId }, { headers: cors });
    }

    return Response.json({ signedUrl: data.signed_url }, { headers: cors });
  } catch (error) {
    console.error("Failed to get signed URL:", error);
    if (redis) await redis.decr("active_sessions");
    return Response.json({ error: "Service unavailable" }, { status: 503, headers: cors });
  }
}

export async function DELETE(request: NextRequest) {
  const cors = getCorsHeaders(request);
  const redis = getRedis();
  if (!redis) return Response.json({ ok: true }, { headers: cors });

  try {
    const { sessionId } = await request.json();
    if (sessionId && typeof sessionId === "string" && sessionId.length < 100) {
      const deleted = await redis.del(`session:${sessionId}`);
      // Only decrement counter if session actually existed
      if (deleted > 0) {
        const count = await redis.decr("active_sessions");
        // Safety: don't let counter go negative
        if (count < 0) await redis.set("active_sessions", 0);
      }
    }
  } catch {
    // Best-effort cleanup
  }

  return Response.json({ ok: true }, { headers: cors });
}
