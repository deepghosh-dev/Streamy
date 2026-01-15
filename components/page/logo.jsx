import { APP_NAME, AUTHOR_NAME, requireBranding } from "@/lib/branding";
import Link from "next/link";

export default function Logo() {
    requireBranding();
    return (
        <Link href="/" className="select-none">
            <div>
                <h1 className="text-2xl font-bold">{APP_NAME}</h1>
                <p className="text-[10px] leading-3 text-muted-foreground">Created by {AUTHOR_NAME}</p>
            </div>
        </Link>
    )
}