import Player from "@/components/cards/player";
import Footer from "@/components/page/footer";
import SpotifyShell from "@/components/page/spotify-shell";

export default function RootLayout({ children }) {
    return (
        <main>
            <SpotifyShell>
                {children}
                <Footer />
            </SpotifyShell>
            <Player />
        </main>
    )
}