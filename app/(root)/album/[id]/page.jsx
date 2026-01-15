/**
 * Legal Disclaimer:
 * This project is for educational and personal learning purposes only.
 * All third-party content belongs to its respective owners.
 * This project does not host, store, or claim ownership of any external content.
 * The developer is not responsible for misuse of this project.
 * Third-party services are used under their own terms, conditions, and policies.
 */

import { getAlbumById } from "@/lib/fetch";
import Album from "../_components/Album";

export const generateMetadata = async ({ params }) => {
    const title = await getAlbumById(params.id);
    const data = await title.json();
    return {
        title: `Album - ${data.data.name}`,
    };
}
export default function Page({ params }) {
    return (
        <main>
            <Album id={params.id} />
        </main>
    )
}