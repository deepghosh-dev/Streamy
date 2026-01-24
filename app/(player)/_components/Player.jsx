"use client";
import Next from "@/components/cards/next";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import {
    useMusicProvider,
    useNextMusicProvider
} from "@/hooks/use-context";
import { getSongsById } from "@/lib/fetch";
import { Download, Play, Repeat, Repeat1, Share2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { IoPause } from "react-icons/io5";
import { toast } from "sonner";

export default function Player({ id }) {
  const [data, setData] = useState([]);
  const { music, audioRef, isPlaying, setIsPlaying, setMusic, current, setCurrent, setDownloadProgress, downloadProgress } =
    useMusicProvider();
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekValue, setSeekValue] = useState(0);
  const isSeekingRef = useRef(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [audioURL, setAudioURL] = useState("");
  const params = useSearchParams();
  const next = useNextMusicProvider();

  const getSong = async () => {
    const get = await getSongsById(id);
    const data = await get.json();
    setData(data.data[0]);
    if (data?.data[0]?.downloadUrl[2]?.url) {
      setAudioURL(data?.data[0]?.downloadUrl[2]?.url);
    } else if (data?.data[0]?.downloadUrl[1]?.url) {
      setAudioURL(data?.data[0]?.downloadUrl[1]?.url);
    } else {
      setAudioURL(data?.data[0]?.downloadUrl[0]?.url);
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  const togglePlayPause = () => {
    const audio = audioRef?.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      try {
        localStorage.setItem("p", "false");
      } catch {
        // ignore
      }
      setIsPlaying(false);
    } else {
      audio.play().catch(() => {});
      try {
        localStorage.setItem("p", "true");
      } catch {
        // ignore
      }
      setIsPlaying(true);
    }
  };

  const downloadSong = async () => {
    if (isDownloading) {
      setDownloadProgress(0);
      setIsDownloading(false);
      return;
    }
    setIsDownloading(true);
    setDownloadProgress(0);

    const response = await fetch(audioURL);
    if (!response.ok) throw new Error("Failed to fetch");

    const contentLength = response.headers.get("Content-Length");
    if (!contentLength) {
      console.warn("No Content-Length header, can't show progress accurately.");
    }

    const total = contentLength ? parseInt(contentLength, 10) : 0;
    let loaded = 0;

    const reader = response.body.getReader();
    const chunks = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        loaded += value.length;

        if (total) {
          const progress = Math.round((loaded / total) * 100);
          setDownloadProgress(progress);
        }
      }
    }

    // Combine chunks into a blob
    const blob = new Blob(chunks);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.name}.mp3`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success("Downloaded!");
    setIsDownloading(false);
    setDownloadProgress(0);
  };

  const handleSeekStart = () => {
    const audio = audioRef?.current;
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
    const audio = audioRef?.current;
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

  const loopSong = () => {
    const audio = audioRef?.current;
    if (!audio) return;
    audio.loop = !audio.loop;
    setIsLooping(audio.loop);
  };

  const handleShare = () => {
    try {
      navigator.share({
        url: `https://${window.location.host}/${data.id}`,
      });
    } catch (e) {
      toast.error("Something went wrong!");
    }
  };

  useEffect(() => {
    getSong();
    // Only switch the global track if it's different.
    // This prevents restarting/auto-playing when opening the player page.
    if (music !== id) {
      setMusic(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, music, setMusic]);

  // Keep UI in sync with the global player's time.
  useEffect(() => {
    if (isSeekingRef.current) return;
    const v = typeof current === "number" && Number.isFinite(current) ? current : 0;
    setCurrentTime(v);
  }, [current]);

  // Read duration from the global audio element (retry until mounted).
  useEffect(() => {
    let cancelled = false;
    let timer;

    const attach = () => {
      if (cancelled) return;
      const audio = audioRef?.current;
      if (!audio) {
        timer = setTimeout(attach, 50);
        return;
      }

      const update = () => {
        try {
          const d = Number.isFinite(audio.duration) ? audio.duration : 0;
          setDuration(d);
        } catch {
          setDuration(0);
        }
      };

      update();
      audio.addEventListener("loadedmetadata", update);
      audio.addEventListener("durationchange", update);

      return () => {
        audio.removeEventListener("loadedmetadata", update);
        audio.removeEventListener("durationchange", update);
      };
    };

    const cleanup = attach();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      if (typeof cleanup === "function") cleanup();
    };
  }, [audioRef, id]);
  useEffect(() => {
    const handleRedirect = () => {
      if (currentTime === duration && !isLooping && duration !== 0) {
        window.location.href = `https://${window.location.host}/${next?.nextData?.id}`;
      }
    };
    if (isLooping || duration === 0) return;
    return handleRedirect();
  }, [currentTime, duration, isLooping, next?.nextData?.id]);
  return (
    <div className="mb-3 mt-10">
      <div className="grid gap-6 w-full">
        <div className="sm:flex px-6 md:px-20 lg:px-32 grid gap-5 w-full">
          <div>
            {data.length <= 0 ? (
              <Skeleton className="md:w-[130px] aspect-square rounded-2xl md:h-[150px]" />
            ) : (
              <div className="relative">
                <img
                  src={data.image[2].url}
                  className="sm:h-[150px] h-full aspect-square bg-secondary/50 rounded-2xl sm:w-[200px] w-full sm:mx-0 mx-auto object-cover"
                />
                <img
                  src={data.image[2].url}
                  className="hidden dark:block absolute top-0 left-0 w-[110%] h-[110%] blur-3xl -z-10 opacity-50"
                />
              </div>
            )}
          </div>
          {data.length <= 0 ? (
            <div className="flex flex-col justify-between w-full">
              <div>
                <Skeleton className="h-4 w-36 mb-2" />
                <Skeleton className="h-3 w-16 mb-4" />
              </div>
              <div>
                <Skeleton className="h-4 w-full rounded-full mb-2" />
                <div className="w-full flex items-center justify-between">
                  <Skeleton className="h-[9px] w-6" />
                  <Skeleton className="h-[9px] w-6" />
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <Skeleton className="h-10 w-10" />
                  <Skeleton className="h-10 w-10" />
                  <Skeleton className="h-10 w-10" />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col justify-between w-full">
              <div className="sm:mt-0 mt-3">
                <h1 className="text-xl font-bold md:max-w-lg">{data.name}</h1>
                <p className="text-sm text-muted-foreground">
                  by{" "}
                  <Link
                    href={
                      "/search/" +
                      `${encodeURI(data.artists.primary[0].name.toLowerCase().split(" ").join("+"))}`
                    }
                    className="text-foreground"
                  >
                    {data.artists.primary[0]?.name || "unknown"}
                  </Link>
                </p>
              </div>
              <div className="grid gap-2 w-full mt-5 sm:mt-0">
                <Slider
                  rangeClassName="bg-[#1DB954]"
                  thumbClassName="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity"
                  trackClassName="h-1"
                  onPointerDown={handleSeekStart}
                  onValueChange={handleSeekChange}
                  onValueCommit={handleSeekCommit}
                  value={[isSeeking ? seekValue : currentTime]}
                  max={duration}
                  className="w-full group"
                />
                <div className="w-full flex items-center justify-between">
                  <span className="text-sm">{formatTime(currentTime)}</span>
                  <span className="text-sm">{formatTime(duration)}</span>
                </div>
                <div className="flex items-center mt-1 justify-between w-full sm:mt-2">
                  <Button
                    variant={isPlaying ? "default" : "secondary"}
                    className="gap-1 rounded-full"
                    onClick={togglePlayPause}
                  >
                    {isPlaying ? (
                      <IoPause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    {isPlaying ? "Pause" : "Play"}
                  </Button>
                  <div className="flex items-center gap-2 sm:gap-3 sm:mt-0">
                    <Button size="icon" variant="ghost" onClick={loopSong}>
                      {!isLooping ? (
                        <Repeat className="h-4 w-4" />
                      ) : (
                        <Repeat1 className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant={!isDownloading ? "ghost" : "secondary"}
                      onClick={downloadSong}
                    >
                      {isDownloading ? (
                        downloadProgress
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                    </Button>
                    <Button size="icon" variant="ghost" onClick={handleShare}>
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {next.nextData && (
        <div className="mt-10 -mb-3 px-6 md:px-20 lg:px-32">
          <Next
            name={next.nextData.name}
            artist={next.nextData.artist}
            image={next.nextData.image}
            id={next.nextData.id}
          />
        </div>
      )}
    </div>
  );
}
