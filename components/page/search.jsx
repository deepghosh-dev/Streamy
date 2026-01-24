"use client";
import { getSongsByQueryWithOptions } from "@/lib/fetch";
import { cn } from "@/lib/utils";
import { SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

const MAX_SUGGESTIONS = 8;
const HISTORY_KEY = "search-history";
const MAX_HISTORY = 10;
const RECENTS_KEY = "search-recents";
const MAX_RECENTS = 20;
const BACK_TO_KEY = "streamy-back-to";

const readHistory = () => {
    try {
        const raw = localStorage.getItem(HISTORY_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
    } catch {
        return [];
    }
};

const writeHistory = (items) => {
    try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
        window.dispatchEvent(new Event("search-history-updated"));
    } catch {
        // ignore
    }
};

const readRecents = () => {
    try {
        const raw = localStorage.getItem(RECENTS_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const writeRecents = (items) => {
    try {
        localStorage.setItem(RECENTS_KEY, JSON.stringify(items));
        window.dispatchEvent(new Event("search-recents-updated"));
    } catch {
        // ignore
    }
};

export default function Search({
    placeholder = "Try Maharani..",
    inputClassName,
    buttonClassName,
}) {
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [history, setHistory] = useState([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const abortRef = useRef(null);
    const debounceRef = useRef(null);
    const router = useRouter();

    const inpRef = useRef();

    const normalizedQuery = query.trim();

    useEffect(() => {
        setHistory(readHistory());
    }, []);

    const rememberBackTo = () => {
        try {
            const path = window.location?.pathname || "/";
            try {
                sessionStorage.setItem(BACK_TO_KEY, path);
            } catch {
                localStorage.setItem(BACK_TO_KEY, path);
            }
        } catch {
            // ignore
        }
    };

    const addRecentQuery = (term) => {
        const value = String(term || "").trim();
        if (!value) return;
        const now = Date.now();
        const prev = readRecents();
        const filtered = prev.filter((it) => !(it?.type === "query" && String(it.term || "").toLowerCase() === value.toLowerCase()));
        const next = [{ type: "query", term: value, ts: now }, ...filtered].slice(0, MAX_RECENTS);
        writeRecents(next);
    };

    const addRecentSong = (song) => {
        const id = String(song?.id || "").trim();
        if (!id) return;
        const now = Date.now();
        const image = song?.image?.[1]?.url || song?.image?.[0]?.url || "";
        const subtitle = song?.artists?.primary?.[0]?.name
            ? `Song • ${song.artists.primary[0].name}`
            : "Song";
        const prev = readRecents();
        const filtered = prev.filter((it) => !(it?.type === "song" && String(it.id || "") === id));
        const next = [{ type: "song", id, name: String(song?.name || ""), subtitle, image, ts: now }, ...filtered].slice(0, MAX_RECENTS);
        writeRecents(next);
    };

    const addToHistory = (term) => {
        const value = String(term || "").trim();
        if (!value) return;

        setHistory((prev) => {
            const next = [value, ...prev.filter((x) => x.toLowerCase() !== value.toLowerCase())].slice(0, MAX_HISTORY);
            writeHistory(next);
            return next;
        });
    };

    const removeFromHistory = (term) => {
        const value = String(term || "");
        setHistory((prev) => {
            const next = prev.filter((x) => x !== value);
            writeHistory(next);
            return next;
        });
    };

    const clearHistory = () => {
        writeHistory([]);
        setHistory([]);
    };

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (abortRef.current) abortRef.current.abort();

        if (!normalizedQuery) {
            setSuggestions([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setOpen(true);

        debounceRef.current = setTimeout(async () => {
            const controller = new AbortController();
            abortRef.current = controller;
            try {
                const res = await getSongsByQueryWithOptions(normalizedQuery, {
                    signal: controller.signal,
                    cache: "no-store",
                });

                const data = await res?.json();
                const results = data?.data?.results || [];
                setSuggestions(results.slice(0, MAX_SUGGESTIONS));
            } catch (e) {
                if (e?.name !== "AbortError") {
                    setSuggestions([]);
                }
            } finally {
                setLoading(false);
            }
        }, 250);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            if (abortRef.current) abortRef.current.abort();
        };
    }, [normalizedQuery]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!normalizedQuery) {
            router.push("/");
            return;
        }
        addToHistory(normalizedQuery);
        addRecentQuery(normalizedQuery);
        router.push(`/search/${encodeURIComponent(normalizedQuery)}`);
        inpRef.current.blur();
        setQuery("");
        setOpen(false);
    };

    const goToSong = (song) => {
        const id = song?.id;
        if (!id) return;
        addRecentSong(song);
        rememberBackTo();
        router.push(`/${id}`);
        inpRef.current?.blur();
        setQuery("");
        setOpen(false);
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="flex items-center relative z-20 w-full">
                <Button
                    variant="ghost"
                    type="submit"
                    size="icon"
                    className={cn(
                        "absolute right-0 rounded-xl rounded-l-none bg-none",
                        buttonClassName
                    )}
                >
                    <SearchIcon className="w-4 h-4" />
                </Button>
                <Input
                    ref={inpRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => {
                        setOpen(true);
                    }}
                    onBlur={() => {
                        setTimeout(() => setOpen(false), 120);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Escape") {
                            setOpen(false);
                            inpRef.current?.blur();
                        }
                    }}
                    autoComplete="off"
                    type="search"
                    className={cn("rounded-lg bg-secondary/50", inputClassName)}
                    name="query"
                    placeholder={placeholder}
                />

                {open && (loading || suggestions.length > 0 || normalizedQuery || history.length > 0) && (
                    <div
                        className="absolute left-0 right-0 top-full mt-2 overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-lg"
                        onMouseDown={(e) => e.preventDefault()}
                    >
                        <div className="px-3 py-2 text-xs text-muted-foreground border-b flex items-center justify-between gap-3">
                            <div className="truncate">
                                {normalizedQuery ? (loading ? "Searching…" : `Results for \"${normalizedQuery}\"`) : "Recent searches"}
                            </div>
                            {!normalizedQuery && history.length > 0 && (
                                <button
                                    type="button"
                                    className="text-xs hover:underline"
                                    onClick={() => clearHistory()}
                                >
                                    Clear
                                </button>
                            )}
                        </div>

                        <div className="max-h-80 overflow-auto">
                            {normalizedQuery ? (
                                <button
                                    type="button"
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                                    onClick={() => {
                                        addToHistory(normalizedQuery);
                                        addRecentQuery(normalizedQuery);
                                        router.push(`/search/${encodeURIComponent(normalizedQuery)}`);
                                        inpRef.current?.blur();
                                        setQuery("");
                                        setOpen(false);
                                    }}
                                >
                                    Search for “{normalizedQuery}”
                                </button>
                            ) : (
                                history.map((term) => (
                                    <div key={term} className="flex items-center">
                                        <button
                                            type="button"
                                            className="flex-1 text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                                            onClick={() => {
                                                addToHistory(term);
                                                addRecentQuery(term);
                                                router.push(`/search/${encodeURIComponent(term)}`);
                                                inpRef.current?.blur();
                                                setQuery("");
                                                setOpen(false);
                                            }}
                                        >
                                            {term}
                                        </button>
                                        <button
                                            type="button"
                                            aria-label="Remove from history"
                                            className="px-3 py-2 text-muted-foreground hover:text-foreground"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                removeFromHistory(term);
                                            }}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))
                            )}

                            {suggestions.map((song) => (
                                <button
                                    key={song.id}
                                    type="button"
                                    className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground"
                                    onClick={() => goToSong(song)}
                                >
                                    <img
                                        src={song.image?.[1]?.url || song.image?.[0]?.url}
                                        alt={song.name}
                                        className="h-9 w-9 rounded-md object-cover bg-secondary"
                                        loading="lazy"
                                    />
                                    <div className="min-w-0">
                                        <div className="truncate text-sm font-medium">{song.name}</div>
                                        <div className="truncate text-xs text-muted-foreground">
                                            {song.artists?.primary?.[0]?.name || "unknown"}
                                        </div>
                                    </div>
                                </button>
                            ))}

                            {!loading && normalizedQuery && suggestions.length === 0 && (
                                <div className="px-3 py-3 text-sm text-muted-foreground">No songs found.</div>
                            )}
                        </div>
                    </div>
                )}
            </form>
        </>
    )
}