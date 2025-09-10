import { PUBLIC_API_URL } from '$env/static/public';
import { fetchWithTokenRefresh } from '$lib/services/fetchWithTokenRefresh';

/** @type {import('./$types').PageServerLoad} */
export async function load({ params }) {
    const articleId = params.id;
    try {
        const response = await fetchWithTokenRefresh(`${PUBLIC_API_URL}/api/articles/${articleId}`, {
            method: 'GET'
        });

        if (!response.ok) {
            const result = await response.json();
            return { article: null, errorMessage: result.message || 'Gagal memuat artikel.' };
        }

        const result = await response.json();
        return { article: result.data, errorMessage: '' };
    } catch (err) {
        console.error(err);
        return { article: null, errorMessage: 'Terjadi kesalahan jaringan atau server.' };
    }
}
