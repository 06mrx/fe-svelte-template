<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { PUBLIC_API_URL } from '$env/static/public';
	import toast, { Toaster } from 'svelte-french-toast';

	// Import fungsi fetch kustom untuk penanganan refresh token
	import { fetchWithTokenRefresh } from '$lib/services/fetchWithTokenRefresh';
	import Text from '$lib/components/input/Text.svelte';

	// State untuk menyimpan data formulir dan status
	let name : string = $state('');
	let successMessage : string = $state('');
	let errorMessage : string = $state('');
	let validationErrors: any = $state({});
    let loading : boolean = $state(false);

	//constant
	const objectName = 'Izin';
	const endpoint = '/api/permissions';
	const backUrl = '/app/admin/permissions';


	
	// Fungsi untuk menangani pengiriman formulir
	async function handleSumit() {
		errorMessage = '';
		successMessage = '';
		validationErrors = {};
		loading = true;

	
		// Menggunakan fetchWithRefreshToken untuk panggilan API
		const response = await fetchWithTokenRefresh(`${PUBLIC_API_URL + endpoint}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Referer: window.location.origin
			},
			body: JSON.stringify({ name })
		});

		const result = await response.json();
		if (response.ok) {
			successMessage = result.message || `${objectName} berhasil ditambahkan!`;
			name = '';
			loading = false;
			goto(backUrl);
		} else if (response.status === 400) {
			validationErrors = result.message;
			loading = false;
			toast.error('Terdapat kesalahan dalam formulir. Silakan periksa kembali');
		} else {
			// errorMessage = result.message || 'Gagal membuat pengguna.';
			loading = false;
		}
	}
</script>

<Toaster />
<div class="flex items-center justify-center py-6">
	<div class="w-full max-w-md space-y-6">
		<!-- Back arrow button -->
		<div class="flex items-center">
			<button
				type="button"
				onclick={() => goto(backUrl)}
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
				Kembali ke Daftar {objectName}
			</button>
		</div>
		<!-- Header Card -->
		<div class="text-center">
			<h2 class="text-2xl font-bold text-gray-900">Tambah {objectName} Baru</h2>
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

			<form onsubmit={handleSumit} class="space-y-5">
				<Text
					label="Nama Izin"
					placeholder="Contoh : view-dashboard"
					isRequired={true}
					error={validationErrors?.name}
					name="name"
					bind:value={name}
				/>

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
							Tambah {objectName}
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
				{objectName} yang dibuat akan mendapatkan akses ke sistem sesuai dengan role yang ditetapkan
			</p>
		</div>
	</div>
</div>
