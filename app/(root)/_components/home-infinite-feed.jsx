"use client";

import SongCard from "@/components/cards/song";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

function getImageUrl(song) {
  return song?.image?.[2]?.url || song?.image?.[1]?.url || song?.image?.[0]?.url;
}

function getArtistName(song) {
  return song?.artists?.primary?.[0]?.name;
}

export default function HomeInfiniteFeed({ query = "latest", pageSize = 24 }) {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sentinelRef = useRef(null);
  const inFlightRef = useRef(false);

  const gridClassName =
    "grid grid-cols-2 gap-x-3 gap-y-5 sm:gap-x-4 sm:gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6";

  const fetchPage = useCallback(
    async (pageToFetch) => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;

      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/feed/songs?query=${encodeURIComponent(query)}&page=${pageToFetch}&limit=${pageSize}`,
          { cache: "no-store" }
        );
        const json = await res.json();

        if (!res.ok || !json?.ok) {
          throw new Error(json?.error || "Failed to load feed");
        }

        const nextItems = Array.isArray(json.results) ? json.results : [];
        setItems((prev) => (pageToFetch === 1 ? nextItems : [...prev, ...nextItems]));
        setHasMore(Boolean(json.hasMore) && nextItems.length > 0);
        setPage(pageToFetch);
      } catch (e) {
        setError(e?.message || "Something went wrong");
      } finally {
        setLoading(false);
        inFlightRef.current = false;
      }
    },
    [query, pageSize]
  );

  useEffect(() => {
    // initial load
    fetchPage(1);
  }, [fetchPage]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (!first?.isIntersecting) return;
        if (loading || !hasMore) return;
        fetchPage(page + 1);
      },
      { root: null, rootMargin: "800px 0px", threshold: 0 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [page, hasMore, loading, fetchPage]);

  const skeletons = useMemo(() => Array.from({ length: pageSize }), [pageSize]);
  const contextIds = useMemo(() => items.map((s) => s.id), [items]);

  return (
    <section className="mt-2 sm:mt-5">
      <div className="mb-5">
        <h2 className="text-sm sm:text-base">For You</h2>
      </div>

      {error ? (
        <div className="rounded-md border border-border bg-card p-4">
          <p className="text-sm">{error}</p>
          <button
            type="button"
            className="mt-3 text-sm underline"
            onClick={() => fetchPage(page || 1)}
          >
            Try again
          </button>
        </div>
      ) : null}

      <div className={gridClassName}>
        {items.map((song) => (
          <SongCard
            key={song.id}
            id={song.id}
            title={song.name}
            artist={getArtistName(song)}
            image={getImageUrl(song)}
            className="w-full"
            imageClassName="aspect-square h-auto w-full object-cover"
            titleClassName="text-[13px] sm:text-base"
            artistClassName="text-[11px] sm:text-sm"
            contextIds={contextIds}
            contextKey={`feed:${query}`}
          />
        ))}

        {loading &&
          skeletons.map((_, i) => (
            <SongCard
              key={`sk-${i}`}
              className="w-full"
              imageClassName="aspect-square h-auto w-full"
              titleClassName="text-[13px] sm:text-base"
              artistClassName="text-[11px] sm:text-sm"
            />
          ))}
      </div>

      <div ref={sentinelRef} className="h-1 w-full" />

      {!hasMore && items.length > 0 ? (
        <p className="mt-6 text-center text-xs text-muted-foreground">
          You’ve reached the end.
        </p>
      ) : null}
    </section>
  );
}
