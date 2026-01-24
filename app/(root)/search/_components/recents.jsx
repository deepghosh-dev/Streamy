"use client";

import { cn } from "@/lib/utils";
import { SearchIcon, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const RECENTS_KEY = "search-recents";
const BACK_TO_KEY = "streamy-back-to";

function readRecents() {
  try {
    const raw = localStorage.getItem(RECENTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeRecents(items) {
  try {
    localStorage.setItem(RECENTS_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event("search-recents-updated"));
  } catch {
    // ignore
  }
}

export default function SearchRecents({ className }) {
  const router = useRouter();
  const [items, setItems] = useState([]);

  const normalized = useMemo(() => {
    // sanitize/normalize unknown historical shapes
    return (Array.isArray(items) ? items : [])
      .map((it) => {
        if (!it || typeof it !== "object") return null;
        if (it.type === "song" && it.id) {
          return {
            type: "song",
            id: String(it.id),
            name: String(it.name || ""),
            subtitle: String(it.subtitle || "Song"),
            image: String(it.image || ""),
            ts: Number(it.ts || 0),
          };
        }
        if (it.type === "query" && it.term) {
          return {
            type: "query",
            term: String(it.term),
            ts: Number(it.ts || 0),
          };
        }
        return null;
      })
      .filter(Boolean);
  }, [items]);

  useEffect(() => {
    const refresh = () => setItems(readRecents());
    refresh();

    const onUpdate = () => refresh();
    window.addEventListener("search-recents-updated", onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener("search-recents-updated", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, []);

  const clearAll = () => {
    writeRecents([]);
    setItems([]);
  };

  const removeOne = (target) => {
    const next = normalized.filter((it) => {
      if (target.type === "song" && it.type === "song") return it.id !== target.id;
      if (target.type === "query" && it.type === "query") return it.term !== target.term;
      return true;
    });
    writeRecents(next);
    setItems(next);
  };

  const rowClick = (it) => {
    if (it.type === "song") {
      try {
        const path = window.location?.pathname || "/search";
        try {
          sessionStorage.setItem(BACK_TO_KEY, path);
        } catch {
          localStorage.setItem(BACK_TO_KEY, path);
        }
      } catch {
        // ignore
      }
      router.push(`/${it.id}`);
      return;
    }
    router.push(`/search/${encodeURIComponent(it.term)}`);
  };

  if (!normalized.length) return null;

  return (
    <section className={cn("mt-6 w-full max-w-[720px]", className)}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Recents</h2>
        <button
          type="button"
          onClick={clearAll}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Clear
        </button>
      </div>

      <div className="space-y-1">
        {normalized.map((it) => {
          const key = it.type === "song" ? `song:${it.id}` : `q:${it.term}`;
          return (
            <div
              key={key}
              className={cn(
                "flex items-center gap-3 rounded-xl px-2 py-2",
                "hover:bg-white/5 transition"
              )}
            >
              <button
                type="button"
                className="flex items-center gap-3 min-w-0 flex-1 text-left"
                onClick={() => rowClick(it)}
              >
                {it.type === "song" ? (
                  <img
                    src={it.image || ""}
                    alt={it.name || "song"}
                    className="h-12 w-12 rounded-md object-cover bg-white/10"
                    loading="lazy"
                    draggable={false}
                  />
                ) : (
                  <div className="h-12 w-12 rounded-md bg-white/10 flex items-center justify-center">
                    <SearchIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}

                <div className="min-w-0">
                  <div className="truncate text-[15px] font-medium">
                    {it.type === "song" ? it.name : it.term}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {it.type === "song" ? it.subtitle : "Search"}
                  </div>
                </div>
              </button>

              <div className="flex items-center">
                <button
                  type="button"
                  aria-label="Remove"
                  className="h-9 w-9 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 flex items-center justify-center"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    removeOne(it);
                  }}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
