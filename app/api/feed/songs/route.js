import { NextResponse } from "next/server";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;
if (!apiUrl) {
  throw new Error("Missing NEXT_PUBLIC_API_URL environment variable");
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);

  const query = searchParams.get("query") || "latest";
  const pageRaw = Number.parseInt(searchParams.get("page") || "1", 10);
  const limitRaw = Number.parseInt(searchParams.get("limit") || "24", 10);

  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 50) : 24;

  const upstreamUrl = new URL(`${apiUrl}search/songs`);
  upstreamUrl.searchParams.set("query", query);
  upstreamUrl.searchParams.set("page", String(page));
  upstreamUrl.searchParams.set("limit", String(limit));

  let upstreamResponse;
  try {
    upstreamResponse = await fetch(upstreamUrl.toString(), {
      headers: {
        accept: "application/json",
      },
      cache: "no-store",
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: "Failed to reach upstream API" },
      { status: 502 }
    );
  }

  if (!upstreamResponse.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: "Upstream API error",
        status: upstreamResponse.status,
      },
      { status: 502 }
    );
  }

  const json = await upstreamResponse.json();
  const results = json?.data?.results || [];
  const items = Array.isArray(results) ? results : [];

  // Heuristic: if upstream returns a full page, assume more exist.
  const hasMore = items.length >= limit;

  return NextResponse.json(
    {
      ok: true,
      query,
      page,
      limit,
      hasMore,
      results: items,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
