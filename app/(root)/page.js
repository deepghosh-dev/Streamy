"use client";

import HomeInfiniteFeed from "./_components/home-infinite-feed";
import PopularArtists from "./_components/popular-artists";
import RecentPlayedCarousel from "./_components/recent-played-carousel";

export default function Page() {
  return (
    <main className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <RecentPlayedCarousel />

      <PopularArtists />

      <div className="mt-3 sm:mt-6">
        <HomeInfiniteFeed query="latest" pageSize={24} />
      </div>
    </main>
  )
}
