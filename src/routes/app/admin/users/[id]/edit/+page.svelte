<script lang="ts">
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { PUBLIC_API_URL } from '$env/static/public';
	import toast, { Toaster } from 'svelte-french-toast';

	// Import fungsi fetch kustom untuk penanganan refresh token
	import { fetchWithTokenRefresh } from '$lib/services/fetchWithTokenRefresh';
	import { storageService } from '$lib/services/storageService'; // Pastikan path ini benar
	import { getFirstError } from '$lib/services/functionService'; // Untuk menampilkan error validasi
	import Text from '$lib/components/input/Text.svelte';

	// Komponen Input Kustom

	// State untuk menyimpan data formulir dan status
	let userId = $state(''); // ID pengguna yang sedang diedit
	let name = $state('');
	let email = $state('');
	let password = $state(''); // Password dibiarkan kosong untuk diisi ulang jika ingin diubah
	let password_confirmation = $state('');
	let loading = $state(true); // Status loading untuk pengambilan data awal
	let submitting = $state(false); // Status loading untuk pengiriman form
	let successMessage = $state('');
	let errorMessage = $state('');
	let validationErrors: any = $state({});

	// Password strength indicator logic (from create page)
	let passwordStrength = $state(0); // Menggunakan $state untuk passwordStrength

	// Menggunakan $derived untuk menghitung passwordStrength secara reaktif
	$effect(() => {
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
	});

	// Get password strength text and color (from create page)
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

	// Fungsi untuk mengambil data pengguna yang akan diedit
	async function fetchUserData(id: string) {
		loading = true;
		errorMessage = '';
		try {
			const response = await fetchWithTokenRefresh(`${PUBLIC_API_URL}/api/users/${id}`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					Referer: window.location.origin
				}
			});

			const result = await response.json();

			if (response.ok) {
				name = result.data.Name || '';
				email = result.data.Email || '';
				// Password tidak diisi otomatis karena alasan keamanan
				password = '';
				password_confirmation = '';
				toast.success('Data pengguna berhasil dimuat.');
			} else {
				errorMessage = result.message || 'Gagal memuat data pengguna.';
				toast.error(errorMessage);
				if (response.status === 401) {
					// Redirect if unauthenticated
					storageService.clearUserData();
					goto(
						`/auth/login?returnUrl=${encodeURIComponent($page.url.pathname + $page.url.search)}`
					);
				}
			}
		} catch (error) {
			console.error('Fetch user data error:', error);
			errorMessage = 'Terjadi kesalahan jaringan saat memuat data.';
			toast.error(errorMessage);
		} finally {
			loading = false;
		}
	}

	// Fungsi untuk menangani pengiriman formulir update
	async function handleUpdateUser() {
		errorMessage = '';
		successMessage = '';
		validationErrors = {};
		submitting = true;

		// Validasi sederhana di sisi klien untuk password jika diisi
		if (password || password_confirmation) {
			// Hanya validasi jika salah satu field password diisi
			if (password !== password_confirmation) {
				errorMessage = 'Password dan konfirmasi password tidak cocok.';
				submitting = false;
				toast.error(errorMessage);
				return;
			}
			if (password.length > 0 && password.length < 8) {
				// Validasi minimal panjang password hanya jika diisi
				validationErrors = { password: { length: 'Password minimal 8 karakter.' } };
				errorMessage = 'Password tidak memenuhi syarat.';
				submitting = false;
				toast.error(errorMessage);
				return;
			}
		}

		try {
			const body: {
				name: string;
				email: string;
				password?: string;
				password_confirmation?: string;
			} = { name, email };
			if (password) {
				// Hanya sertakan password di body jika pengguna ingin mengubahnya
				body.password = password;
				body.password_confirmation = password_confirmation;
			}

			const response = await fetchWithTokenRefresh(`${PUBLIC_API_URL}/api/users/${userId}`, {
				method: 'PUT', // Menggunakan PUT untuk update seluruh resource, atau PATCH untuk update sebagian
				headers: {
					'Content-Type': 'application/json',
					Referer: window.location.origin
				},
				body: JSON.stringify(body)
			});

			const result = await response.json();

			if (response.ok) {
				successMessage = result.message || 'Pengguna berhasil diperbarui!';
				toast.success(successMessage);
				goto('/app/admin/users');
			} else if (response.status === 400) {
				validationErrors = result.message;
				toast.error('Terdapat kesalahan dalam formulir. Silakan periksa kembali.');
			} else {
				toast.error(result.message || 'Gagal memperbarui pengguna.');
				if (response.status === 401) {
					// Redirect if unauthenticated
					storageService.clearUserData();
					goto(
						`/auth/login?returnUrl=${encodeURIComponent($page.url.pathname + $page.url.search)}`
					);
				}
			}
		} catch (error) {
			console.error('Update user error:', error);
			toast.error('Terjadi kesalahan jaringan.');
		} finally {
			submitting = false;
		}
	}

	onMount(async () => {
		// 2. Dapatkan ID pengguna dari URL
		userId = $page.params.id;
		if (userId) {
			await fetchUserData(userId);
		} else {
			errorMessage = 'ID pengguna tidak ditemukan di URL.';
			loading = false;
			toast.error(errorMessage);
		}
	});
</script>

<Toaster />

<div class="flex min-h-[calc(100vh-4rem)] items-center justify-center py-6">
	<div class="w-full max-w-md space-y-6">
		<!-- Back Button -->
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
			<h2 class="text-2xl font-bold text-gray-900">Edit Pengguna</h2>
		</div>

		<!-- Form Card -->
		<div class="-mt-3 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
			{#if loading}
				<div class="flex items-center justify-center py-8">
					<div
						class="h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"
					></div>
					<p class="ml-4 text-gray-700">Memuat data pengguna...</p>
				</div>
			{:else}
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

				<form onsubmit={handleUpdateUser} class="space-y-5">
					<!-- Input Nama -->
					<Text
						label="Nama Lengkap"
						placeholder="Nama Lengkap"
						isRequired={true}
						name="name"
						type="text"
						bind:value={name}
						error={validationErrors?.name}
					/>

					<!-- Input Email -->
					<Text
						label="Alamat Email"
						placeholder="contoh@domain.com"
						isRequired={true}
						name="email"
						type="email"
						bind:value={email}
						error={validationErrors?.email}
					/>

					<!-- Input Password Baru -->
					<div class="space-y-1">
						<Text
							label="Password Baru (kosongkan jika tidak diubah)"
							placeholder="Minimal 8 karakter"
							isRequired={false}
							name="password"
							type="password"
							autocomplete="new-password"
							bind:value={password}
							error={validationErrors?.password}
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
						{#if !getFirstError(validationErrors?.password)}
							<p class="text-xs text-gray-500">
								Gunakan minimal 8 karakter dengan kombinasi huruf, angka, dan simbol
							</p>
						{/if}
					</div>

					<!-- Input Konfirmasi Password Baru -->
					<Text
						label="Konfirmasi Password Baru"
						placeholder="Ulangi password baru"
						isRequired={false}
						name="password_confirmation"
						type="password"
						autocomplete="new-password"
						bind:value={password_confirmation}
						error={validationErrors?.password_confirmation}
					/>

					<!-- Custom error for password mismatch, if applicable -->
					{#if !getFirstError(validationErrors?.password_confirmation) && password_confirmation.length > 0 && password !== password_confirmation}
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

					<!-- Submit Button -->
					<div class="pt-2">
						<button
							type="submit"
							class="flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-indigo-600"
							disabled={submitting}
						>
							{#if submitting}
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
								Memperbarui...
							{:else}
								<!-- <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mr-2" viewBox="0 0 24 24"><path fill="currentColor" d="M21 7v12q0 .825-.587 1.413T19 21H5q-.825 0-1.413-.587T3 19V5q0-.825.587-1.413T5 3h12zm-9 11q1.25 0 2.125-.875T15 15q0-1.25-.875-2.125T12 12q-1.25 0-2.125.875T9 15q0 1.25.875 2.125T12 18m-6-6v-4h9v4z"/></svg> -->
								<svg xmlns="http://www.w3.org/2000/svg" class="mr-2 h-4 w-4" viewBox="0 0 24 24"
									><!-- Icon from Solar by 480 Design - https://creativecommons.org/licenses/by/4.0/ --><g
										fill="none"
										stroke="currentColor"
										stroke-width="1.5"
										><path
											d="M3.464 20.536C4.93 22 7.286 22 12 22s7.071 0 8.535-1.465C22 19.072 22 16.714 22 12c0-.341 0-.512-.015-.686a4.04 4.04 0 0 0-.921-2.224a8 8 0 0 0-.483-.504l-5.167-5.167a9 9 0 0 0-.504-.483a4.04 4.04 0 0 0-2.224-.92C12.512 2 12.342 2 12 2C7.286 2 4.929 2 3.464 3.464C2 4.93 2 7.286 2 12s0 7.071 1.464 8.535Z"
										/><path
											d="M17 22v-1c0-1.886 0-2.828-.586-3.414S14.886 17 13 17h-2c-1.886 0-2.828 0-3.414.586S7 19.114 7 21v1"
										/><path stroke-linecap="round" d="M7 8h6" /></g
									></svg
								>
								Perbarui Pengguna
							{/if}
						</button>
					</div>
				</form>
			{/if}
		</div>

		<!-- Footer Information -->
		<div class="text-center">
			<p class="text-xs text-gray-500">
				<span class="text-red-500">*</span> Menunjukkan field yang wajib diisi
			</p>
			<p class="mt-1 text-xs text-gray-400">
				Kosongkan field password jika tidak ingin mengubahnya.
			</p>
		</div>
	</div>
</div>
