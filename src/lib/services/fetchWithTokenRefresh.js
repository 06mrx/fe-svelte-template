import { storageService } from './storageService';
import { goto } from '$app/navigation';
import { PUBLIC_API_URL } from '$env/static/public';

/**
 * A wrapper function for `fetch` that automatically handles expired tokens.
 * If the initial request fails with a 401 status, it will attempt to
 * request a new token and retry the original request.
 * @param {string} url The request URL.
 * @param {RequestInit} options Standard `fetch` options.
 * @param {number} retryCount The number of retries (to prevent infinite loops).
 * @returns {Promise<Response>} Resolves with the successful response.
 * @throws {Error} If the request fails after retries or token refresh fails.
 */
export async function fetchWithTokenRefresh(url, options = {}, retryCount = 0) {
    // Get the token from storage
    const token = storageService.getToken();



    // Add authorization header to the request
    const headers = new Headers(options.headers);
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }
    options.headers = headers;

    const response = await fetch(url, options);

    // console.log(response)
    // If successful, return the response immediately
    // if (response.ok) {
    //     return response;
    // }

    // Handle the expired token case
    if (response.status === 401) {
        // Read the JSON message to confirm it is an 'Unauthenticated' error
        const errorData = await response.clone().json();
        if (errorData.message === 'Unauthenticated' && retryCount < 1) {
            console.log('Token is expired. Requesting a new token...');

            // Create headers for the refresh token request, including the old token
            const refreshHeaders = new Headers();
            refreshHeaders.set('Content-Type', 'application/json');
            refreshHeaders.set('Authorization', `Bearer ${token}`); // THIS IS THE NEW PART


            const refreshTokenResponse = await fetch(`${PUBLIC_API_URL}/api/refresh-token`, {
                method: 'POST',
                headers: refreshHeaders,
            });

            if (refreshTokenResponse.ok) {
                const refreshTokenData = await refreshTokenResponse.json();
                const newToken = refreshTokenData.token;
                storageService.setToken(newToken); // Save the new token

                console.log('Token successfully refreshed. Retrying original request...');

                // Retry the original request with the new token
                const newOptions = { ...options };
                const newHeaders = new Headers(newOptions.headers);
                newHeaders.set('Authorization', `Bearer ${newToken}`);
                newOptions.headers = newHeaders;

                return fetchWithTokenRefresh(url, newOptions, retryCount + 1);
            } else {
                // If refresh token fails, redirect the user to the login page
                console.error('Failed to refresh token. Redirecting to login page.');
                storageService.clearUserData();
                // Use `goto` to redirect, passing the current URL as a returnUrl
                const currentUrl = encodeURIComponent(window.location.pathname + window.location.search);
                goto(`/auth/login?returnUrl=${currentUrl}`);
                throw new Error('Failed to refresh token.');
            }
        }
    }

    return response;

    // First attempt
    // try {


    //     // If it's not a 401 error or not 'Unauthenticated', throw the original error
    //     throw new Error(`Request failed with statusx ${response.status}`);

    // } catch (error) {
    //     console.error('Error during fetch:', error);
    //     if (retryCount >= 1) {
    //         // If it's a retry and it still fails, log out the user
    //         storageService.clearUserData();
    //         // Use `goto` to redirect, passing the current URL as a returnUrl
    //         const currentUrl = encodeURIComponent(window.location.pathname + window.location.search);
    //         goto(`/auth/login?returnUrl=${currentUrl}`);
    //     }
    //     throw error;
    // }
}
