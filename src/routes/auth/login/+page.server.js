import { env } from "$env/dynamic/private";



export async function load() {
  const apiUrl = env.API_URL;

  return {
    apiUrl: apiUrl // Mengirim data ke komponen Svelte
  };
}