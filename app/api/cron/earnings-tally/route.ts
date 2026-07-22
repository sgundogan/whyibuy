import { Redis } from "@upstash/redis";
import type { NextRequest } from "next/server";

// Weekly Friday cron: scrape FactSet Earnings Insight and cache the beat rates.
// Ships the "S&P 500 earnings season health" signal to the EARNINGS_current
// scene. Aggregate view of thousands of names — deliberately off the 5-ticker
// deep dive path, invoked only when the user asks for the wide-angle view.
//
// Source: https://insight.factset.com/topic/earnings
// Every post carries three sentences we care about, in stable phrasing:
//   "X% of the companies in the S&P 500 have reported actual results for Q<n> <year>"
//   "Y% have reported actual EPS above estimates"
//   "Z% ... have reported actual revenues above estimates"

const TOPIC_URL = "https://insight.factset.com/topic/earnings";
const REDIS_KEY = "earnings:current";
const UA = "Mozilla/5.0 (compatible; whyibuy-earnings-cron/1.0; +https://whyibuy.io)";

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

async function fetchLatestPostUrl(): Promise<string | null> {
  const res = await fetch(TOPIC_URL, {
    headers: { "user-agent": UA, accept: "text/html" },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const html = await res.text();
  // Grab all anchor hrefs that look like a season-update post; return the first.
  // Ordering on the topic page is newest-first, so index 0 is what we want.
  const matches = html.matchAll(
    /href="(https:\/\/insight\.factset\.com\/sp-500-earnings-season-update-[a-z0-9-]+)"/gi,
  );
  for (const m of matches) return m[1];
  return null;
}

// Slug convention is `<month>-<day>-<year>`. Convert to an ISO date so the
// snapshot has something sortable/comparable across scrapes.
function slugToISODate(url: string): string | null {
  const slug = url.split("/").pop() ?? "";
  const match = slug.match(/([a-z]+)-(\d{1,2})-(\d{4})$/i);
  if (!match) return null;
  const [, monthName, day, year] = match;
  const months: Record<string, string> = {
    january: "01", february: "02", march: "03", april: "04",
    may: "05", june: "06", july: "07", august: "08",
    september: "09", october: "10", november: "11", december: "12",
  };
  const mm = months[monthName.toLowerCase()];
  if (!mm) return null;
  const dd = day.padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

async function parsePost(postUrl: string): Promise<EarningsSnapshot | null> {
  const res = await fetch(postUrl, {
    headers: { "user-agent": UA, accept: "text/html" },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const html = await res.text();

  // Strip tags so regex works even when phrases straddle HTML span/em wrappers.
  // Decode the entities we actually see in these posts — critically `&amp;`
  // in "S&P 500" which would otherwise break the regexes below.
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#\d+;/g, " ")
    .replace(/\s+/g, " ");

  const reportedMatch = text.match(
    /(\d{1,3})%\s+of the companies in the S&P 500 have reported actual results for (Q\d)\s+(\d{4})/i,
  );
  const epsMatch = text.match(/(\d{1,3})%\s+have reported actual EPS above estimates/i);
  const revMatch = text.match(
    /(\d{1,3})%\s+(?:of S&P 500 companies\s+)?have reported actual revenues above estimates/i,
  );

  if (!reportedMatch || !epsMatch || !revMatch) return null;

  const sourceDate = slugToISODate(postUrl);
  if (!sourceDate) return null;

  return {
    reported_pct: Number(reportedMatch[1]),
    eps_beat_pct: Number(epsMatch[1]),
    rev_beat_pct: Number(revMatch[1]),
    quarter: `${reportedMatch[2]} ${reportedMatch[3]}`,
    source_date: sourceDate,
    source_url: postUrl,
    fetched_at: new Date().toISOString(),
  };
}

export async function GET(request: NextRequest) {
  // Vercel Cron sends a bearer token when CRON_SECRET is set; enforce it in
  // prod so nobody else can burn our FactSet scrape quota by hammering this URL.
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const postUrl = await fetchLatestPostUrl();
    if (!postUrl) {
      return Response.json(
        { error: "Could not find latest earnings post" },
        { status: 502 },
      );
    }

    const snapshot = await parsePost(postUrl);
    if (!snapshot) {
      return Response.json(
        { error: "Could not parse earnings numbers", postUrl },
        { status: 502 },
      );
    }

    const redis = getRedis();
    if (redis) {
      await redis.set(REDIS_KEY, snapshot);
    }

    return Response.json({ ok: true, snapshot });
  } catch (error) {
    console.error("earnings-tally failed:", error);
    return Response.json({ error: "Cron failed" }, { status: 500 });
  }
}
