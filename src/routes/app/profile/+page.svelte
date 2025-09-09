<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import toast, { Toaster } from 'svelte-french-toast';
	import { fetchWithTokenRefresh } from '$lib/services/fetchWithTokenRefresh';
	import { PUBLIC_API_URL } from '$env/static/public';
	import { getFirstError } from '$lib/services/functionService';

	let profile = $state(null);
	let loading = $state(true);
	let error = $state('');
	let isEditing = $state(false);
	let validationErrors = $state({});
	// Form states untuk edit mode
	let editForm = $state({
		name: '',
		email: '',
		password: '',
		password_confirmation: ''
	});
	let passwordStrength = $state(0);

	$effect(() => {
		if (editForm.password.length === 0) {
			passwordStrength = 0;
		} else if (editForm.password.length < 6) {
			passwordStrength = 1;
		} else if (editForm.password.length < 8) {
			passwordStrength = 2;
		} else if (editForm.password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/) && password.length >= 8) {
			passwordStrength = 4;
		} else {
			passwordStrength = 3;
		}
	});

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

	// Fungsi untuk memuat data profile
	async function fetchProfile() {
		try {
			loading = true;
			error = '';

			const response = await fetchWithTokenRefresh(`${PUBLIC_API_URL}/api/profile`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json'
				}
			});

			const result = await response.json();

			if (response.ok) {
				profile = result.data;
				// Set form data untuk edit mode
				editForm.name = profile.Name || '';
				editForm.email = profile.Email || '';
				toast.success('Profile berhasil dimuat');
			} else {
				error = result.message || 'Gagal memuat profile.';
				toast.error(result.message || 'Gagal memuat profile.');
			}
		} catch (err) {
			console.error('Error fetching profile:', err);
			error = 'Terjadi kesalahan jaringan atau server.';
			toast.error('Terjadi kesalahan jaringan atau server.');
		} finally {
			loading = false;
		}
	}

	// Fungsi untuk update profile
	async function updateProfile() {
		try {
			loading = true;
			error = '';
			validationErrors = {};
			const response = await fetchWithTokenRefresh(`${PUBLIC_API_URL}/api/update-profile`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(editForm)
			});

			const result = await response.json();

			if (response.ok) {
				profile = { ...profile, ...editForm };
				isEditing = false;
				fetchProfile();
				toast.success('Profile berhasil diperbarui');
			} else if (response.status === 400) {
				// error = result.message || 'Gagal memperbarui profile.';
				toast.error('Terdapat kesalahan dalam formulir. Silakan periksa kembali');
				validationErrors = result.message;
				loading = false;
			} else {
				loading = false;
				toast.error('Gagal memperbarui profile.');
			}
		} catch (err) {
			console.error('Error updating profile:', err);
			error = 'Terjadi kesalahan jaringan atau server.';
			toast.error('Terjadi kesalahan jaringan atau server.');
		} finally {
			loading = false;
		}
	}

	function formatDate(dateString) {
		if (!dateString) return '-';
		const date = new Date(dateString);
		return date.toLocaleDateString('id-ID', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function getInitials(name) {
		if (!name) return '??';
		return name
			.split(' ')
			.map((word) => word.charAt(0).toUpperCase())
			.join('')
			.substring(0, 2);
	}

	function getAuthProviderDisplay(provider) {
		if (!provider) return 'Email/Password';
		return provider === 'google' ? 'Google Account' : provider;
	}

	function getRoleColor(roleName) {
		const colors = {
			admin: 'bg-red-100 text-red-800',
			user: 'bg-blue-100 text-blue-800',
			moderator: 'bg-green-100 text-green-800',
			editor: 'bg-purple-100 text-purple-800'
		};
		return colors[roleName?.toLowerCase()] || 'bg-gray-100 text-gray-800';
	}

	function cancelEdit() {
		isEditing = false;
		editForm.name = profile?.Name || '';
		editForm.Email = profile?.Email || '';
		error = '';
	}

    function handelBack() {
    if (window.history.length > 1) {
        // Ada riwayat, kembali ke halaman sebelumnya
        window.history.back();
    } else {
        // Tidak ada riwayat, navigasi ke halaman login
        // Di Svelte, ini bisa menjadi fungsi `goto` dari pustaka navigasi
        goto('/auth/login');
    }
}

	onMount(() => {
		fetchProfile();
	});
</script>

<Toaster />

<div class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
	<div class="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
		<!-- Header Section -->
		<header class="mb-8">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-4xl font-bold text-slate-900 sm:text-5xl">Profile Saya</h1>
					<p class="mt-2 text-lg text-slate-600">Kelola informasi akun dan preferensi Anda</p>
				</div>

				<!-- Back Button -->
				<button
					onclick={() => handelBack()}
					class="group flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm ring-1 ring-slate-200 transition-all duration-200 hover:bg-slate-50 hover:shadow-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
				>
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
					Kembali
				</button>
			</div>
		</header>

		<!-- Content -->
		<main>
			{#if loading && !profile}
				<!-- Loading Skeleton -->
				<div class="animate-pulse space-y-6">
					<!-- Profile Card Skeleton -->
					<div class="rounded-2xl bg-white p-8 shadow-lg ring-1 ring-slate-200">
						<div class="flex items-center space-x-6">
							<div class="h-24 w-24 rounded-full bg-slate-200"></div>
							<div class="flex-1 space-y-4">
								<div class="h-6 w-1/2 rounded bg-slate-200"></div>
								<div class="h-4 w-3/4 rounded bg-slate-200"></div>
								<div class="h-4 w-1/3 rounded bg-slate-200"></div>
							</div>
						</div>
					</div>

					<!-- Details Card Skeleton -->
					<div class="rounded-2xl bg-white p-8 shadow-lg ring-1 ring-slate-200">
						<div class="space-y-4">
							<div class="h-6 w-1/4 rounded bg-slate-200"></div>
							{#each Array(4) as _}
								<div class="flex justify-between">
									<div class="h-4 w-1/4 rounded bg-slate-200"></div>
									<div class="h-4 w-1/2 rounded bg-slate-200"></div>
								</div>
							{/each}
						</div>
					</div>
				</div>
			{:else if error && !profile}
				<!-- Error State -->
				<div class="rounded-2xl border border-red-200 bg-gradient-to-r from-red-50 to-red-100 p-8">
					<div class="flex items-center gap-4">
						<div class="flex-shrink-0 rounded-full bg-red-200 p-3">
							<svg class="h-6 w-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
								<path
									fill-rule="evenodd"
									d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
									clip-rule="evenodd"
								/>
							</svg>
						</div>
						<div>
							<h3 class="text-lg font-semibold text-red-800">Gagal Memuat Profile</h3>
							<p class="mt-1 text-red-700">{error}</p>
							<button
								onclick={fetchProfile}
								class="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
							>
								Coba Lagi
							</button>
						</div>
					</div>
				</div>
			{:else if profile}
				<!-- Profile Content -->
				<div class="space-y-8">
					<!-- Main Profile Card -->
					<div class="rounded-2xl bg-white p-8 shadow-lg ring-1 ring-slate-200">
						<div class="flex items-start justify-between">
							<div class="flex items-center space-x-6">
								<!-- Avatar -->
								<div
									class="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 text-2xl font-bold text-white shadow-lg"
								>
									{getInitials(profile.Name)}
								</div>

								<div>
									{#if isEditing}
										<!-- Edit Mode -->
										<div class="space-y-4">
											<div>
												<label class="block text-sm font-medium text-slate-700">Nama</label>
												<input
													type="text"
													bind:value={editForm.name}
													class="mt-1 block w-80 rounded-xl border-0 px-4 py-3 ring-1 ring-slate-300 ring-inset focus:ring-2 focus:ring-indigo-600 sm:text-sm"
													placeholder="Masukkan nama Anda"
												/>
											</div>
											<div>
												<label class="block text-sm font-medium text-slate-700">Email</label>
												<input
													type="email"
													bind:value={editForm.email}
													class="mt-1 block w-80 rounded-xl border-0 px-4 py-3 ring-1 ring-slate-300 ring-inset focus:ring-2 focus:ring-indigo-600 sm:text-sm"
													placeholder="Masukkan email Anda"
												/>
											</div>
											<div>
												<label class="block text-sm font-medium text-slate-700"
													>Password (Kosongkan Jika Tidak Ingin Diganti)</label
												>
												<input
													type="password"
													autocomplete="new-password"
													bind:value={editForm.password}
													class="mt-1 block w-80 rounded-xl border-0 px-4 py-3 ring-1 ring-slate-300 ring-inset focus:ring-2 focus:ring-indigo-600 sm:text-sm"
													placeholder="Masukkan password Anda"
												/>
												{#if editForm.password.length > 0}
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
											<div>
												<label class="block text-sm font-medium text-slate-700"
													>Konfirmasi Password</label
												>
												<input
													type="password"
													bind:value={editForm.password_confirmation}
													class="mt-1 block w-80 rounded-xl border-0 px-4 py-3 ring-1 ring-slate-300 ring-inset focus:ring-2 focus:ring-indigo-600 sm:text-sm"
													placeholder="Konfirmasi password Anda"
												/>
												<!-- {editForm.password_confirmation.length} -->
												{#if editForm.password_confirmation.length > 0 && editForm.password !== editForm.password_confirmation}
													<p class="mt-1 flex items-center gap-1 text-xs text-red-600">
														<svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"
															><path
																fill-rule="evenodd"
																d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
																clip-rule="evenodd"
															/></svg
														>
														Password tidak cocok
													</p>{/if}
											</div>
										</div>
									{:else}
										<!-- View Mode -->
										<h2 class="text-2xl font-bold text-slate-900">
											{profile.Name || 'Nama tidak tersedia'}
										</h2>
										<p class="text-lg text-slate-600">{profile.Email}</p>

										<!-- Roles -->
										{#if profile.Roles && profile.Roles.length > 0}
											<div class="mt-3 flex flex-wrap gap-2">
												{#each profile.Roles as role}
													<span
														class="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium {getRoleColor(
															role.Name
														)}"
													>
														<div class="mr-1.5 h-2 w-2 rounded-full bg-current opacity-75"></div>
														{role.Name}
													</span>
												{/each}
											</div>
										{/if}
									{/if}
								</div>
							</div>

							<!-- Action Buttons -->
							<div class="flex items-center space-x-3">
								{#if isEditing}
									<button
										onclick={cancelEdit}
										disabled={loading}
										class="rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-50"
									>
										Batal
									</button>
									<button
										onclick={updateProfile}
										disabled={loading}
										class="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
									>
										{#if loading}
											<svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
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
										{:else}
											<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M5 13l4 4L19 7"
												/>
											</svg>
										{/if}
										Simpan
									</button>
								{:else}
									<button
										onclick={() => (isEditing = true)}
										class="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
									>
										<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
											/>
										</svg>
										Edit Profile
									</button>
								{/if}
							</div>
						</div>

						<!-- Error message in edit mode -->
						{#if error && isEditing}
							<div class="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
								<p class="text-sm text-red-700">{error}</p>
							</div>
						{/if}
					</div>

					<!-- Account Details Card -->
					<div class="rounded-2xl bg-white p-8 shadow-lg ring-1 ring-slate-200">
						<h3 class="mb-6 text-xl font-semibold text-slate-900">Informasi Akun</h3>

						<div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
							<!-- Account ID -->
							<div class="space-y-2">
								<dt class="text-sm font-medium text-slate-500">ID Akun</dt>
								<dd class="rounded-lg bg-slate-50 px-3 py-2 font-mono text-sm text-slate-900">
									{profile.id}
								</dd>
							</div>

							<!-- Auth Provider -->
							<div class="space-y-2">
								<dt class="text-sm font-medium text-slate-500">Metode Login</dt>
								<dd class="text-sm text-slate-900">
									<span
										class="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
									>
										{getAuthProviderDisplay(profile.AuthProvider)}
									</span>
								</dd>
							</div>

							<!-- Created Date -->
							<div class="space-y-2">
								<dt class="text-sm font-medium text-slate-500">Bergabung Sejak</dt>
								<dd class="text-sm text-slate-900">
									{formatDate(profile.CreatedAt)}
								</dd>
							</div>

							<!-- Last Updated -->
							<div class="space-y-2">
								<dt class="text-sm font-medium text-slate-500">Terakhir Diperbarui</dt>
								<dd class="text-sm text-slate-900">
									{formatDate(profile.UpdatedAt)}
								</dd>
							</div>
						</div>
					</div>

					<!-- Roles & Permissions Card -->
					{#if profile.Roles && profile.Roles.length > 0}
						<div class="rounded-2xl bg-white p-8 shadow-lg ring-1 ring-slate-200">
							<h3 class="mb-6 text-xl font-semibold text-slate-900">Peran & Akses</h3>

							<div class="space-y-4">
								{#each profile.Roles as role}
									<div class="flex items-center justify-between rounded-xl bg-slate-50 p-4">
										<div class="flex items-center space-x-3">
											<div
												class="flex h-10 w-10 items-center justify-center rounded-lg {getRoleColor(
													role.Name
												)}"
											>
												<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
													/>
												</svg>
											</div>
											<div>
												<h4 class="font-medium text-slate-900 capitalize">{role.Name}</h4>
												<p class="text-sm text-slate-500">
													Aktif sejak {formatDate(role.CreatedAt)}
												</p>
											</div>
										</div>

										<span class="text-xs font-medium text-slate-500">
											ID: {role.id.substring(0, 8)}...
										</span>
									</div>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			{/if}
		</main>
	</div>
</div>
