"use client";

import { Home, Search as SearchIcon, User2 } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import FriendSearch from "@/components/page/friend-search";
import PlaylistDrawer from "@/components/page/playlist-drawer";
import Search from "@/components/page/search";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/branding";
import { cn } from "@/lib/utils";

export default function SpotifyShell({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="min-h-screen w-full bg-black/90">
      <div className="min-h-screen w-full bg-black/90">
        <div className="w-full p-0">
          <div className="w-full">
            <div className="rounded-none bg-black/90 backdrop-blur-xl">
              {/* Top bar */}
              <div className="sticky top-0 z-40 bg-black/90 backdrop-blur-xl">
                {/* Mobile navbar (matches screenshot) */}
                <div className="sm:hidden px-3 py-2">
                  <div className="flex items-center gap-2.5">
                    <Button
                      variant="secondary"
                      className="h-9 w-9 rounded-full p-0 bg-white/10 hover:bg-white/15 border border-white/10 shrink-0"
                      onClick={() => router.push("/profile")}
                      aria-label="Profile"
                      title="Profile"
                    >
                      <User2 className="h-5 w-5" />
                    </Button>

                    <button
                      type="button"
                      className={cn(
                        "h-8 w-[60px] rounded-full shrink-0 inline-flex items-center justify-center",
                        "bg-green-500 text-black",
                        "text-[12px] font-medium",
                        "shadow-sm"
                      )}
                      aria-label="All"
                      title="All"
                    >
                      All
                    </button>

                    <FriendSearch
                      className="ml-auto w-[min(160px,48vw)]"
                      inputClassName="h-8 text-[11.5px] bg-white/10 border-white/10 rounded-full pl-3 pr-11"
                      buttonClassName="h-7 w-7 right-1 hover:bg-white/10"
                      placeholder="Search here"
                      ariaLabel="Search"
                      navigateTo="/search"
                    />
                  </div>
                </div>

                {/* Desktop/navbar for sm+ */}
                <div className="hidden sm:grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-6 sm:px-10 md:px-10 py-3">
                  {/* Left */}
                  <div className="flex items-center gap-4 min-w-0">
                    <Link
                      href="/"
                      aria-label={APP_NAME}
                      title={APP_NAME}
                      className={cn(
                        "h-10 inline-flex items-center text-xl sm:text-2xl font-bold tracking-tight leading-none",
                        "text-foreground/95 hover:text-foreground transition",
                        "shrink-0"
                      )}
                    >
                      {APP_NAME}
                    </Link>
                  </div>

                  {/* Center */}
                  <div className="flex items-center justify-center justify-self-center">
                    <div className="flex items-center gap-2">
                      <Link
                        href="/"
                        aria-label="Home"
                        title="Home"
                        className={cn(
                          "h-10 w-10 rounded-full flex items-center justify-center transition",
                          "bg-white/10 hover:bg-white/15 border border-white/10",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20",
                          "shrink-0"
                        )}
                      >
                        <Home className="h-5 w-5" />
                      </Link>

                      <PlaylistDrawer />

                      <div className="w-[min(680px,74vw)]">
                        <Search
                          placeholder="Search here"
                          inputClassName="bg-white/10 border-white/10 rounded-full pl-5 pr-14 h-11 text-[15px] focus-visible:ring-0 focus-visible:ring-offset-0"
                          buttonClassName="rounded-full right-1 h-9 w-9 top-1/2 -translate-y-1/2 hover:bg-white/10"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right */}
                  <div className="flex items-center justify-end gap-2">
                    <div className="hidden md:block w-[min(320px,26vw)]">
                      <FriendSearch />
                    </div>
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
              <div className="px-6 sm:px-10 md:px-10 pt-2 sm:pt-4 pb-36">{children}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile bottom menu (phone only) */}
      <div className="sm:hidden fixed bottom-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3">
        <nav
          aria-label="Bottom navigation"
          className={cn(
            "h-[62px] px-2 py-2 rounded-full",
            "bg-white/10 backdrop-blur-xl",
            "border border-white/15",
            "shadow-[0_10px_50px_rgba(0,0,0,0.65)]",
            "flex items-center"
          )}
        >
            <Link
              href="/"
              aria-label="Home"
              title="Home"
              className={cn(
                "h-full w-[78px] rounded-full",
                "flex flex-col items-center justify-center gap-0.5",
                "text-[10px] font-medium",
                pathname === "/" ? "bg-white/15 text-white" : "text-white/70"
              )}
            >
              <Home className="h-5 w-5" />
              <span>Home</span>
            </Link>

            <PlaylistDrawer
              triggerLabel="Playlist"
              triggerClassName={cn(
                "h-full w-[86px] rounded-full",
                "flex flex-col items-center justify-center gap-0.5",
                "text-[10px] font-medium",
                "text-white/70 bg-transparent border-transparent hover:border-white/0"
              )}
              triggerIconClassName="h-5 w-5"
              triggerTextClassName="text-white/70"
            />

            <Link
              href="/profile"
              aria-label="Profile"
              title="Profile"
              className={cn(
                "h-full w-[78px] rounded-full",
                "flex flex-col items-center justify-center gap-0.5",
                "text-[10px] font-medium",
                pathname?.startsWith("/profile")
                  ? "bg-white/15 text-white"
                  : "text-white/70"
              )}
            >
              <User2 className="h-5 w-5" />
              <span>Profile</span>
            </Link>
        </nav>

        <Link
          href="/search"
          aria-label="Search"
          title="Search"
          className={cn(
            "h-[56px] w-[56px] rounded-full",
            "bg-white/10 backdrop-blur-xl",
            "border border-white/15",
            "shadow-[0_10px_50px_rgba(0,0,0,0.65)]",
            "inline-flex items-center justify-center",
            "hover:bg-white/15 transition"
          )}
        >
          <SearchIcon className="h-6 w-6 text-white/90" />
        </Link>
      </div>
    </div>
  );
}
