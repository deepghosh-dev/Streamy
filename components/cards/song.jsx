"use client";
import { MusicContext } from "@/hooks/use-context";
import { touchQueue, writePlayContext } from "@/lib/queue";
import { cn } from "@/lib/utils";
import { useContext } from "react";
import { IoPlay } from "react-icons/io5";
import { Skeleton } from "../ui/skeleton";

export default function SongCard({
    title,
    image,
    artist,
    id,
    desc,
    className,
    imageClassName,
    contextIds,
    contextKey,
}) {
    const ids = useContext(MusicContext);
    const setLastPlayed = () => {
        try {
            localStorage.setItem("last-played", id);
            touchQueue(id);
            if (Array.isArray(contextIds) && contextIds.length) {
                writePlayContext(contextIds, contextKey);
            }
        } catch {
            // ignore
        }
    };
    return (
        <div className={cn("h-fit w-[200px]", className)}>
            <div className="overflow-hidden rounded-md">
                {image ? (
                    <div
                        className="group relative"
                        onClick={() => {
                            ids.setMusic(id);
                            setLastPlayed();
                        }}
                    >
                        <img
                            src={image}
                            alt={title}
                            className={cn(
                                "h-[182px] blurz w-full bg-secondary/60 rounded-md transition group-hover:scale-105 cursor-context-menu",
                                imageClassName
                            )}
                        />

                        {/* Spotify-like hover play */}
                        <div
                            className={cn(
                                "pointer-events-none absolute z-10 bottom-3 right-3",
                                "opacity-0 translate-y-2 scale-95",
                                "group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100",
                                "transition-all duration-200 ease-out"
                            )}
                        >
                            <div className="h-11 w-11 rounded-full bg-[#1DB954] shadow-[0_10px_24px_rgba(0,0,0,0.45)] flex items-center justify-center">
                                <IoPlay className="w-[18px] h-[18px] -mr-0.5 fill-black" />
                            </div>
                        </div>
                    </div>
                ) : (
                    <Skeleton className={cn("w-full h-[182px]", imageClassName)} />
                )}
            </div>
            <div className="cursor-pointer">
                {title ? (
                    <div onClick={() => { ids.setMusic(id); setLastPlayed(); }} className="mt-3 flex items-center justify-between">
                        <h1 className="text-base">{title.slice(0, 20)}{title.length > 20 && '...'}</h1>
                    </div>
                ) : (
                    <Skeleton className="w-[70%] h-4 mt-2" />
                )}
                {desc && (
                    <p className="text-xs text-muted-foreground">{desc.slice(0, 30)}</p>
                )}
                {artist ? (
                    <p className="text-sm font-light text-muted-foreground">{artist.slice(0, 20)}{artist.length > 20 && '...'}</p>
                ) : (
                    <Skeleton className="w-10 h-2 mt-2" />
                )}
            </div>
        </div>
    )
}
