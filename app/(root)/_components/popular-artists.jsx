"use client";

import ArtistCard from "@/components/cards/artist";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

function getFallbackAvatar(name) {
  const first = String(name || "U").trim().slice(0, 1).toUpperCase() || "U";
  return `https://az-avatar.vercel.app/api/avatar/?bgColor=0f0f0f0&fontSize=60&text=${encodeURIComponent(first)}`;
}

export default function PopularArtists() {
  const [songs, setSongs] = useState([]);
  const scrollerRef = useRef(null);

  const scrollByAmount = (amount) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: amount, behavior: "smooth" });
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/feed/songs?query=latest&limit=50", { cache: "no-store" });
        const data = await res?.json();
        const results = data?.results ?? data?.data?.results;
        if (!mounted) return;
        setSongs(Array.isArray(results) ? results : []);
      } catch {
        if (!mounted) return;
        setSongs([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const artists = useMemo(() => {
    const map = new Map();
    for (const s of songs) {
      const a = s?.artists?.primary?.[0];
      if (!a?.name) continue;
      const id = a?.id || a?.name;
      if (map.has(id)) continue;
      map.set(id, {
        id,
        name: a.name,
        image: a?.image?.[2]?.url || a?.image?.[1]?.url || a?.image?.[0]?.url || getFallbackAvatar(a.name),
      });
      if (map.size >= 24) break;
    }
    return Array.from(map.values());
  }, [songs]);

  return (
    <section className="mt-3">
      <div className="mb-3 sm:mb-5 flex items-center gap-1">
        <h2 className="text-xs sm:text-base">Popular Artist</h2>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>

      <div className="group relative rounded-md">
        <button
          type="button"
          aria-label="Scroll left"
          onClick={() => scrollByAmount(-260)}
          className="absolute left-1 top-1/2 z-10 -translate-y-1/2 rounded-full border bg-background/70 p-1.5 text-foreground shadow-sm backdrop-blur transition-opacity hover:bg-background/90 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <button
          type="button"
          aria-label="Scroll right"
          onClick={() => scrollByAmount(260)}
          className="absolute right-1 top-1/2 z-10 -translate-y-1/2 rounded-full border bg-background/70 p-1.5 text-foreground shadow-sm backdrop-blur transition-opacity hover:bg-background/90 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        <div
          ref={scrollerRef}
          className="flex gap-3 sm:gap-4 overflow-x-auto scroll-smooth pr-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {artists.length
            ? artists.map((a) => (
                <div key={a.id} className="min-w-[76px] sm:min-w-[100px]">
                  <ArtistCard id={a.id} image={a.image} name={a.name} />
                  <div className="mt-0.5 text-center text-[10px] sm:text-xs text-muted-foreground">Artist</div>
                </div>
              ))
            : Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="grid gap-2">
                  <Skeleton className="h-[76px] w-[76px] sm:h-[100px] sm:w-[100px] rounded-full" />
                  <Skeleton className="h-3 w-16 sm:w-20" />
                </div>
              ))}
        </div>
      </div>
    </section>
  );
}
