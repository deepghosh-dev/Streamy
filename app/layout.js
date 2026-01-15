import MusicProvider from "@/components/providers/music-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { APP_NAME, requireBranding } from "@/lib/branding";
import { Bricolage_Grotesque } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import { Toaster } from "sonner";
import "./globals.css";

const bricolage_grotesque = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
});

export const metadata = {
  title: APP_NAME,
  description: "Music streaming app.",
  icons: "/favi-icon.jpg",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }) {
  requireBranding();
  return (
    <html lang="en">
      <body className={bricolage_grotesque.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NextTopLoader
            color="hsl(var(--primary))"
            initialPosition={0.08}
            crawlSpeed={200}
            height={3}
            crawl={true}
            showSpinner={false}
            easing="ease"
            speed={200}
            shadow="0 0 10px hsl(var(--primary)),0 0 15px hsl(var(--primary))"
            template='<div class="bar" role="bar"><div class="peg"></div></div>
        <div class="spinner" role="spinner"><div class="spinner-icon"></div></div>'
            zIndex={1600}
            showAtBottom={false}
          />
          <MusicProvider>{children}</MusicProvider>
          {/* <MobileMenu/> */}
          <Toaster position="top-center" visibleToasts={1} />
        </ThemeProvider>
      </body>
    </html>
  );
}
