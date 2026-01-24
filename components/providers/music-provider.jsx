"use client";
import { MusicContext } from "@/hooks/use-context";
import { useCallback, useEffect, useRef, useState } from "react";

export default function MusicProvider({ children }) {
  const [music, setMusicState] = useState(null);
  const [current, setCurrent] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const musicRef = useRef(null);
  useEffect(() => {
    musicRef.current = music;
  }, [music]);

  const setMusic = useCallback((id) => {
    // If the user selects another track while paused, the new track should start playing.
    // But simply visiting the player page for the *same* track should NOT force autoplay.
    if (typeof window !== "undefined" && id) {
      let previousId = musicRef.current;
      try {
        if (!previousId) {
          previousId = window.localStorage.getItem("last-played");
        }
      } catch {
        // ignore
      }

      if (id !== previousId) {
        try {
          window.localStorage.setItem("p", "true");
        } catch {
          // ignore
        }
      }
    }
    setMusicState(id);
  }, []);

  useEffect(() => {
    if (localStorage.getItem("last-played")) {
      // Restore last played without forcing autoplay.
      setMusicState(localStorage.getItem("last-played"));
    }
  }, []);

  return (
    <MusicContext.Provider
      value={{
        music,
        setMusic,
        current,
        setCurrent,
        downloadProgress,
        setDownloadProgress,
        audioRef,
        isPlaying,
        setIsPlaying,
      }}
    >
      {children}
    </MusicContext.Provider>
  );
}
