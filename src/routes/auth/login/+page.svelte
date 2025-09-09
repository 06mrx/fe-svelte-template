<script lang="ts">
	// Deklarasi variabel global untuk TypeScript agar dapat mengenalinya

	import '../../../app.css';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { fetchWithTokenRefresh } from '$lib/services/fetchWithTokenRefresh';
	// PUBLIC_API_URL perlu diimpor jika Anda ingin menggunakannya langsung
	// import { PUBLIC_API_URL } from '$env/static/public';
	import toast, { Toaster } from 'svelte-french-toast'; // Tambahkan Toaster dan toast untuk notifikasi

	// Firebase imports
	import { initializeApp } from 'firebase/app';
	import {
		getAuth,
		GoogleAuthProvider,
		signInWithPopup,
		signOut,
		signInWithEmailAndPassword
	} from 'firebase/auth'; // Tambahkan signInWithEmailAndPassword, signOut

	// --- Firebase Init ---
	// Konfigurasi Firebase manual sebagai fallback
	const manualFirebaseConfig = {
		apiKey: 'AIzaSyA9KnbfeRgAWYD0UUBbb690sFoKFrdoHEI',
		authDomain: 'app-template-register.firebaseapp.com',
		projectId: 'app-template-register',
		storageBucket: 'app-template-register.firebasestorage.app',
		messagingSenderId: '1087226193325',
		appId: '1:1087226193325:web:200263210f252720a02d24',
		measurementId: 'G-7TTZ4YMMV0'
	};

	let firebaseConfig: Record<string, any> = {};
	let app;
	let auth;
	let provider;

	// State untuk menyimpan data formulir dan status
	let email = '';
	let password = '';
	let loading = false;
	let errorMessage = '';
	let loginResponse = ''; // Variabel ini biasanya untuk pesan sukses umum, bisa diubah namanya jika perlu.

	export let data; // data.apiUrl akan digunakan

	onMount(() => {
		// Lanjutkan inisialisasi Firebase hanya jika firebaseConfig tidak kosong dan bukan placeholder
		if (Object.keys(manualFirebaseConfig).length > 0) {
			app = initializeApp(manualFirebaseConfig);
			auth = getAuth(app);
			provider = new GoogleAuthProvider();
		} else {
			console.error(
				'Firebase config is still invalid or using placeholders. Google login will not be available.'
			);
			toast.error('Firebase tidak dikonfigurasi dengan benar. Login Google tidak tersedia.');
		}

		// Mengecek jika pengguna sudah login saat komponen dipasang
		if (browser && localStorage.getItem('user_token')) {
			try {
				// alert(1)
				// Menggunakan data.apiUrl untuk endpoint profile
				fetch(`${data.apiUrl}/api/profile`, {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
						Referer: window.location.origin,
						Authorization: `Bearer ${localStorage.getItem('user_token')}`
					}
				})
					.then((response) => response.json())
					.then((result) => {
						console.log(result);
						// Asumsi backend mengembalikan property 'ok' atau mengecek status code
						const role = result.data?.Roles[0]?.Name;
						const returnUrl = $page.url.searchParams.get('returnUrl');

						if (returnUrl) {
							goto(returnUrl, { replaceState: true });
						} else if (role === 'admin') {
							goto('/app/admin', { replaceState: true });
						} else if (role === 'user') {
							goto('/app/user', { replaceState: true });
						} else {
							// goto('/', { replaceState: true });
						}
					})
					.catch((error) => {
						console.error('Error checking user status:', error);
						alert('Error checking user status');
						localStorage.removeItem('user_token');
						localStorage.removeItem('user_data');
						toast.error('Terjadi kesalahan saat memverifikasi sesi.');
					});
			} catch (error) {
				console.error('Error in onMount during auth check:', error);
				alert('Error in onMount during auth check: ; ');
				localStorage.removeItem('user_token');
				localStorage.removeItem('user_data');
			}
		}
	});

	// Fungsi untuk menangani pengiriman formulir login tradisional
	async function handleLogin() {
		errorMessage = '';
		loading = true;
		loginResponse = '';

		try {
			const response = await fetch(`${data.apiUrl}/api/login`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Referer: window.location.origin
				},
				body: JSON.stringify({ email, password })
			});

			const result = await response.json();

			if (response.ok) {
				// Login berhasil, simpan data ke local storage
				if (browser) {
					localStorage.setItem('user_data', JSON.stringify(result.data.user));
					localStorage.setItem('user_token', result.data.token);
					toast.success('Login berhasil!');

					// Logika redirect yang diperbarui
					const returnUrl = $page.url.searchParams.get('returnUrl');
					if (returnUrl) {
						goto(returnUrl);
					} else {
						// Redirect berdasarkan peran jika tidak ada returnUrl
						if (result.data.role === 'admin') {
							goto('/app/admin');
						} else if (result.data.role === 'user') {
							goto('/app/user');
						} else {
							goto('/');
						}
					}
				}
			} else {
				// Login gagal, tampilkan pesan error
				errorMessage = result.message || 'Login gagal, coba lagi.';
				toast.error(errorMessage);
			}
		} catch (error: any) {
			errorMessage = error.message || 'Terjadi kesalahan jaringan.';
			console.error('Login error:', error);
			toast.error(errorMessage);
		} finally {
			loading = false;
		}
	}

	// Fungsi untuk menangani login dengan Google
	async function signInWithGoogle() {
		errorMessage = '';
		loginResponse = '';
		loading = true; // Menggunakan loading untuk Google login juga

		try {
			if (!auth || !provider) {
				errorMessage =
					'Firebase atau Google Auth Provider tidak diinisialisasi. Pastikan konfigurasi Firebase valid.';
				loading = false;
				toast.error(errorMessage);
				return;
			}

			const result = await signInWithPopup(auth, provider);
			const user = result.user;

			// Ambil ID token Firebase
			const idToken = await user.getIdToken();

			// Kirim ID token ke backend Anda untuk login
			const response = await fetch(`${data.apiUrl}/api/login-using-google`, {
				// Endpoint API Anda untuk login Google
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ idToken })
			});

			const backendResult = await response.json();

			if (response.ok) {
				// Login berhasil, simpan data ke local storage
				if (browser) {
					localStorage.setItem('user_data', JSON.stringify(backendResult.data.user));
					localStorage.setItem('user_token', backendResult.data.token);
					toast.success('Login Google berhasil!');

					const returnUrl = $page.url.searchParams.get('returnUrl');
					if (returnUrl) {
						goto(returnUrl);
					} else {
						// Redirect berdasarkan peran jika tidak ada returnUrl
						if (backendResult.data.role === 'admin') {
							goto('/app/admin');
						} else if (backendResult.data.role === 'user') {
							goto('/app/user');
						} else {
							goto('/');
						}
					}
				}
			} else {
				errorMessage = backendResult.message || 'Login Google gagal di backend.';
				toast.error(errorMessage);
				await signOut(auth); // Logout dari Firebase jika backend gagal
			}
		} catch (error: any) {
			console.error('Google login error:', error);
			errorMessage = error.message || 'Login dengan Google gagal.';
			toast.error(errorMessage);
			// Anda mungkin ingin logout dari Firebase di sini juga jika ada error yang tidak tertangkap
			if (auth && auth.currentUser) {
				await signOut(auth);
			}
		} finally {
			loading = false;
		}
	}

	const checkRole = async () => {
		try {
			let apiUrl = `${data.apiUrl}/api/profile`;

			const response = await fetchWithTokenRefresh(apiUrl, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json'
				}
			});

			const result = await response.json();

			if (response.ok) {
				const role = result.data?.Roles[0]?.Name;
				switch (role) {
					case 'admin':
						goto('/app/admin');
						break;
					case 'user':
						goto('/app/user');
						break;
					default:
						goto('/');
				}
			}
		} catch (err) {
			console.error('Fetch users error:', err);
		}
	};
</script>

<Toaster />

<div class="flex min-h-screen items-center justify-center bg-gray-100">
	<div class="w-full max-w-md space-y-6 rounded-lg bg-white p-8 shadow-md">
		<h2 class="text-center text-3xl font-extrabold text-gray-900">Masuk ke Akun Anda</h2>

		{#if errorMessage}
			<div
				class="relative rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700"
				role="alert"
			>
				<strong class="font-bold">Error!</strong>
				<span class="block sm:inline">{errorMessage}</span>
			</div>
		{/if}

		{#if loginResponse}
			<div
				class="relative rounded border border-green-400 bg-green-100 px-4 py-3 text-green-700"
				role="alert"
			>
				<strong class="font-bold">Response!</strong>
				<span class="block sm:inline">{loginResponse}</span>
			</div>
		{/if}

		<form onsubmit={handleLogin} class="space-y-4">
			<div>
				<label for="email" class="block text-sm font-medium text-gray-700">Alamat Email</label>
				<input
					id="email"
					name="email"
					type="email"
					autocomplete="email"
					required
					bind:value={email}
					class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
					disabled={loading}
				/>
			</div>
			<div>
				<label for="password" class="block text-sm font-medium text-gray-700">Password</label>
				<input
					id="password"
					name="password"
					type="password"
					autocomplete="current-password"
					required
					bind:value={password}
					class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
					disabled={loading}
				/>
			</div>
			<div>
				<button
					type="submit"
					class="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none {loading
						? 'cursor-not-allowed opacity-50'
						: ''}"
					disabled={loading}
				>
					{#if loading}
						<svg
							class="mr-3 -ml-1 h-5 w-5 animate-spin text-white"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
						>
							<circle
								class="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								stroke-width="4"
							></circle>
							<path
								class="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							></path>
						</svg>
						Memproses...
					{:else}
						Masuk
					{/if}
				</button>
			</div>
		</form>

		<div class="relative py-2">
			<div class="absolute inset-0 flex items-center">
				<div class="w-full border-t border-gray-300"></div>
			</div>
			<div class="relative flex justify-center text-sm">
				<span class="bg-white px-2 text-gray-500">Atau masuk dengan</span>
			</div>
		</div>

		<!-- Google Login Button -->
		<button
			onclick={signInWithGoogle}
			class="group relative flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
			disabled={loading}
		>
			<img
				src="https://www.svgrepo.com/show/355037/google.svg"
				alt="Google logo"
				class="mr-2 h-5 w-5"
			/>
			{#if loading}
				<svg
					class="mr-3 -ml-1 h-5 w-5 animate-spin text-gray-700"
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
				>
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
					></circle>
					<path
						class="opacity-75"
						fill="currentColor"
						d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
					></path>
				</svg>
				Memproses...
			{:else}
				Masuk dengan Google
			{/if}
		</button>
		<p class="mt-2 text-center text-sm text-gray-600">
			Belum punya akun? <a
				href="/auth/register"
				class="font-medium text-indigo-600 hover:text-indigo-500">Daftar sekarang</a
			>
		</p>
	</div>
</div>
