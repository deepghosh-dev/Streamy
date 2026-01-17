"use client";

import { Home, User2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import Search from "@/components/page/search";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/branding";
import { cn } from "@/lib/utils";

export default function SpotifyShell({ children }) {
  const router = useRouter();

  return (
    <div className="min-h-screen w-full bg-background">
      <div
        className={cn(
          "min-h-screen w-full",
          // atmosphere: deep ink + acid-lime glow (no generic purple)
          "bg-[radial-gradient(900px_circle_at_20%_0%,rgba(34,197,94,0.16),transparent_60%),radial-gradient(700px_circle_at_80%_10%,rgba(250,204,21,0.10),transparent_55%),linear-gradient(to_bottom,rgba(9,9,11,0.2),rgba(9,9,11,0.9))]"
        )}
      >
        <div className="w-full p-0">
          <div className="w-full">
            <div className="rounded-none bg-black/25 border-y border-white/5 backdrop-blur-xl">
              {/* Top bar */}
              <div className="sticky top-0 z-40 bg-black/25 backdrop-blur-xl border-b border-white/5">
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-6 sm:px-10 md:px-10 py-2">
                  <div className="flex items-center">
                    <Link
                      href="/"
                      aria-label={APP_NAME}
                      title={APP_NAME}
                      className={cn(
                        "h-10 inline-flex items-center text-xl sm:text-2xl font-bold tracking-tight leading-none",
                        "text-foreground/95 hover:text-foreground transition"
                      )}
                    >
                      {APP_NAME}
                    </Link>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href="/"
                      aria-label="Home"
                      title="Home"
                      className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center transition",
                        "bg-white/10 hover:bg-white/15 border border-white/10",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
                      )}
                    >
                      <Home className="h-5 w-5" />
                    </Link>

                    <div className="w-[min(920px,82vw)]">
                      <Search
                        placeholder="What do you want to play?"
                        inputClassName="bg-white/10 border-white/10 rounded-full pl-4 pr-12 h-10 focus-visible:ring-0 focus-visible:ring-offset-0"
                        buttonClassName="rounded-full right-1 h-8 w-8 top-1/2 -translate-y-1/2 hover:bg-white/10"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end">
                    <Button
                      variant="secondary"
                      className="h-10 w-10 rounded-full p-0 bg-white/10 hover:bg-white/15 border border-white/10"
                      onClick={() => router.push("/profile")}
                      aria-label="Profile"
                      title="Profile"
                    >
                      <User2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Page content */}
              <div className="px-6 sm:px-10 md:px-10 py-4 pb-36">{children}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
