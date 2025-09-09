<script lang="ts">
	// Deklarasi variabel global untuk TypeScript agar dapat mengenalinya
	var __firebase_config: string;
  import '../../../app.css'
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { PUBLIC_API_URL } from '$env/static/public';
	import toast, { Toaster } from 'svelte-french-toast';

	// Import services and utilities
	import { storageService } from '$lib/services/storageService'; // Digunakan untuk cek otentikasi
	import { getFirstError } from '$lib/services/functionService'; // Untuk menampilkan error validasi

	// Firebase imports
	import { initializeApp } from 'firebase/app';
	import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth'; // Tambahkan signOut

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

	// let firebaseConfig: Record<string, any> = {};
	let app;
	let auth;
	let provider;

	onMount(() => {
		

		// Lanjutkan inisialisasi Firebase hanya jika firebaseConfig tidak kosong
		if (
			Object.keys(manualFirebaseConfig).length > 0 
		) {
			// Cek juga placeholder
			app = initializeApp(manualFirebaseConfig);
			auth = getAuth(app);
			provider = new GoogleAuthProvider();
		} else {
			console.error(
				'Firebase config is still invalid or using placeholders. Google registration will not be available.'
			);
			toast.error('Firebase tidak dikonfigurasi dengan benar. Registrasi Google tidak tersedia.');
		}

		// Redirect jika user sudah login (opsional untuk halaman register)
		// Untuk register, biasanya kita membiarkan user mendaftar akun baru meskipun sudah login.
		// Jika Anda ingin mengarahkan, uncomment kode di bawah:
		// if (storageService.getToken()) {
		//   const returnUrl = $page.url.searchParams.get('returnUrl') || '/app/dashboard';
		//   goto(returnUrl, { replaceState: true });
		// }
	});

	// State untuk menyimpan data formulir dan status
	let name = '';
	let email = '';
	let password = '';
	let password_confirmation = '';
	let loading = false; // Mengganti 'loading' sebagai status submit
	let successMessage = '';
	let errorMessage = '';
	let validationErrors: any = {};

	// Password strength indicator logic (dari diskusi sebelumnya)
	let passwordStrength = 0;

	// Reactive statement to calculate password strength when 'password' changes
	$: {
		if (password.length === 0) {
			passwordStrength = 0;
		} else if (password.length < 6) {
			passwordStrength = 1;
		} else if (password.length < 8) {
			passwordStrength = 2;
		} else if (password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/) && password.length >= 8) {
			passwordStrength = 4;
		} else {
			passwordStrength = 3;
		}
	}

	// Get password strength text and color
	function getPasswordStrengthInfo() {
		switch (passwordStrength) {
			case 0:
				return { text: '', color: '' };
			case 1:
				return { text: 'Lemah', color: 'text-red-500' };
			case 2:
				return { text: 'Cukup', color: 'text-yellow-500' };
			case 3:
				return { text: 'Baik', color: 'text-blue-500' };
			case 4:
				return { text: 'Kuat', color: 'text-green-500' };
			default:
				return { text: '', color: '' };
		}
	}

	// Fungsi untuk menangani pengiriman formulir registrasi tradisional (Email & Password)
	async function handleRegister() {
		errorMessage = '';
		successMessage = '';
		validationErrors = {};
		loading = true;

		// Validasi sederhana di sisi klien untuk password
		if (password !== password_confirmation) {
			errorMessage = 'Password dan konfirmasi password tidak cocok.';
			loading = false;
			toast.error(errorMessage);
			return;
		}

		// Minimal panjang password (sesuai indikator)
		if (password.length < 8) {
			validationErrors = { password: { length: 'Password minimal 8 karakter.' } };
			errorMessage = 'Password tidak memenuhi syarat.';
			loading = false;
			toast.error(errorMessage);
			return;
		}

		try {
			const response = await fetch(`${PUBLIC_API_URL}/api/register`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Referer: window.location.origin
				},
				body: JSON.stringify({ name, email, password, password_confirmation })
			});

			const result = await response.json();

			if (response.ok) {
				successMessage = result.message || 'Registrasi berhasil! Silakan login.';
				toast.success(successMessage);
				// Reset form setelah sukses
				name = '';
				email = '';
				password = '';
				password_confirmation = '';
				loading = false;
				goto('/auth/login');
			} else if (response.status === 422 || response.status === 400) {
				errorMessage = 'Terdapat kesalahan dalam formulir. Silakan periksa kembali.';
				validationErrors = result.message;
				loading = false;
				toast.error(errorMessage);
			} else {
				errorMessage = result.message || 'Registrasi gagal. Coba lagi.';
				loading = false;
				toast.error(errorMessage);
			}
		} catch (error: any) {
			console.error('Registration error:', error);
			errorMessage = error.message || 'Terjadi kesalahan jaringan.';
			toast.error(errorMessage);
		} finally {
			loading = false;
		}
	}

	// Fungsi untuk menangani registrasi dengan Google
	async function registerWithGoogle() {
		errorMessage = '';
		successMessage = '';
		validationErrors = {};
		loading = true;
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
      console.log(idToken)
			// Kirim ID token ke backend Anda untuk registrasi
			const response = await fetch(`${PUBLIC_API_URL}/api/register-using-google`, {
				// Endpoint API Anda
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					google_id: idToken,
					name: user.displayName || 'Pengguna Google', // Ambil nama dari Google, beri default
					email: user.email
				})
			});

      

			const backendResult = await response.json();

			if (response.ok) {
				successMessage = backendResult.message || 'Registrasi Google berhasil! Silakan login.';
				toast.success(successMessage);
				await signOut(auth); // Logout dari Firebase Auth setelah registrasi berhasil
				goto('/auth/login'); // Arahkan ke halaman login
			}  else if (response.status === 422 || response.status === 400) {
				validationErrors = backendResult.message;
        errorMessage = getFirstError(validationErrors.email);
				loading = false;
				toast.error(errorMessage);
			} else {
				errorMessage = backendResult.message || 'Registrasi gagal. Coba lagi.';
				loading = false;
				toast.error(errorMessage);
			}
		} catch (error: any) {
			console.error('Google registration error:', error);
			errorMessage = error.message || 'Registrasi dengan Google gagal.';
			// toast.error(errorMessage);
			// Anda mungkin ingin logout dari Firebase di sini juga jika ada error yang tidak tertangkap
			if (auth && auth.currentUser) {
				await signOut(auth);
			}
		} finally {
			loading = false;
		}
	}
</script>

<Toaster />

<div class="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gray-100 py-6">
	<div class="w-full max-w-md space-y-8 rounded-lg border border-gray-200 bg-white p-8 shadow-xl">
		<div class="text-center">
			<h2 class="text-3xl font-bold text-gray-900">Daftar Akun Baru</h2>
			<p class="mt-2 text-sm text-gray-600">
				Sudah punya akun? <a
					href="/auth/login"
					class="font-medium text-indigo-600 hover:text-indigo-500">Masuk di sini</a
				>
			</p>
		</div>

		{#if errorMessage}
			<div
				class="relative rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700"
				role="alert"
			>
				<span class="block sm:inline">{errorMessage}</span>
			</div>
		{/if}

		<form class="mt-8 space-y-6" on:submit|preventDefault={handleRegister}>
			<!-- Input Nama Lengkap -->
			<div>
				<label for="name" class="sr-only">Nama Lengkap</label>
				<input
					id="name"
					name="name"
					type="text"
					autocomplete="name"
					required
					bind:value={name}
					class="relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
					class:border-red-500={getFirstError(validationErrors?.name)}
					placeholder="Nama Lengkap"
					disabled={loading}
				/>
				{#if getFirstError(validationErrors?.name)}
					<p class="mt-1 flex items-center gap-1 text-xs text-red-600">
						<svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"
							><path
								fill-rule="evenodd"
								d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
								clip-rule="evenodd"
							/></svg
						>
						{getFirstError(validationErrors.name)}
					</p>
				{/if}
			</div>

			<!-- Input Email -->
			<div>
				<label for="email" class="sr-only">Alamat Email</label>
				<input
					id="email"
					name="email"
					type="email"
					autocomplete="email"
					required
					bind:value={email}
					class="relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
					class:border-red-500={getFirstError(validationErrors?.email)}
					placeholder="Alamat Email"
					disabled={loading}
				/>
				{#if getFirstError(validationErrors?.email)}
					<p class="mt-1 flex items-center gap-1 text-xs text-red-600">
						<svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"
							><path
								fill-rule="evenodd"
								d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
								clip-rule="evenodd"
							/></svg
						>
						{getFirstError(validationErrors.email)}
					</p>
				{/if}
			</div>

			<!-- Input Password -->
			<div>
				<label for="password" class="sr-only">Password</label>
				<input
					id="password"
					name="password"
					type="password"
					autocomplete="new-password"
					required
					bind:value={password}
					class="relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
					class:border-red-500={getFirstError(validationErrors?.password)}
					placeholder="Password"
					disabled={loading}
				/>
				{#if password.length > 0}
					<div class="mt-2 flex items-center gap-2">
						<div class="flex flex-1 gap-1">
							{#each Array(4) as _, i}
								<div
									class="h-1.5 flex-1 rounded-full {passwordStrength > i
										? passwordStrength === 1
											? 'bg-red-400'
											: passwordStrength === 2
												? 'bg-yellow-400'
												: passwordStrength === 3
													? 'bg-blue-400'
													: 'bg-green-400'
										: 'bg-gray-200'}"
								></div>
							{/each}
						</div>
						<span class="text-xs font-medium {getPasswordStrengthInfo().color}">
							{getPasswordStrengthInfo().text}
						</span>
					</div>
				{/if}
				{#if getFirstError(validationErrors?.password)}
					<p class="mt-1 flex items-center gap-1 text-xs text-red-600">
						<svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"
							><path
								fill-rule="evenodd"
								d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
								clip-rule="evenodd"
							/></svg
						>
						{getFirstError(validationErrors.password)}
					</p>
				{:else}
					<p class="mt-1 text-xs text-gray-500">
						Minimal 8 karakter, kombinasi huruf besar/kecil, angka.
					</p>
				{/if}
			</div>

			<!-- Input Konfirmasi Password -->
			<div>
				<label for="password_confirmation" class="sr-only">Konfirmasi Password</label>
				<input
					id="password_confirmation"
					name="password_confirmation"
					type="password"
					autocomplete="new-password"
					required
					bind:value={password_confirmation}
					class="relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
					class:border-red-500={getFirstError(validationErrors?.password_confirmation) ||
						(password_confirmation.length > 0 && password !== password_confirmation)}
					placeholder="Konfirmasi Password"
					disabled={loading}
				/>
				{#if password_confirmation.length > 0 && password !== password_confirmation}
					<p class="mt-1 flex items-center gap-1 text-xs text-red-600">
						<svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"
							><path
								fill-rule="evenodd"
								d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
								clip-rule="evenodd"
							/></svg
						>
						Password tidak cocok
					</p>
				{:else if getFirstError(validationErrors?.password_confirmation)}
					<p class="mt-1 flex items-center gap-1 text-xs text-red-600">
						<svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"
							><path
								fill-rule="evenodd"
								d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
								clip-rule="evenodd"
							/></svg
						>
						{getFirstError(validationErrors.password_confirmation)}
					</p>
				{/if}
			</div>

			<div>
				<button
					type="submit"
					class="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
					disabled={loading}
				>
					{#if loading}
						<svg
							class="-ml-1 mr-3 h-5 w-5 animate-spin text-white"
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
						Mendaftar...
					{:else}
						Daftar
					{/if}
				</button>
			</div>
		</form>

		<div class="relative">
			<div class="absolute inset-0 flex items-center">
				<div class="w-full border-t border-gray-300"></div>
			</div>
			<div class="relative flex justify-center text-sm">
				<span class="bg-white px-2 text-gray-500">Atau daftar dengan</span>
			</div>
		</div>

		<!-- Google Registration Button -->
		<button
			on:click={registerWithGoogle}
			class="group relative flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
			disabled={loading}
		>
			<img
				src="https://www.svgrepo.com/show/355037/google.svg"
				alt="Google logo"
				class="mr-2 h-5 w-5"
			/>
			{#if loading}
				<svg
					class="-ml-1 mr-3 h-5 w-5 animate-spin text-gray-700"
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
				Mendaftar...
			{:else}
				Daftar dengan Google
			{/if}
		</button>
	</div>
</div>
