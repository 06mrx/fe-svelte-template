<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { PUBLIC_API_URL } from '$env/static/public';
	import toast, { Toaster } from 'svelte-french-toast';

	// Import fungsi fetch kustom untuk penanganan refresh token
	import { fetchWithTokenRefresh } from '$lib/services/fetchWithTokenRefresh';
	import Text from '$lib/components/input/Text.svelte';
	import { getFirstError } from '$lib/services/functionService'; // Untuk menampilkan error validasi

	// State untuk menyimpan data formulir dan status
	let name : string = $state('')
	let loading : boolean = $state(false); // Status loading untuk pengambilan data awal
	let successMessage : string = $state('');
	let errorMessage : string = $state('');
	let validationErrors : any = $state({});

	// State untuk Permissions
	let allPermissions = $state<{ id: string; name: string }[]>([]); // Menyimpan daftar semua permission dari API
	let selectedPermissionIds = $state<string[]>([]); // Menyimpan ID permission yang dipilih
	let fetchingPermissions = $state(true); // Status loading untuk mengambil permissions
	let permissionError = $state(''); // Error message jika gagal mengambil permissions
	let selectAllPermissions = $state(false); // State untuk tombol "Select All"

	// Fungsi untuk mengambil daftar permissions dari API
	async function fetchPermissions() {
		fetchingPermissions = true;
		permissionError = '';
		try {
			const response = await fetchWithTokenRefresh(`${PUBLIC_API_URL}/api/permissions`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json'
				}
			});

			const result = await response.json();

			if (response.ok) {
				allPermissions = result.data.data || []; // Sesuaikan dengan struktur respons API Anda
			} else {
				permissionError = result.message || 'Gagal mengambil daftar izin.';
				toast.error(permissionError);
			}
		} catch (err: any) {
			console.error('Fetch permissions error:', err);
			permissionError = err.message || 'Terjadi kesalahan jaringan saat memuat izin.';
			toast.error(permissionError);
		} finally {
			fetchingPermissions = false;
		}
	}

	// Fungsi untuk menangani toggle "Select All"
	function toggleSelectAllPermissions() {
		if (selectAllPermissions) {
			// Jika "Select All" dicentang, tambahkan semua ID permission
			selectedPermissionIds = allPermissions.map((p) => p.id);
		} else {
			// Jika "Select All" tidak dicentang, kosongkan pilihan
			selectedPermissionIds = [];
		}
	}

	// Effect untuk sinkronisasi selectAllPermissions dengan selectedPermissionIds
	$effect(() => {
		if (!fetchingPermissions && allPermissions.length > 0) {
			// Jika semua permission terpilih, set selectAllPermissions ke true
			selectAllPermissions = selectedPermissionIds.length === allPermissions.length;
		} else if (allPermissions.length === 0) {
			// Jika tidak ada permission, pastikan selectAllPermissions false
			selectAllPermissions = false;
		}
	});

	// Fungsi untuk menangani pengiriman formulir (buat peran dan lampirkan izin)
	async function handleCreateRoleAndPermissions() {
		errorMessage = '';
		successMessage = '';
		validationErrors = {};
		loading = true;

		try {
			// --- Langkah 1: Buat Peran Baru ---
			const createRoleResponse = await fetchWithTokenRefresh(`${PUBLIC_API_URL}/api/roles`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Referer: window.location.origin
				},
				body: JSON.stringify({ name }) // Hanya kirim nama peran
			});

			const createRoleResult = await createRoleResponse.json();

			if (!createRoleResponse.ok) {
				if (createRoleResponse.status === 400 || createRoleResponse.status === 422) {
					validationErrors = createRoleResult.message;
					errorMessage = 'Terdapat kesalahan dalam formulir. Silakan periksa kembali.';
					toast.error('Terdapat kesalahan dalam formulir. Silakan periksa kembali.');
				} else {
					errorMessage = createRoleResult.message || 'Gagal membuat peran.';
					toast.error(errorMessage);
				}

				loading = false;
				return;
			}

			const newRoleId = createRoleResult.data.id; // Asumsikan API mengembalikan ID peran yang baru dibuat

			// --- Langkah 2: Lampirkan Izin ke Peran Baru ---
			// Hanya kirim permintaan attach jika ada permission yang dipilih
			if (selectedPermissionIds.length > 0) {
				const attachPermissionsResponse = await fetchWithTokenRefresh(
					`${PUBLIC_API_URL}/api/users/attach-permission`,
					{
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							Referer: window.location.origin
						},
						body: JSON.stringify({
							id: newRoleId, // ID peran yang baru dibuat
							permission_ids: selectedPermissionIds // Array ID izin yang dipilih
						})
					}
				);

				const attachPermissionsResult = await attachPermissionsResponse.json();

				if (!attachPermissionsResponse.ok) {
					errorMessage = attachPermissionsResult.message || 'Gagal melampirkan izin ke peran.';
					toast.error(errorMessage);
					loading = false;
					// Pertimbangkan untuk melakukan roll-back peran yang sudah dibuat jika attach permissions gagal
					// Misalnya dengan memanggil API DELETE /api/roles/{newRoleId}
					return;
				}
			}

			// Jika semua berhasil
			successMessage = 'Peran dan izin berhasil ditambahkan!';
			toast.success(successMessage);
			name = ''; // Reset form
			selectedPermissionIds = []; // Reset pilihan izin
			selectAllPermissions = false; // Reset "Select All"
			loading = false;
			goto('/app/admin/roles'); // Redirect ke daftar peran
		} catch (error: any) {
			console.error('Error creating role or attaching permissions:', error);
			errorMessage = error.message || 'Terjadi kesalahan jaringan atau server.';
			toast.error(errorMessage);
		} finally {
			loading = false;
		}
	}

	onMount(async () => {
		// Panggil fungsi untuk mengambil permissions saat komponen di-mount
		fetchPermissions();
	});
</script>

<Toaster />
<div class="flex items-center justify-center py-6">
	<div class="w-full max-w-md space-y-6">
		<!-- Back arrow button -->
		<div class="flex items-center">
			<button
				type="button"
				onclick={() => goto('/app/admin/roles')}
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
				Kembali ke Daftar Peran
			</button>
		</div>
		<!-- Header Card -->
		<div class="text-center">
			<h2 class="text-2xl font-bold text-gray-900">Tambah Peran Baru</h2>
			<p class="text-sm text-gray-600">
				Lengkapi formulir di bawah untuk menambahkan peran baru beserta izinnya.
			</p>
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

			<form onsubmit={handleCreateRoleAndPermissions} class="space-y-5">
				<Text
					label="Nama Peran"
					placeholder="Contoh: Admin"
					isRequired={true}
					error={getFirstError(validationErrors?.name)}
					name="name"
					bind:value={name}
				/>

				<!-- Permissions Checkboxes Section -->
				<div class="space-y-2">
					<div class="flex items-center justify-between">
						<label class="block text-sm font-medium text-gray-700">Izin Peran</label>
						{#if !fetchingPermissions && allPermissions.length > 0}
							<label class="flex items-center space-x-2 text-sm text-gray-600">
								<input
									type="checkbox"
									bind:checked={selectAllPermissions}
									onchange={toggleSelectAllPermissions}
									class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
								/>
								<span>Pilih Semua</span>
							</label>
						{/if}
					</div>

					{#if fetchingPermissions}
						<div class="flex items-center justify-center p-4 text-gray-600">
							<svg
								class="mr-2 h-5 w-5 animate-spin"
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
							Memuat izin...
						</div>
					{:else if permissionError}
						<div class="rounded-md bg-red-50 p-3 text-sm text-red-700">
							{permissionError}
						</div>
					{:else if allPermissions.length === 0}
						<div class="rounded-md bg-yellow-50 p-3 text-sm text-yellow-700">
							Tidak ada izin yang ditemukan.
						</div>
					{:else}
						<div
							class="grid max-h-60 grid-cols-1 gap-x-4 gap-y-2 overflow-y-auto rounded-md border border-gray-200 p-3 sm:grid-cols-2"
						>
							{#each allPermissions as permission (permission.id)}
								<label class="flex items-center space-x-2 text-sm text-gray-700">
									<input
										type="checkbox"
										value={permission.id}
										bind:group={selectedPermissionIds}
										class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
									/>
									<span>{permission.name}</span>
								</label>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Submit Button -->
				<div class="pt-2">
					<button
						type="submit"
						class="flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-indigo-600"
						disabled={loading}
					>
						{#if loading}
							<svg
								class="-ml-1 mr-2 h-4 w-4 animate-spin text-white"
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
							Tambah Peran
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
				Peran yang dibuat akan mendapatkan akses ke sistem sesuai dengan role yang ditetapkan
			</p>
		</div>
	</div>
</div>
