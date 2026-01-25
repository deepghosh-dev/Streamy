"use client";
import { useMusicProvider } from "@/hooks/use-context";
import { getSongsById } from "@/lib/fetch";
import { getPrevNext, getPrevNextFromContext, touchQueue } from "@/lib/queue";
import {
    Download,
    ExternalLink,
    Repeat,
    Repeat1,
    Volume2,
    X
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { IoPause, IoPlay } from "react-icons/io5";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { Slider } from "../ui/slider";

function DoubleSkipBackIcon({ className }) {
  return (
    <svg
      width="28"
      height="24"
      viewBox="0 0 28 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M14.2 4.8C14.2 4 13.3 3.6 12.7 4.1L2.6 11.3C2.1 11.7 2.1 12.3 2.6 12.7L12.7 19.9C13.3 20.4 14.2 20 14.2 19.2V4.8Z M26 4.8C26 4 25.1 3.6 24.5 4.1L14.4 11.3C13.9 11.7 13.9 12.3 14.4 12.7L24.5 19.9C25.1 20.4 26 20 26 19.2V4.8Z"
        fill="currentColor"
      />
    </svg>
  );
}

function DoubleSkipForwardIcon({ className }) {
  return (
    <svg
      width="28"
      height="24"
      viewBox="0 0 28 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <g transform="translate(28 0) scale(-1 1)">
        <path
          d="M14.2 4.8C14.2 4 13.3 3.6 12.7 4.1L2.6 11.3C2.1 11.7 2.1 12.3 2.6 12.7L12.7 19.9C13.3 20.4 14.2 20 14.2 19.2V4.8Z M26 4.8C26 4 25.1 3.6 24.5 4.1L14.4 11.3C13.9 11.7 13.9 12.3 14.4 12.7L24.5 19.9C25.1 20.4 26 20 26 19.2V4.8Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default function Player() {
  const [data, setData] = useState([]);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioURL, setAudioURL] = useState("");
  const [isLooping, setIsLooping] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekValue, setSeekValue] = useState(0);
  const isSeekingRef = useRef(false);
  const { music, setMusic, current, setCurrent, audioRef, isPlaying, setIsPlaying } = useMusicProvider();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Safety net: when switching tracks while in "playing" state, explicitly start playback.
  // Relying on the <audio autoPlay> attribute alone can be flaky after an 'ended' -> src swap.
  useEffect(() => {
    const audio = audioRef?.current;
    if (!audio) return;
    if (!audioURL) return;
    if (!isPlaying) return;
    audio.play().catch(() => {});
  }, [audioURL, isPlaying, audioRef]);

  const hideUiOnSongPage =
    !!pathname &&
    /^\/[^/]+$/.test(pathname) &&
    pathname !== "/" &&
    pathname !== "/search" &&
    pathname !== "/profile";

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  const togglePlayPause = () => {
    if (!audioRef?.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      try {
        localStorage.setItem("p", "false");
      } catch {
        // ignore
      }
    } else {
      audioRef.current.play();
      try {
        localStorage.setItem("p", "true");
      } catch {
        // ignore
      }
    }
    setIsPlaying(!isPlaying);
  };

  const playTrackById = useCallback(
    (id) => {
      if (!id) return;
      try {
        // Selecting/advancing tracks should always start playback.
        // This also fixes the case where the previous track ended (pause event flips
        // state) before we swap the src for the next track.
        localStorage.setItem("p", "true");
        localStorage.setItem("last-played", id);
        touchQueue(id);
      } catch {
        // ignore
      }
      setIsPlaying(true);
      setMusic(id);
    },
    [setMusic, setIsPlaying]
  );

  const playPrev = () => {
    const { prevId } = getPrevNextFromContext(music);
    const fallback = prevId ? null : getPrevNext(music).prevId;
    const id = prevId || fallback;
    if (id) playTrackById(id);
  };

  const playNext = () => {
    const { nextId } = getPrevNextFromContext(music);
    const fallback = nextId ? null : getPrevNext(music).nextId;
    const id = nextId || fallback;
    if (id) playTrackById(id);
  };

  const downloadSong = async () => {
    if (!audioURL || isDownloading) return;
    setIsDownloading(true);
    try {
      const res = await fetch(audioURL);
      if (!res.ok) throw new Error("Failed to fetch");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeName = String(data?.name || "streamy").replace(/[\\/:*?\"<>|]/g, "_");
      a.download = `${safeName}.mp3`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      // Fallback: open the stream URL
      try {
        window.open(audioURL, "_blank", "noopener,noreferrer");
      } catch {
        // ignore
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSeekStart = () => {
    const audio = audioRef.current;
    if (!audio) return;
    isSeekingRef.current = true;
    setIsSeeking(true);
    const now = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
    setSeekValue(now);
  };

  const handleSeekChange = (values) => {
    const seekTime = values?.[0] ?? 0;
    setSeekValue(seekTime);
    setCurrentTime(seekTime);
  };

  const handleSeekCommit = (values) => {
    const audio = audioRef.current;
    const seekTime = values?.[0] ?? 0;
    if (audio) {
      try {
        audio.currentTime = seekTime;
      } catch {
        // ignore
      }
    }
    setCurrentTime(seekTime);
    setCurrent(seekTime);
    isSeekingRef.current = false;
    setIsSeeking(false);
  };

  const handleVolume = (e) => {
    const v = e?.[0] ?? 1;
    setVolume(v);
    if (audioRef.current) {
      audioRef.current.volume = v;
    }
  };

  const skipBy = (seconds) => {
    if (!audioRef.current) return;
    try {
      const audio = audioRef.current;
      const dur = Number.isFinite(audio.duration) ? audio.duration : duration;
      const next = Math.min(Math.max(0, (audio.currentTime || 0) + seconds), dur);
      audio.currentTime = next;
      setCurrentTime(next);
      setCurrent(next);
    } catch (e) {
      // no-op
    }
  };

  const loopSong = () => {
    if (!audioRef?.current) return;
    audioRef.current.loop = !audioRef.current.loop;
    setIsLooping(!audioRef.current.loop);
  };

  // Keep volume changes from re-initializing the current track
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      audio.volume = volume;
    } catch {
      // ignore
    }
  }, [volume]);

  useEffect(() => {
    if (!music) return;

    const audio = audioRef.current;
    let cancelled = false;

    // New track: always reset UI + global progress to 0
    isSeekingRef.current = false;
    setIsSeeking(false);
    setSeekValue(0);
    setCurrentTime(0);
    setDuration(0);
    setCurrent(0);
    if (audio) {
      try {
        audio.currentTime = 0;
      } catch {
        // ignore
      }
    }

    const getSong = async () => {
      const res = await getSongsById(music);
      const json = await res.json();
      if (cancelled) return;

      setData(json.data[0]);
      const url =
        json?.data?.[0]?.downloadUrl?.[2]?.url ||
        json?.data?.[0]?.downloadUrl?.[1]?.url ||
        json?.data?.[0]?.downloadUrl?.[0]?.url ||
        "";
      setAudioURL(url);
    };

    getSong();

    // Ensure the current track is part of the queue
    try {
      touchQueue(music);
    } catch {
      // ignore
    }

    // volume is handled in a separate effect to avoid re-initializing the track

    setIsPlaying(
      (localStorage.getItem("p") == "true" && true) ||
        (!localStorage.getItem("p") && true)
    );

    const handleTimeUpdate = () => {
      try {
        if (!audio) return;
        if (!isSeekingRef.current) {
          setCurrentTime(audio.currentTime);
        }
        setDuration(audio.duration);
        setCurrent(audio.currentTime);
      } catch (e) {
        setIsPlaying(false);
      }
    };

    audio?.addEventListener("timeupdate", handleTimeUpdate);

    const handleEnded = () => {
      // If there is a next track in queue and not looping, go next.
      if (audio?.loop) return;
      const fromContext = getPrevNextFromContext(music).nextId;
      const fromQueue = getPrevNext(music).nextId;
      const id = fromContext || fromQueue;
      if (id) playTrackById(id);
    };
    audio?.addEventListener("ended", handleEnded);
    return () => {
      cancelled = true;
      audio?.removeEventListener("timeupdate", handleTimeUpdate);
      audio?.removeEventListener("ended", handleEnded);
    };
  }, [music, playTrackById, setCurrent]);
  return (
    <main>
      <audio
        autoPlay={isPlaying}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onLoadedData={() => setDuration(audioRef.current.duration)}
        preload="metadata"
        src={audioURL}
        ref={audioRef}
      ></audio>

        {mounted && music && !hideUiOnSongPage && (
          <>
          {/* Mobile (phone): pill mini player above bottom nav */}
          <div className="sm:hidden fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-[calc(78px+86px+78px+56px+12px+16px)] max-w-[calc(100vw-24px)]">
            <div className="relative overflow-hidden rounded-full bg-white/10 backdrop-blur-xl border border-white/15 shadow-[0_10px_50px_rgba(0,0,0,0.65)]">
              <div aria-hidden className="pointer-events-none absolute inset-0 opacity-70 bg-[linear-gradient(-45deg,rgba(255,255,255,0.14),rgba(255,255,255,0.04),rgba(255,255,255,0.02))]" />

              <div className="relative flex items-center justify-between gap-3 px-2 py-2">
                <button
                  type="button"
                  className="flex items-center gap-2 min-w-0 flex-1 text-left"
                  onClick={() => {
                    router.push(`/${music}`);
                  }}
                >
                  <img
                    src={data?.image?.[1]?.url || data?.image?.[0]?.url || ""}
                    alt={data?.name || "song"}
                    className="h-10 w-10 rounded-full object-cover bg-white/10 flex-shrink-0"
                    loading="lazy"
                    draggable={false}
                  />
                  <div className="min-w-0">
                    {!data?.name ? (
                      <Skeleton className="h-4 w-32" />
                    ) : (
                      <div className="truncate text-sm font-semibold">
                        {data?.name}
                      </div>
                    )}
                    {!data?.artists?.primary?.[0]?.name ? (
                      <Skeleton className="h-3 w-20 mt-1" />
                    ) : (
                      <div className="truncate text-[11px] text-muted-foreground">
                        {data?.artists?.primary?.[0]?.name}
                      </div>
                    )}
                  </div>
                </button>

                <div className="relative flex items-center gap-2 shrink-0">
                  {/* soft blur highlight behind controls */}
                  <div aria-hidden className="pointer-events-none absolute -inset-x-6 inset-y-0 rounded-full bg-white/10 blur-md" />

                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full bg-transparent border-0 text-white hover:bg-white/10 active:scale-95 focus-visible:ring-0"
                    onClick={playPrev}
                    aria-label="Previous"
                    title="Previous"
                  >
                    <DoubleSkipBackIcon className="h-6 w-6" />
                  </Button>

                  <Button
                    type="button"
                    size="icon"
                    className="relative h-10 w-10 rounded-full bg-transparent border-0 text-white hover:bg-white/10 active:scale-95 focus-visible:ring-0"
                    onClick={togglePlayPause}
                    aria-label={isPlaying ? "Pause" : "Play"}
                    title={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? (
                      <IoPause className="h-7 w-7 text-white" />
                    ) : (
                      <IoPlay className="h-7 w-7 text-white translate-x-[1px]" />
                    )}
                  </Button>

                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full bg-transparent border-0 text-white hover:bg-white/10 active:scale-95 focus-visible:ring-0"
                    onClick={playNext}
                    aria-label="Next"
                    title="Next"
                  >
                    <DoubleSkipForwardIcon className="h-6 w-6" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop/Windows: wide glass bar (matches screenshot) */}
          <div className="hidden sm:block fixed left-0 right-0 bottom-4 z-50 px-6">
            <div className="mx-auto w-full max-w-[1440px]">
              {/* Glass properties approximation (angle -45, frost ~18) */}
              <div className="relative overflow-hidden rounded-full bg-black/25 backdrop-blur-[18px] shadow-[0_16px_46px_rgba(0,0,0,0.60)]">
                <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(-45deg,rgba(255,255,255,0.16),rgba(255,255,255,0.04),rgba(255,255,255,0.02))]" />
                <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(800px_circle_at_18%_0%,rgba(56,189,248,0.14),transparent_55%),radial-gradient(700px_circle_at_85%_20%,rgba(217,70,239,0.10),transparent_60%)]" />
                <div aria-hidden className="pointer-events-none absolute inset-0 opacity-40 bg-[radial-gradient(600px_circle_at_40%_120%,rgba(16,185,129,0.10),transparent_60%)]" />

                <div className="relative flex items-center gap-6 px-3 py-2.5">
                  {/* Left: track info */}
                  <div className="flex items-center gap-4 min-w-0 w-[340px]">
                    <img
                      src={data.image ? data?.image[1]?.url : ""}
                      alt={data?.name}
                      className="h-[76px] w-[76px] rounded-full bg-white/10 flex-shrink-0 object-cover object-center"
                    />
                    <div className="min-w-0">
                      {!data?.name ? (
                        <Skeleton className="h-4 w-48" />
                      ) : (
                        <Link
                          href={`/${music}`}
                          className="flex items-center gap-2 text-base font-semibold hover:opacity-85 transition min-w-0"
                        >
                          <span className="truncate">{data?.name}</span>
                          <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        </Link>
                      )}

                      {!data?.artists?.primary?.[0]?.name ? (
                        <Skeleton className="h-3 w-24 mt-1" />
                      ) : (
                        <div className="text-sm text-muted-foreground truncate">
                          {data?.artists?.primary?.[0]?.name}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Center: controls + progress */}
                  <div className="flex-1 min-w-0">
                    <div className="mx-auto w-full max-w-[560px]">
                      <div className="flex items-center justify-center gap-3">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-10 w-10 rounded-full bg-black/40 text-white backdrop-blur-md border border-white/10 hover:bg-black/50 hover:border-white/15 transition active:scale-95"
                          onClick={playPrev}
                          aria-label="Previous track"
                          title="Previous"
                        >
                          <DoubleSkipBackIcon className="h-5 w-5" />
                        </Button>

                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-11 w-11 rounded-full bg-[#1DB954] text-black hover:bg-[#1ed760] shadow-lg shadow-black/30 transition active:scale-95"
                          onClick={togglePlayPause}
                          aria-label={isPlaying ? "Pause" : "Play"}
                          title={isPlaying ? "Pause" : "Play"}
                        >
                          {isPlaying ? (
                            <IoPause className="h-5 w-5 text-black" />
                          ) : (
                            <IoPlay className="h-5 w-5 text-black translate-x-[1px]" />
                          )}
                        </Button>

                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-10 w-10 rounded-full bg-black/40 text-white backdrop-blur-md border border-white/10 hover:bg-black/50 hover:border-white/15 transition active:scale-95"
                          onClick={playNext}
                          aria-label="Next track"
                          title="Next"
                        >
                          <DoubleSkipForwardIcon className="h-5 w-5" />
                        </Button>
                      </div>

                      <div className="mt-2 flex items-center gap-3">
                      <div className="w-[44px] text-[11px] tabular-nums text-muted-foreground text-right">
                        {duration ? formatTime(currentTime) : "--:--"}
                      </div>
                      <div className="min-w-0 flex-1">
                        {!duration ? (
                          <Skeleton className="h-1 w-full" />
                        ) : (
                          <Slider
                            thumbClassName="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity"
                            rangeClassName="bg-[#1DB954]"
                            trackClassName="h-1 bg-white/10"
                            onPointerDown={handleSeekStart}
                            onValueChange={handleSeekChange}
                            onValueCommit={handleSeekCommit}
                            value={[isSeeking ? seekValue : currentTime]}
                            max={duration}
                            className="w-full group"
                          />
                        )}
                      </div>
                      <div className="w-[44px] text-[11px] tabular-nums text-muted-foreground">
                        {duration ? formatTime(duration) : "--:--"}
                      </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: volume + actions */}
                  <div className="flex items-center justify-end gap-3 w-[340px]">
                    <Button
                      type="button"
                      size="icon"
                      className="h-10 w-10 rounded-full"
                      variant={!isLooping ? "ghost" : "secondary"}
                      onClick={loopSong}
                      aria-label={isLooping ? "Looping on" : "Looping off"}
                      title="Loop"
                    >
                      {!isLooping ? (
                        <Repeat className="h-4 w-4" />
                      ) : (
                        <Repeat1 className="h-4 w-4" />
                      )}
                    </Button>

                    <div className="hidden lg:flex items-center gap-2 w-[180px]">
                      <Volume2 className="h-4 w-4 text-muted-foreground" />
                      <Slider
                        value={[volume]}
                        onValueChange={handleVolume}
                        max={1}
                        min={0}
                        step={0.01}
                        thumbClassName="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity"
                        rangeClassName="bg-[#1DB954]"
                        trackClassName="h-1 bg-white/10"
                        className="w-full group"
                      />
                    </div>

                    <Button
                      type="button"
                      size="icon"
                      className="h-10 w-10 rounded-full bg-white/5 hover:bg-white/10"
                      variant="ghost"
                      onClick={downloadSong}
                      disabled={!audioURL || isDownloading}
                      aria-label="Download"
                      title={isDownloading ? "Downloading..." : "Download"}
                    >
                      <Download className="h-5 w-5" />
                    </Button>

                    <Button
                      type="button"
                      size="icon"
                      className="h-10 w-10 rounded-full"
                      variant="secondary"
                      onClick={() => {
                        setMusic(null);
                        setCurrent(0);
                        try {
                          localStorage.removeItem("last-played");
                        } catch {
                          // ignore
                        }
                        if (audioRef.current) {
                          audioRef.current.currentTime = 0;
                          audioRef.current.src = null;
                        }
                        setAudioURL(null);
                      }}
                      aria-label="Close"
                      title="Close"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
