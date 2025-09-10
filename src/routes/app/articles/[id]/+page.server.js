import { PUBLIC_API_URL } from '$env/static/public';

/** @type {import('./$types').PageServerLoad} */
export async function load({ params, fetch }) {
    const articleId = params.id;
    try {
        // Menggunakan fetch langsung dari SvelteKit untuk endpoint publik.
        const response = await fetch(`${PUBLIC_API_URL}/api/articles/${articleId}`, {
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
