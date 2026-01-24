"use client";

import { getSongsById } from "@/lib/fetch";
import { readQueue } from "@/lib/queue";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

const MAX_ITEMS = 10;

function getImageUrl(song) {
  return song?.image?.[2]?.url || song?.image?.[1]?.url || song?.image?.[0]?.url || "";
}

export default function RecentPlayedCarousel() {
  const router = useRouter();
  const [ids, setIds] = useState([]);
  const [songs, setSongs] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const abortRef = useRef(null);

  const visible = useMemo(() => ids.slice(0, MAX_ITEMS), [ids]);

  const offsets = useMemo(() => {
    const len = songs.length;
    // More visible cards (like the reference): try to show 1 extra on both sides.
    if (len >= 7) return [-3, -2, -1, 0, 1, 2, 3];
    if (len === 6) return [-3, -2, -1, 0, 1, 2];
    if (len === 5) return [-2, -1, 0, 1, 2];
    if (len === 4) return [-2, -1, 0, 1];
    if (len === 3) return [-1, 0, 1];
    if (len === 2) return [0, 1];
    return [0];
  }, [songs.length]);

  const refreshIds = () => {
    try {
      const queue = readQueue();
      const recent = queue.slice(-MAX_ITEMS).reverse();
      setIds(recent);
    } catch {
      setIds([]);
    }
  };

  useEffect(() => {
    refreshIds();
    const onUpdate = () => refreshIds();
    window.addEventListener("streamy-queue-updated", onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener("streamy-queue-updated", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!visible.length) {
      setSongs([]);
      setActiveIndex(0);
      return;
    }

    setActiveIndex((prev) => (prev >= visible.length ? 0 : Math.max(prev, 0)));

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    (async () => {
      const results = await Promise.all(
        visible.map(async (id) => {
          try {
            const res = await getSongsById(id);
            const json = await res?.json();
            const song = json?.data?.[0];
            if (!song?.id) return null;
            return song;
          } catch {
            return null;
          }
        })
      );

      if (controller.signal.aborted) return;
      // No blank cards: only keep songs that have artwork.
      setSongs(results.filter((s) => s?.id && Boolean(getImageUrl(s))));
    })();

    return () => controller.abort();
  }, [visible]);

  const step = (dir) => {
    const len = songs.length;
    if (!len) return;
    setActiveIndex((prev) => {
      const next = prev + dir;
      if (next < 0) return len - 1;
      if (next >= len) return 0;
      return next;
    });
  };

  const getAt = (index) => {
    const len = songs.length;
    if (!len) return null;
    const safe = ((index % len) + len) % len;
    return songs[safe];
  };

  const cardStyleFor = (offset) => {
    const abs = Math.abs(offset);
    // Keep all cards fully visible as requested.
    const scale = abs === 0 ? 1 : abs === 1 ? 0.92 : abs === 2 ? 0.86 : 0.8;
    const opacity = 1;
    // Keep below navbar (navbar uses z-40).
    const z = abs === 0 ? 30 : abs === 1 ? 20 : abs === 2 ? 10 : 0;
    // Bring cards more "inside" so second card isn't too far outside.
    const x = offset * 200;
    const blur = 0;
    return {
      transform: `translate(-50%, -50%) translateX(${x}px) scale(${scale})`,
      opacity,
      filter: blur ? `blur(${blur}px)` : undefined,
      zIndex: z,
    };
  };

  return (
    <section className="mt-2 mb-3 sm:mb-4">
      <div className="mb-0 flex items-center gap-1">
        <h2 className="text-base">Recent Played</h2>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>

      {songs.length ? (
        <div className="relative">
          <div className="relative isolate h-[300px] sm:h-[380px] lg:h-[400px]">
            <button
              type="button"
              aria-label="Previous"
              onClick={() => step(-1)}
              className={cn(
                "absolute left-2 sm:left-6 top-[52%] -translate-y-1/2 z-30",
                "h-10 w-10 rounded-full bg-white/80 text-black",
                "flex items-center justify-center",
                "hover:bg-white transition"
              )}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Next"
              onClick={() => step(1)}
              className={cn(
                "absolute right-2 sm:right-6 top-[52%] -translate-y-1/2 z-30",
                "h-10 w-10 rounded-full bg-white/80 text-black",
                "flex items-center justify-center",
                "hover:bg-white transition"
              )}
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {offsets.map((offset) => {
              const song = getAt(activeIndex + offset);
              if (!song) return null;

              const isActive = offset === 0 || (songs.length === 2 && offset === 0);
              const art = getImageUrl(song);
              if (!art) return null;

              return (
                <div
                  key={`slot-${offset}`}
                  className={cn(
                    "absolute left-1/2 top-[52%]",
                    "will-change-transform",
                    "transition-[transform,opacity,filter] duration-[850ms]",
                    "ease-[cubic-bezier(0.22,1,0.36,1)]"
                  )}
                  style={cardStyleFor(offset)}
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (offset !== 0 && songs.length > 2) {
                        setActiveIndex((prev) => {
                          const len = songs.length;
                          return ((prev + offset) % len + len) % len;
                        });
                        return;
                      }
                      router.push(`/${song.id}`);
                    }}
                    className={cn(
                      "group relative",
                      "w-[300px] h-[300px] sm:w-[380px] sm:h-[380px]",
                      "rounded-[28px] overflow-hidden",
                      "shadow-[0_25px_70px_rgba(0,0,0,0.45)]",
                      "focus:outline-none"
                    )}
                  >
                    <img
                      src={art}
                      alt={song?.name || "song"}
                      className="absolute inset-0 h-full w-full object-cover"
                      loading="lazy"
                      draggable={false}
                    />

                    {/* Spotify-style play button on hover (center card only) */}
                    {isActive ? (
                      <div
                        className={cn(
                          "absolute inset-0 flex items-center justify-center",
                          "opacity-0 scale-95",
                          "group-hover:opacity-100 group-hover:scale-100",
                          "transition duration-150 ease-out"
                        )}
                      >
                        <div
                          className={cn(
                            "h-14 w-14 sm:h-16 sm:w-16",
                            "rounded-full",
                            "bg-[#1db954] text-black",
                            "flex items-center justify-center",
                            "shadow-[0_14px_30px_rgba(0,0,0,0.35)] ring-1 ring-black/10"
                          )}
                        >
                          <Play
                            className="h-7 w-7 sm:h-8 sm:w-8 translate-x-[1px]"
                            fill="currentColor"
                            strokeWidth={0}
                          />
                        </div>
                      </div>
                    ) : null}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="mt-4 w-full rounded-2xl border border-white/5 bg-white/5 p-5">
          <div className="text-sm font-medium">No recent plays yet</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Play a song and it will appear here.
          </div>
        </div>
      )}
    </section>
  );
}
