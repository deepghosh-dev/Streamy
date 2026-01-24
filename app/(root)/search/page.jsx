import Search from "@/components/page/search";
import SearchRecents from "./_components/recents";

export const metadata = {
  title: "Search",
};

export default function SearchLandingPage() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="w-full max-w-[720px]">
        <h1 className="mb-3 text-xl sm:text-2xl font-semibold tracking-tight">
          Search
        </h1>
        <Search
          placeholder="Search here"
          inputClassName="bg-white/10 border-white/10 rounded-full pl-5 pr-14 h-11 text-[15px] focus-visible:ring-0 focus-visible:ring-offset-0"
          buttonClassName="rounded-full right-1 h-9 w-9 top-1/2 -translate-y-1/2 hover:bg-white/10"
        />
      </div>

      <SearchRecents />
    </div>
  );
}
