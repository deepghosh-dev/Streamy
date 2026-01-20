"use client";
import { MusicContext } from "@/hooks/use-context";
import { useCallback, useEffect, useState } from "react";

export default function MusicProvider({ children }) {
  const [music, setMusicState] = useState(null);
  const [current, setCurrent] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const setMusic = useCallback((id) => {
    // If the user selects another track while paused, the new track should start playing.
    // We only force-play for valid track ids (not for clearing the player).
    if (typeof window !== "undefined" && id) {
      try {
        window.localStorage.setItem("p", "true");
      } catch {
        // ignore
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
      }}
    >
      {children}
    </MusicContext.Provider>
  );
}
