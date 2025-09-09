<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { PUBLIC_API_URL } from '$env/static/public';
	import toast, { Toaster } from 'svelte-french-toast';

	// Import fungsi fetch kustom untuk penanganan refresh token
	import { fetchWithTokenRefresh } from '$lib/services/fetchWithTokenRefresh';
	import Text from '$lib/components/input/Text.svelte';

	// State untuk menyimpan data formulir dan status
	let name = '';
	let email = '';
	let password = '';
	let password_confirmation = '';
	let loading = false;
	let successMessage = '';
	let errorMessage = '';
	let validationErrors: any = {};

	// Password strength indicator
	let passwordStrength = 0;

	$: {
		// Calculate password strength
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

	// Fungsi untuk menangani pengiriman formulir
	async function handleCreateUser() {
		errorMessage = '';
		successMessage = '';
		validationErrors = {};
		loading = true;

		// Validasi sederhana di sisi klien
		if (password !== password_confirmation) {
			errorMessage = 'Password dan konfirmasi password tidak cocok.';
			loading = false;
			return;
		}

		// Menggunakan fetchWithRefreshToken untuk panggilan API
		const response = await fetchWithTokenRefresh(`${PUBLIC_API_URL}/api/users`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Referer: window.location.origin
			},
			body: JSON.stringify({ name, email, password, password_confirmation })
		});

		const result = await response.json();
		if (response.ok) {
			successMessage = result.message || 'Pengguna berhasil ditambahkan!';
			name = '';
			email = '';
			password = '';
			password_confirmation = '';
			loading = false;
			goto('/app/admin/users');
		} else if (response.status === 400) {
			// errorMessage = 'Terdapat kesalahan dalam formulir. Silakan periksa kembali.';
			validationErrors = result.message;
			loading = false;
			toast.error('Terdapat kesalahan dalam formulir. Silakan periksa kembali');
		} else {
			// errorMessage = result.message || 'Gagal membuat pengguna.';
			loading = false;
		}
	}

	const checkAuth = async () => {
		// Logika pengecekan otentikasi
	};

	onMount(async () => {
		// Pengecekan otentikasi di sini
	});
</script>

<Toaster />
<div class="flex items-center justify-center py-6">
	<div class="w-full max-w-md space-y-6">
		<!-- Back arrow button -->
		<div class="flex items-center">
			<button
				type="button"
				onclick={() => goto('/app/admin/users')}
				class="group mb-6 inline-flex items-center gap-3 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition-all duration-200 hover:bg-slate-50 hover:text-slate-900 hover:shadow-md focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
			>
				<div class="rounded-full bg-slate-100 p-1 transition-colors group-hover:bg-slate-200">
					<svg
						class="h-4 w-4 transition-transform group-hover:-translate-x-0.5"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M15 19l-7-7 7-7"
						/>
					</svg>
				</div>
				Kembali ke Daftar Pengguna
			</button>
		</div>
		<!-- Header Card -->
		<div class="text-center">
			<h2 class="text-2xl font-bold text-gray-900">Tambah Pengguna Baru</h2>
			<!-- <p class="text-sm text-gray-600">Lengkapi formulir di bawah untuk menambahkan pengguna baru ke sistem</p> -->
		</div>

		<!-- Form Card -->
		<div class="-mt-3 rounded-xl border border-gray-200 bg-white px-4 py-2 shadow-sm">
			<!-- Success Message -->
			{#if successMessage}
				<div class="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
					<div class="flex">
						<div class="flex-shrink-0">
							<svg class="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
								<path
									fill-rule="evenodd"
									d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
									clip-rule="evenodd"
								/>
							</svg>
						</div>
						<div class="ml-3">
							<p class="text-sm font-medium text-green-800">{successMessage}</p>
						</div>
					</div>
				</div>
			{/if}

			<!-- Error Message -->
			{#if errorMessage}
				<div class="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
					<div class="flex">
						<div class="flex-shrink-0">
							<svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
								<path
									fill-rule="evenodd"
									d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
									clip-rule="evenodd"
								/>
							</svg>
						</div>
						<div class="ml-3">
							<p class="text-sm font-medium text-red-800">{errorMessage}</p>
						</div>
					</div>
				</div>
			{/if}

			<form onsubmit={handleCreateUser} class="space-y-5">
				<!-- Input Nama -->
				<!-- <div class="space-y-1">
					<label for="name" class="block text-sm font-medium text-gray-700">
						Nama Lengkap
						<span class="text-red-500">*</span>
					</label>
					<input
						id="name"
						name="name"
						type="text"
						autocomplete="name"
						required
						class="block w-full rounded-lg focus:bg-indigo-500/10  px-3 py-2.5 text-sm placeholder-gray-400 shadow-lg transition-colors  {getFirstError(validationErrors?.name) ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}"
						placeholder="Masukkan nama lengkap"
						bind:value={name}
					/>
					{#if getFirstError(validationErrors?.name)}
						<p class="text-xs text-red-600 flex items-center gap-1">
							<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
							</svg>
							{getFirstError(validationErrors.name)}
						</p>
					{/if}
				</div> -->
				<!-- label = '',
        name = '',
		placeholder = '',
		isRequired = false,
		error = '',
        id = null,
        isNumber = false, -->
				<Text
					label="Nama Lengkap"
					placeholder="Contoh : Danaerys Targaryen"
					isRequired={true}
					error={validationErrors?.name}
					name="name"
					bind:value={name}
				/>
				<!-- Input Email -->
				<Text
					label="Alamat Email"
					type="email"
					placeholder="Contoh : danaerys.targaryen@dragon.com"
					isRequired={true}
					error={validationErrors?.email}
					name="email"
					bind:value={email}
				/>
				<!-- <div class="space-y-1">
					<label for="email" class="block text-sm font-medium text-gray-700">
						Alamat Email
						<span class="text-red-500">*</span>
					</label>
					<input
						id="email"
						name="email"
						type="email"
						autocomplete="email"
						required
						class="block w-full rounded-lg  px-3 py-2.5 text-sm placeholder-gray-400 shadow-xl transition-colors focus:border-indigo-500 focus:ring-indigo-500 focus:ring-1 {getFirstError(validationErrors?.email) ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}"
						placeholder="contoh@email.com"
						bind:value={email}
					/>
					{#if getFirstError(validationErrors?.email)}
						<p class="text-xs text-red-600 flex items-center gap-1">
							<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
							</svg>
							{getFirstError(validationErrors.email)}
						</p>
					{/if}
				</div> -->

				<!-- Input Password -->
				<Text
					label="Kata Sandi"
					placeholder="Minimal 8 karakter"
					isRequired={true}
					name="password"
					type="password"
					bind:value={password}
					error={validationErrors?.password}
				/>
				<!-- <div class="space-y-1">
					<label for="password" class="block text-sm font-medium text-gray-700">
						Password
						<span class="text-red-500">*</span>
					</label>
					<input
						id="password"
						name="password"
						type="password"
						autocomplete="new-password"
						required
						class="block w-full rounded-lg border-gray-300 px-3 py-2.5 text-sm placeholder-gray-400 shadow-sm transition-colors focus:border-indigo-500 focus:ring-indigo-500 focus:ring-1 {getFirstError(validationErrors?.password) ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}"
						placeholder="Minimal 8 karakter"
						bind:value={password}
					/>
					
					{#if password.length > 0}
						<div class="flex items-center gap-2 mt-2">
							<div class="flex-1 flex gap-1">
								{#each Array(4) as _, i}
									<div class="h-1.5 flex-1 rounded-full {passwordStrength > i ? (passwordStrength === 1 ? 'bg-red-400' : passwordStrength === 2 ? 'bg-yellow-400' : passwordStrength === 3 ? 'bg-blue-400' : 'bg-green-400') : 'bg-gray-200'}"></div>
								{/each}
							</div>
							<span class="text-xs font-medium {getPasswordStrengthInfo().color}">
								{getPasswordStrengthInfo().text}
							</span>
						</div>
					{/if}

					{#if getFirstError(validationErrors?.password)}
						<p class="text-xs text-red-600 flex items-center gap-1">
							<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
							</svg>
							{getFirstError(validationErrors.password)}
						</p>
					{:else}
						<p class="text-xs text-gray-500">Gunakan minimal 8 karakter dengan kombinasi huruf, angka, dan simbol</p>
					{/if}
				</div> -->

				<!-- Input Konfirmasi Password -->
				<Text
					label="Konfirmasi Kata Sandi"
					placeholder="Masukkan kembali password"
					isRequired={true}
					name="password_confirmation"
					type="password"
					bind:value={password_confirmation}
					error={validationErrors?.password_confirmation}
				/>
				{#if password_confirmation.length > 0 && password !== password_confirmation}
					<p class="flex items-center gap-1 text-xs text-red-600">
						<svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
							<path
								fill-rule="evenodd"
								d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
								clip-rule="evenodd"
							/>
						</svg>
						Password tidak cocok
					</p>
				{/if}
				<!-- <div class="space-y-1">
					<label for="password_confirmation" class="block text-sm font-medium text-gray-700">
						Konfirmasi Password
						<span class="text-red-500">*</span>
					</label>
					<input
						id="password_confirmation"
						name="password_confirmation"
						type="password"
						autocomplete="new-password"
						required
						class="block w-full rounded-lg border-gray-300 px-3 py-2.5 text-sm placeholder-gray-400 shadow-sm transition-colors focus:border-indigo-500 focus:ring-indigo-500 focus:ring-1 {getFirstError(validationErrors?.password_confirmation) || (password_confirmation.length > 0 && password !== password_confirmation) ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}"
						placeholder="Ulangi password"
						bind:value={password_confirmation}
					/>
					{#if password_confirmation.length > 0 && password !== password_confirmation}
						<p class="text-xs text-red-600 flex items-center gap-1">
							<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
							</svg>
							Password tidak cocok
						</p>
					{:else if getFirstError(validationErrors?.password_confirmation)}
						<p class="text-xs text-red-600 flex items-center gap-1">
							<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
							</svg>
							{getFirstError(validationErrors.password_confirmation)}
						</p>
					{/if}
				</div> -->

				<!-- Submit Button -->
				<div class="pt-2">
					<button
						type="submit"
						class="flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-indigo-600"
						disabled={loading}
					>
						{#if loading}
							<svg
								class="mr-2 -ml-1 h-4 w-4 animate-spin text-white"
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
							<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 4v16m8-8H4"
								/>
							</svg>
							Tambah Pengguna
						{/if}
					</button>
				</div>
			</form>
		</div>

		<!-- Footer Information -->
		<div class="hidden text-center">
			<p class="text-xs text-gray-500">
				<span class="text-red-500">*</span> Menunjukkan field yang wajib diisi
			</p>
			<p class="mt-1 text-xs text-gray-400">
				Pengguna yang dibuat akan mendapatkan akses ke sistem sesuai dengan role yang ditetapkan
			</p>
		</div>
	</div>
</div>
