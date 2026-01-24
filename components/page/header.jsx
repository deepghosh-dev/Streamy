"use client"
import { ChevronLeft } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ModeToggle } from "../ModeToggle";
import { Button } from "../ui/button";
import Logo from "./logo";
import Search from "./search";

const BACK_TO_KEY = "streamy-back-to";

export default function Header() {
    const path = usePathname();
    const router = useRouter();
    const isSongPage = useMemo(() => {
        if (!path) return false;
        if (path === "/" || path === "/search" || path === "/profile") return false;
        return /^\/[^/]+$/.test(path);
    }, [path]);

    const [backHref, setBackHref] = useState("/");

    const handleBack = () => {
        try {
            // Browser back preserves scroll position and "section".
            if (typeof window !== "undefined" && window.history.length > 1) {
                router.back();
                return;
            }
        } catch {
            // ignore
        }
        router.push(backHref || "/");
    };

    useEffect(() => {
        if (!isSongPage) {
            setBackHref("/");
            return;
        }
        try {
            const v =
                sessionStorage.getItem(BACK_TO_KEY) ||
                localStorage.getItem(BACK_TO_KEY) ||
                "";

            if (typeof v === "string" && v.startsWith("/search")) {
                setBackHref(v);
            } else {
                setBackHref("/");
            }
        } catch {
            setBackHref("/");
        }
    }, [isSongPage, path]);

    return (
        <header className="grid gap-2 pt-5 px-5 pb-5 md:px-20 lg:px-32">
            <div className="flex items-center sm:justify-between w-full gap-2">
                {path == "/" ? (
                    <div className="flex items-center gap-1">
                        <Logo />
                        <ModeToggle />
                    </div>
                ) : (
                    <div className="flex justify-between w-full items-center gap-1">
                        <Logo />
                        <Button
                            type="button"
                            className="rounded-full sm:hidden h-8 px-3 flex items-center gap-1"
                            onClick={handleBack}
                        >
                            <ChevronLeft className="w-4 h-4" />Back
                        </Button>
                    </div>
                )}
                <div className="hidden sm:flex items-center gap-3 w-full max-w-md">
                    <Search />
                    {path != "/" && (
                        <Button
                            type="button"
                            className="h-10 px-3 flex items-center gap-1"
                            onClick={handleBack}
                        >
                            <ChevronLeft className="w-4 h-4" />Back
                        </Button>
                    )}
                </div>
            </div>
        </header>
    )
}
