"use client";

import { SearchIcon } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function FriendSearch({ className }) {
  const [query, setQuery] = React.useState("");

  return (
    <form
      className={cn("relative w-full", className)}
      onSubmit={(e) => {
        e.preventDefault();
        // UI-only for now
      }}
    >
      <Button
        variant="ghost"
        type="submit"
        size="icon"
        className={cn(
          "absolute right-1 top-1/2 -translate-y-1/2 rounded-full h-9 w-9",
          "hover:bg-white/10"
        )}
        aria-label="Search friends"
      >
        <SearchIcon className="w-4 h-4" />
      </Button>
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        type="search"
        placeholder="Search friends"
        autoComplete="off"
        className={cn(
          "h-11 rounded-full text-[15px]",
          "bg-white/10 border-white/10",
          "pl-5 pr-14",
          "focus-visible:ring-0 focus-visible:ring-offset-0"
        )}
      />
    </form>
  );
}
