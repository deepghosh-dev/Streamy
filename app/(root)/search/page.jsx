import Link from "next/link";

const CATEGORIES = [
  { name: "Bollywood", color: "from-rose-500/30 to-zinc-950" },
  { name: "Indie", color: "from-emerald-500/25 to-zinc-950" },
  { name: "Lo-fi", color: "from-sky-500/25 to-zinc-950" },
  { name: "Workout", color: "from-amber-500/25 to-zinc-950" },
  { name: "Devotional", color: "from-fuchsia-500/20 to-zinc-950" },
  { name: "Chill", color: "from-teal-500/20 to-zinc-950" },
];

export const metadata = {
  title: "Search",
};

export default function SearchLandingPage() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Search</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Type in the top bar to find songs, albums and artists.
          </p>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-sm font-medium text-foreground/90">Browse all</h2>
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {CATEGORIES.map((c) => (
            <Link
              key={c.name}
              href={`/search/${encodeURIComponent(c.name.toLowerCase())}`}
              className={`group rounded-2xl border border-white/5 bg-gradient-to-b ${c.color} p-4 h-28 overflow-hidden relative`}
            >
              <div className="text-base font-semibold tracking-tight">
                {c.name}
              </div>
              <div className="absolute -bottom-8 -right-10 h-28 w-28 rotate-12 rounded-2xl bg-white/10 blur-sm group-hover:blur-none transition" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
