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

	// State untuk menyimpan data formulir dan status
	let id : string = $state('');
	let name : string = $state('');
	let loading : boolean = $state(true); // Status loading untuk pengambilan data awal
	let submitting : boolean = $state(false); // Status loading untuk pengiriman form
	let successMessage : string = $state('');
	let errorMessage : string = $state('');
	let validationErrors: any = $state({});

	// State untuk Permissions
	let allPermissions = $state<{ id: string; name: string }[]>([]); // Menyimpan daftar semua permission dari API
	let selectedPermissionIds = $state<string[]>([]); // Menyimpan ID permission yang dipilih untuk peran ini
	let fetchingPermissions = $state(true); // Status loading untuk mengambil permissions
	let permissionError = $state(''); // Error message jika gagal mengambil permissions
	let selectAllPermissions = $state(false); // State untuk tombol "Select All"

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
	$effect(() => {
		if (!fetchingPermissions && allPermissions.length > 0) {
			// Jika semua permission terpilih, set selectAllPermissions ke true
			selectAllPermissions = selectedPermissionIds.length === allPermissions.length;
		} else if (allPermissions.length === 0) {
			// Jika tidak ada permission, pastikan selectAllPermissions false
			selectAllPermissions = false;
		}
	});

	// Fungsi untuk mengambil daftar semua permissions dari API
	async function fetchAllPermissions() {
		fetchingPermissions = true;
		permissionError = '';
		try {
			const response = await fetchWithTokenRefresh(`${PUBLIC_API_URL}/api/list-permissions`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json'
				}
			});

			const result = await response.json();

			if (response.ok) {
				allPermissions = result.data || [];
			} else {
				permissionError = result.message || 'Gagal mengambil daftar izin.';
				toast.error(permissionError);
			}
		} catch (err: any) {
			console.error('Fetch all permissions error:', err);
			permissionError = err.message || 'Terjadi kesalahan jaringan saat memuat izin.';
			toast.error(permissionError);
		} finally {
			fetchingPermissions = false;
		}
	}

	// Fungsi untuk mengambil data peran spesifik berdasarkan ID
	async function fetchData(roleId: string) {
		loading = true;
		errorMessage = '';
		try {
			const response = await fetchWithTokenRefresh(`${PUBLIC_API_URL}/api/roles/${roleId}`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					Referer: window.location.origin
				}
			});

			const result = await response.json();

			if (response.ok) {
				name = result.data.Name || '';
				// Tandai permission yang sudah dimiliki peran
				if (result.data.Permissions && Array.isArray(result.data.Permissions)) {
					selectedPermissionIds = result.data.Permissions.map((p: any) => p.id);
				} else {
					selectedPermissionIds = [];
				}
				toast.success('Data peran berhasil dimuat.');
			} else {
				errorMessage = result.message || 'Gagal memuat data peran.';
				toast.error(errorMessage);
				if (response.status === 401) {
					// Redirect jika tidak terotentikasi
					storageService.clearUserData();
					goto(
						`/auth/login?returnUrl=${encodeURIComponent($page.url.pathname + $page.url.search)}`
					);
				}
			}
		} catch (error) {
			console.error('Fetch role data error:', error);
			errorMessage = 'Terjadi kesalahan jaringan saat memuat data peran.';
			toast.error(errorMessage);
		} finally {
			loading = false;
		}
	}

	// Fungsi untuk menangani pengiriman formulir update peran dan izin
	async function handleUpdateRoleAndPermissions() {
		errorMessage = '';
		successMessage = '';
		validationErrors = {};
		submitting = true;

		try {
			// --- Langkah 1: Perbarui Nama Peran ---
			const updateRoleResponse = await fetchWithTokenRefresh(`${PUBLIC_API_URL}/api/roles/${id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					Referer: window.location.origin
				},
				body: JSON.stringify({ name })
			});

			const updateRoleResult = await updateRoleResponse.json();

			if (!updateRoleResponse.ok) {
				if (updateRoleResponse.status === 400 || updateRoleResponse.status === 422) {
					validationErrors = updateRoleResult.message;
					errorMessage = 'Terdapat kesalahan dalam formulir. Silakan periksa kembali nama peran.';
				} else {
					errorMessage = updateRoleResult.message || 'Gagal memperbarui peran.';
				}
				toast.error(errorMessage);
				submitting = false;
				return;
			}

			// --- Langkah 2: Lampirkan Izin ke Peran ---
			const attachPermissionsResponse = await fetchWithTokenRefresh(
				`${PUBLIC_API_URL}/api/users/attach-permission`,
				{
					method: 'POST', // API ini mungkin lebih cocok untuk PATCH jika hanya mengubah permission
					headers: {
						'Content-Type': 'application/json',
						Referer: window.location.origin
					},
					body: JSON.stringify({
						id: id, // ID peran yang sedang di-edit
						permission_ids: selectedPermissionIds // Array ID izin yang dipilih saat ini
					})
				}
			);

			const attachPermissionsResult = await attachPermissionsResponse.json();

			if (!attachPermissionsResponse.ok) {
				errorMessage = attachPermissionsResult.message || 'Gagal memperbarui izin peran.';
				toast.error(errorMessage);
				submitting = false;
				return;
			}

			// Jika semua berhasil
			successMessage = 'Peran dan izin berhasil diperbarui!';
			toast.success(successMessage);
			goto('/app/admin/roles'); // Redirect ke daftar peran
		} catch (error: any) {
			console.error('Error updating role or attaching permissions:', error);
			errorMessage = error.message || 'Terjadi kesalahan jaringan atau server.';
			toast.error(errorMessage);
		} finally {
			submitting = false;
		}
	}

	onMount(async () => {
		id = $page.params.id;
		if (id) {
			await fetchAllPermissions(); // Ambil semua izin dulu
			await fetchData(id); // Kemudian ambil data peran dan tandai izin yang relevan
		} else {
			errorMessage = 'ID Peran tidak ditemukan di URL.';
			loading = false;
			toast.error(errorMessage);
		}
	});
</script>

<Toaster />

<div class="flex min-h-[calc(100vh-4rem)] items-start justify-center py-6">
	<div class="w-full max-w-md space-y-6">
		<!-- Back Button -->
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
			<h2 class="text-2xl font-bold text-gray-900">Edit Peran</h2>
			<p class="text-sm text-gray-600">Perbarui nama dan izin untuk peran ini.</p>
		</div>

		<!-- Form Card -->
		<div class="-mt-3 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
			{#if loading}
				<div class="flex items-center justify-center py-8">
					<div
						class="h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"
					></div>
					<p class="ml-4 text-gray-700">Memuat data ...</p>
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

				<form onsubmit={handleUpdateRoleAndPermissions} class="space-y-5">
					<!-- Input Nama Peran -->
					<Text
						label="Nama Peran"
						placeholder="Contoh : Admin"
						isRequired={true}
						name="name"
						type="text"
						bind:value={name}
						error={getFirstError(validationErrors?.name)}
					/>

					<!-- Permissions Checkboxes Section -->
					<div class="space-y-2">
						<!-- <label class="block text-sm font-medium text-gray-700">Izin Peran</label> -->
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
								Perbarui
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
		</div>
	</div>
</div>
