"use client";

import ArtistCard from "@/components/cards/artist";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { getSongsByQuery } from "@/lib/fetch";
import { ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

function getFallbackAvatar(name) {
  const first = String(name || "U").trim().slice(0, 1).toUpperCase() || "U";
  return `https://az-avatar.vercel.app/api/avatar/?bgColor=0f0f0f0&fontSize=60&text=${encodeURIComponent(first)}`;
}

export default function PopularArtists() {
  const [songs, setSongs] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await getSongsByQuery("latest");
        const data = await res?.json();
        const results = data?.data?.results;
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
      if (map.size >= 14) break;
    }
    return Array.from(map.values());
  }, [songs]);

  return (
    <section className="mt-3">
      <div className="mb-5 flex items-center gap-1">
        <h2 className="text-base">Popular Artist</h2>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>

      <ScrollArea className="rounded-md">
        <div className="flex gap-4">
          {artists.length
            ? artists.map((a) => (
                <div key={a.id} className="min-w-[100px]">
                  <ArtistCard id={a.id} image={a.image} name={a.name} />
                  <div className="mt-0.5 text-center text-xs text-muted-foreground">Artist</div>
                </div>
              ))
            : Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="grid gap-2">
                  <Skeleton className="h-[100px] w-[100px] rounded-full" />
                  <Skeleton className="h-3 w-20" />
                </div>
              ))}
        </div>
        <ScrollBar orientation="horizontal" className="hidden sm:flex" />
      </ScrollArea>
    </section>
  );
}
