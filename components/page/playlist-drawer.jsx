"use client";

import { ListMusic, Plus, Trash2 } from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "streamy.ui.playlists";

const safeRead = () => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const safeWrite = (items) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
};

export default function PlaylistDrawer({
  triggerClassName,
  panelClassName,
  title = "Playlists",
  triggerLabel,
  triggerIconClassName,
  triggerTextClassName,
}) {
  const [open, setOpen] = React.useState(false);
  const [playlists, setPlaylists] = React.useState([]);
  const [creating, setCreating] = React.useState(false);
  const [name, setName] = React.useState("");
  const [isPublic, setIsPublic] = React.useState(false);

  React.useEffect(() => {
    setPlaylists(safeRead());
  }, []);

  React.useEffect(() => {
    safeWrite(playlists);
  }, [playlists]);

  const createPlaylist = () => {
    const trimmed = String(name || "").trim();
    if (!trimmed) return;

    const next = [
      {
        id: `pl_${Date.now()}`,
        name: trimmed,
        visibility: isPublic ? "public" : "private",
        createdAt: Date.now(),
      },
      ...playlists,
    ];

    setPlaylists(next);
    setName("");
    setIsPublic(false);
    setCreating(false);
  };

  const deletePlaylist = (id) => {
    if (!id) return;
    setPlaylists((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Playlists"
          title="Playlists"
          className={cn(
            "h-10 w-10 rounded-full flex items-center justify-center transition",
            "bg-white/10 hover:bg-white/15 border border-white/10",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20",
            triggerClassName
          )}
        >
          <ListMusic className={cn("h-5 w-5", triggerIconClassName)} />
          {triggerLabel ? (
            <span
              className={cn(
                "mt-0.5 text-[10px] font-medium text-foreground/80",
                triggerTextClassName
              )}
            >
              {triggerLabel}
            </span>
          ) : null}
        </button>
      </SheetTrigger>

      <SheetContent
        side="left"
        overlayClassName="bg-black/50 backdrop-blur-sm"
        className={cn(
          "p-0",
          "bg-white/6 backdrop-blur-2xl border-r border-white/10",
          "shadow-[0_10px_80px_rgba(0,0,0,0.55)]",
          panelClassName
        )}
      >
        <div className="h-full flex flex-col">
          <SheetHeader className="px-5 pt-5 pb-3 border-b border-white/10">
            <SheetTitle className="text-foreground/95">{title}</SheetTitle>
            <div className="mt-3 flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                className="h-9 rounded-full bg-white/10 hover:bg-white/15 border border-white/10"
                onClick={() => setCreating((v) => !v)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Playlist
              </Button>

              <button
                type="button"
                className={cn(
                  "text-xs px-3 h-9 rounded-full border border-white/10",
                  "bg-white/5 hover:bg-white/10 text-foreground/80"
                )}
                onClick={() => setIsPublic((v) => !v)}
                aria-label="Toggle public/private"
                title="Public/Private"
              >
                {isPublic ? "Public" : "Private"}
              </button>
            </div>

            {creating && (
              <form
                className="mt-3 flex items-center gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  createPlaylist();
                }}
              >
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Playlist name"
                  className="h-9 rounded-full bg-white/10 border-white/10 focus-visible:ring-0"
                />
                <Button
                  type="submit"
                  className="h-9 rounded-full"
                  disabled={!String(name || "").trim()}
                >
                  Create
                </Button>
              </form>
            )}
          </SheetHeader>

          <ScrollArea className="flex-1 px-2 py-3">
            {playlists.length === 0 ? (
              <div className="px-3 py-6 text-sm text-muted-foreground">
                No playlists yet.
              </div>
            ) : (
              <div className="space-y-1">
                {playlists.map((pl) => (
                  <div
                    key={pl.id}
                    className={cn(
                      "w-full px-3 py-2 rounded-xl text-left",
                      "hover:bg-white/10 transition",
                      "border border-transparent hover:border-white/10"
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-foreground/95">
                          {pl.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {pl.visibility === "public" ? "Public" : "Private"}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          variant="secondary"
                          className="bg-white/10 border border-white/10 text-foreground/85"
                        >
                          {pl.visibility === "public" ? "Public" : "Private"}
                        </Badge>

                        <button
                          type="button"
                          className={cn(
                            "h-9 w-9 rounded-full inline-flex items-center justify-center",
                            "bg-white/5 hover:bg-white/10 border border-white/10",
                            "text-foreground/80 hover:text-foreground"
                          )}
                          aria-label={`Delete ${pl.name}`}
                          title="Delete"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();

                            const ok = window.confirm(
                              `Delete playlist "${pl.name}"? This can't be undone.`
                            );
                            if (!ok) return;
                            deletePlaylist(pl.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}
