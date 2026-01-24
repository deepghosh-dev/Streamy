import SpotifyShell from "@/components/page/spotify-shell";

export default function RootLayout({ children }) {
    return (
        <main>
            <SpotifyShell>
                {children}
            </SpotifyShell>
        </main>
    )
}