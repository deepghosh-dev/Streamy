"use client"
import AlbumCard from "@/components/cards/album";
import ArtistCard from "@/components/cards/artist";
import SongCard from "@/components/cards/song";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { MusicContext } from "@/hooks/use-context";
import { getSongsByQuery, searchAlbumByQuery } from "@/lib/fetch";
import { cn } from "@/lib/utils";
import { Play } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import HomeInfiniteFeed from "./_components/home-infinite-feed";

function Chip({ active, children }) {
  return (
    <button
      type="button"
      className={cn(
        "h-8 px-3 rounded-full text-sm transition",
        active
          ? "bg-white text-black"
          : "bg-white/10 text-foreground hover:bg-white/15"
      )}
    >
      {children}
    </button>
  );
}

function QuickTile({ title, image, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group w-full flex items-center gap-3 overflow-hidden rounded-xl",
        "border border-white/5 bg-white/5 hover:bg-white/10 transition"
      )}
    >
      <div className="h-12 w-12 shrink-0 bg-white/10">
        {image ? (
          <img
            src={image}
            alt={title}
            className="h-12 w-12 object-cover"
            loading="lazy"
          />
        ) : (
          <div className="h-12 w-12 bg-white/10" />
        )}
      </div>
      <div className="min-w-0 flex-1 pr-2 text-left">
        <div className="truncate text-sm font-medium tracking-tight">
          {title}
        </div>
      </div>
      <div className="pr-2 opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition">
        <div className="h-9 w-9 rounded-full bg-emerald-400 text-black flex items-center justify-center shadow-[0_10px_25px_rgba(16,185,129,0.25)]">
          <Play className="h-4 w-4" />
        </div>
      </div>
    </button>
  );
}

export default function Page() {
  const [latest, setLatest] = useState([]);
  const [popular, setPopular] = useState([]);
  const [albums, setAlbums] = useState([]);
  const ids = useContext(MusicContext);

  const getSongs = async (e, type) => {
    const get = await getSongsByQuery(e);
    const data = await get.json();
    if (type === "latest") {
      setLatest(data.data.results);
    } else if (type === "popular") {
      setPopular(data.data.results);
    }
  };

  const getAlbum = async () => {
    const get = await searchAlbumByQuery("latest");
    const data = await get.json();
    setAlbums(data.data.results);
  };

  useEffect(() => {
    getSongs("latest", "latest");
    getSongs("trending", "popular");
    getAlbum();
  }, []);

  const setLastPlayed = (id) => {
    try {
      localStorage.clear();
      localStorage.setItem("last-played", id);
    } catch {
      // ignore
    }
  };

  const quickTiles = latest.slice(0, 6);
  const heroSong = popular?.[0] || latest?.[0];

  return (
    <main className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Top chips */}
      <div className="flex items-center gap-2">
        <Chip active>All</Chip>
        <Chip>Music</Chip>
        <Chip>Podcasts</Chip>
      </div>

      {/* Quick tiles */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {quickTiles.length
          ? quickTiles.map((s) => (
              <QuickTile
                key={s.id}
                title={s.name}
                image={s.image?.[1]?.url || s.image?.[0]?.url}
                onClick={() => {
                  ids?.setMusic?.(s.id);
                  setLastPlayed(s.id);
                }}
              />
            ))
          : Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-12 rounded-xl border border-white/5 bg-white/5"
              />
            ))}
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold tracking-tight">Made For You</div>
            <div className="text-xs text-muted-foreground">
              Daily mixes from your vibe.
            </div>
          </div>
          <button className="text-xs text-muted-foreground hover:text-foreground transition">
            Show all
          </button>
        </div>

        <ScrollArea className="rounded-md mt-4">
          <div className="flex gap-4">
            {(latest.length ? latest : Array.from({ length: 8 })).slice(0, 10).map((song, i) =>
              song?.id ? (
                <SongCard
                  key={song.id}
                  id={song.id}
                  image={song.image?.[2]?.url}
                  title={song.name}
                  artist={song.artists?.primary?.[0]?.name}
                  className="w-[170px]"
                  imageClassName="h-[170px]"
                />
              ) : (
                <SongCard key={i} className="w-[170px]" imageClassName="h-[170px]" />
              )
            )}
          </div>
          <ScrollBar orientation="horizontal" className="hidden sm:flex" />
        </ScrollArea>
      </div>

      {/* Recently played */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold tracking-tight">Recently played</div>
            <div className="text-xs text-muted-foreground">
              A quick rewind.
            </div>
          </div>
          <button className="text-xs text-muted-foreground hover:text-foreground transition">
            Show all
          </button>
        </div>
        <ScrollArea className="rounded-md mt-4">
          <div className="flex gap-4">
            {popular.length
              ? popular.slice(0, 10).map((song) => (
                  <SongCard
                    key={song.id}
                    id={song.id}
                    image={song.image?.[2]?.url}
                    title={song.name}
                    artist={song.artists?.primary?.[0]?.name}
                  />
                ))
              : Array.from({ length: 10 }).map((_, i) => <SongCard key={i} />)}
          </div>
          <ScrollBar orientation="horizontal" className="hidden sm:flex" />
        </ScrollArea>
      </div>

      {/* Albums */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold tracking-tight">New albums</div>
            <div className="text-xs text-muted-foreground">
              Fresh drops.
            </div>
          </div>
        </div>
        <ScrollArea className="rounded-md mt-4">
          <div className="flex gap-4">
            {albums.length
              ? albums.slice(0, 10).map((song) => (
                  <AlbumCard
                    key={song.id}
                    lang={song.language}
                    image={song.image?.[2]?.url}
                    title={song.name}
                    artist={song.artists?.primary?.[0]?.name}
                    id={`album/${song.id}`}
                  />
                ))
              : Array.from({ length: 10 }).map((_, i) => <SongCard key={i} />)}
          </div>
          <ScrollBar orientation="horizontal" className="hidden sm:flex" />
        </ScrollArea>
      </div>

      {/* Artists */}
      <div className="mt-8">
        <div className="text-sm font-semibold tracking-tight">Artists</div>
        <div className="text-xs text-muted-foreground">Most searched artists.</div>
        <ScrollArea className="rounded-md mt-4">
          <div className="flex gap-4">
            {latest.length
              ? [...new Set(latest.map((a) => a.artists.primary[0].id))]
                  .slice(0, 12)
                  .map((id) => (
                    <ArtistCard
                      key={id}
                      id={id}
                      image={
                        latest.find((a) => a.artists.primary[0].id === id).artists
                          .primary[0].image[2]?.url ||
                        `https://az-avatar.vercel.app/api/avatar/?bgColor=0f0f0f0&fontSize=60&text=${
                          latest
                            .find((a) => a.artists.primary[0].id === id)
                            .artists.primary[0].name.split("")[0]
                            .toUpperCase() || "UN"
                        }`
                      }
                      name={
                        latest.find((a) => a.artists.primary[0].id === id).artists
                          .primary[0].name
                      }
                    />
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
      </div>

      <div className="mt-10">
        <HomeInfiniteFeed query="latest" pageSize={24} />
      </div>
    </main>
  )
}
