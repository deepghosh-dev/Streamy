"use client";
import { useMusicProvider } from "@/hooks/use-context";
import { getSongsById } from "@/lib/fetch";
import { getPrevNext, getPrevNextFromContext, touchQueue } from "@/lib/queue";
import {
  Download,
  ExternalLink,
  Play,
  Repeat,
  Repeat1,
  SkipBack,
  SkipForward,
  Volume2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { IoPause } from "react-icons/io5";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { Slider } from "../ui/slider";

export default function Player() {
  const [data, setData] = useState([]);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioURL, setAudioURL] = useState("");
  const [isLooping, setIsLooping] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isDownloading, setIsDownloading] = useState(false);
  const { music, setMusic, current, setCurrent } = useMusicProvider();

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  const togglePlayPause = () => {
    if (playing) {
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
    setPlaying(!playing);
  };

  const playTrackById = useCallback((id) => {
    if (!id) return;
    try {
      localStorage.setItem("last-played", id);
      touchQueue(id);
    } catch {
      // ignore
    }
    setMusic(id);
  }, [setMusic]);

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

  const handleSeek = (e) => {
    const seekTime = e[0];
    audioRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
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
    audioRef.current.loop = !audioRef.current.loop;
    setIsLooping(!isLooping);
  };

  useEffect(() => {
    if (!music) return;

    const audio = audioRef.current;
    let cancelled = false;

    const progressKey = `streamy:progress:${music}`;

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

    if (audio) {
      audio.volume = volume;

      // Restore progress per-track (prevents new songs from jumping near the end)
      const saved = Number.parseFloat(localStorage.getItem(progressKey) || "0");
      const restore = () => {
        if (!Number.isFinite(saved) || saved <= 0) return;
        if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
        if (saved >= audio.duration - 1.25) return;
        try {
          audio.currentTime = saved;
          setCurrentTime(saved);
        } catch (e) {
          // ignore
        }
      };

      // If metadata isn't ready yet, this will run once it is.
      audio.addEventListener("loadedmetadata", restore, { once: true });
      restore();
    }

    setPlaying(
      (localStorage.getItem("p") == "true" && true) ||
        (!localStorage.getItem("p") && true)
    );

    const handleTimeUpdate = () => {
      try {
        if (!audio) return;
        setCurrentTime(audio.currentTime);
        setDuration(audio.duration);
        setCurrent(audio.currentTime);

        // Persist progress for this track
        localStorage.setItem(progressKey, String(audio.currentTime || 0));
      } catch (e) {
        setPlaying(false);
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
  }, [music, playTrackById, setCurrent, volume]);
  return (
    <main>
      <audio
        autoPlay={playing}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onLoadedData={() => setDuration(audioRef.current.duration)}
        preload="metadata"
        src={audioURL}
        ref={audioRef}
      ></audio>
      {music && (
        <>
          {/* Mobile: compact card */}
          <div className="shadow-lg fixed grid bottom-0 max-w-[500px] md:border-l md:border-r md:rounded-md md:!rounded-b-none md:ml-auto right-0 left-0 border-border overflow-hidden border-t-none z-50 bg-background gap-3 sm:hidden">
            <div className="w-full">
              {!duration ? (
                <Skeleton className="h-1 w-full" />
              ) : (
                <Slider
                  thumbClassName="hidden"
                  trackClassName="h-1 transition-[height] group-hover:h-2 rounded-none"
                  onValueChange={handleSeek}
                  value={[currentTime]}
                  max={duration}
                  className="w-full group"
                />
              )}
            </div>
            <div className="grid gap-2 p-3 pt-0">
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex items-center gap-2 w-full">
                  <img
                    src={data.image ? data?.image[1]?.url : ""}
                    alt={data?.name}
                    className="rounded-md aspect-square h-12 w-12 bg-secondary hover:opacity-85 transition cursor-pointer"
                  />
                  <div>
                    {!data?.name ? (
                      <Skeleton className="h-4 w-32" />
                    ) : (
                      <Link
                        href={`/${music}`}
                        className="text-base flex hover:opacity-85 transition font-medium gap-2 items-center"
                      >
                        <span className="truncate sm:max-w-[200px] max-w-[150px]">
                          {data?.name}
                        </span>
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      </Link>
                    )}

                    {!data?.artists?.primary[0]?.name ? (
                      <Skeleton className="h-3 w-14 mt-1" />
                    ) : (
                      <h2 className="text-xs -mt-0.5 text-muted-foreground truncate max-w-[180px]">
                        {data?.artists?.primary[0]?.name}
                      </h2>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    className="p-0 h-9 w-9"
                    variant={!isLooping ? "ghost" : "secondary"}
                    onClick={loopSong}
                  >
                    {!isLooping ? (
                      <Repeat className="h-3.5 w-3.5" />
                    ) : (
                      <Repeat1 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <Button
                    size="icon"
                    className="p-0 h-9 w-9"
                    onClick={togglePlayPause}
                  >
                    {playing ? (
                      <IoPause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="icon"
                    className="p-0 h-9 w-9"
                    variant="secondary"
                    onClick={() => {
                      setMusic(null);
                      setCurrent(0);
                      try {
                        localStorage.removeItem("last-played");
                        localStorage.removeItem(`streamy:progress:${music}`);
                      } catch {
                        // ignore
                      }
                      if (audioRef.current) {
                        audioRef.current.currentTime = 0;
                        audioRef.current.src = null;
                      }
                      setAudioURL(null);
                    }}
                  >
                    <X className="h-3.5 w-3.5" />
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
                        className="h-10 w-10 rounded-full bg-white/5 hover:bg-white/10"
                        onClick={playPrev}
                        aria-label="Previous track"
                        title="Previous"
                      >
                        <SkipBack className="h-5 w-5" />
                      </Button>

                      <Button
                        type="button"
                        size="icon"
                        className="h-11 w-11 rounded-full"
                        onClick={togglePlayPause}
                        aria-label={playing ? "Pause" : "Play"}
                        title={playing ? "Pause" : "Play"}
                      >
                        {playing ? (
                          <IoPause className="h-5 w-5" />
                        ) : (
                          <Play className="h-5 w-5" />
                        )}
                      </Button>

                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-10 w-10 rounded-full bg-white/5 hover:bg-white/10"
                        onClick={playNext}
                        aria-label="Next track"
                        title="Next"
                      >
                        <SkipForward className="h-5 w-5" />
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
                            thumbClassName="hidden"
                            trackClassName="h-1 bg-white/10"
                            onValueChange={handleSeek}
                            value={[currentTime]}
                            max={duration}
                            className="w-full"
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
                        thumbClassName="h-3 w-3"
                        trackClassName="h-1 bg-white/10"
                        className="w-full"
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
                          localStorage.removeItem(`streamy:progress:${music}`);
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
