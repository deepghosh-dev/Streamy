/**
 * Legal Disclaimer:
 * This project is for educational and personal learning purposes only.
 * All third-party content belongs to its respective owners.
 * This project does not host, store, or claim ownership of any external content.
 * The developer is not responsible for misuse of this project.
 * Third-party services are used under their own terms, conditions, and policies.
 */

const api_url = process.env.NEXT_PUBLIC_API_URL;
if(!api_url){
    throw new Error('Missing NEXT_PUBLIC_API_URL environment variable');
};

export const getSongsByQuery = async (e) => {
    try {
        return await fetch(`${api_url}search/songs?query=` + e);
    }
    catch (e) {
        console.log(e);
    }
};

export const getSongsById = async (e) => {
    try {
        return await fetch(`${api_url}songs/` + e);
    }
    catch (e) {
        console.log(e);
    }
};

export const getSongsSuggestions = async (e) => {
    try {
        return await fetch(`${api_url}songs/${e}/suggestions`);
    }
    catch (e) {
        console.log(e);
    }
};

export const searchAlbumByQuery = async (e) => {
    try {
        return await fetch(`${api_url}search/albums?query=` + e);
    }
    catch (e) {
        console.log(e);
    }
};

export const getAlbumById = async (e) => {
    try {
        return await fetch(`${api_url}albums?id=` + e);
    }
    catch (e) {
        console.log(e);
    }
};