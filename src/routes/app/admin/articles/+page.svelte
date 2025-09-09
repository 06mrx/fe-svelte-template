<script>
	import { storageService } from '$lib/services/storageService';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import toast, { Toaster } from 'svelte-french-toast';
	import { fetchWithTokenRefresh } from '$lib/services/fetchWithTokenRefresh';

	import DeleteConfirmationModal from '$lib/components/modal/DeleteConfirmationModal.svelte';
	import { PUBLIC_API_URL } from '$env/static/public';
	import EditButton from '$lib/components/button/EditButton.svelte';
	import DeleteButton from '$lib/components/button/DeleteButton.svelte';
	import { debounce, setPaginationData, updateUrlParams } from '$lib/services/functionService';
	import Pagination from '$lib/components/Pagination.svelte';
	import Table from '$lib/components/Table.svelte';
	import ShowButton from '$lib/components/button/ShowButton.svelte';
	import EmptyCard from '$lib/components/EmptyCard.svelte';

	/** @type {import('./$types').PageData} */
	let { data } = $props();

	let datas = $state([]);
	let loading = $state(true);
	let error = $state('');

	// modal state
	let selected = $state(null);
	let isDeleteModalOpen = $state(false);

	let searchTerm = $state('');
	let itemsPerPage = $state(10);

	let pagination = $state({
		current_page: 1,
		last_page: 1,
		per_page: 10,
		total: 0
	});

	let timeout;

	function handle_search() {
		updateUrlParams(searchTerm, itemsPerPage, 1, true);
		fetchDataFromUrlParams();
	}

	function fetchDataFromUrlParams() {
		setTimeout(async () => {
			loading = true;
			error = '';

			const urlParams = $page.url.searchParams;
			const currentPage = parseInt(urlParams.get('page') || '1');
			const currentSearchTerm = urlParams.get('search') || '';
			const currentItemsPerPage = parseInt(urlParams.get('per_page') || '10');

			try {
				let apiUrl = `${PUBLIC_API_URL}/api/articles?page=${currentPage}&per_page=${currentItemsPerPage}`;
				if (currentSearchTerm) {
					apiUrl += `&search=${currentSearchTerm}`;
				}

				const response = await fetchWithTokenRefresh(apiUrl, {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json'
					}
				});

				const result = await response.json();

				if (response.ok) {
					datas = result.data;
					console.log(datas.current_page);
					pagination = setPaginationData(pagination, result);
				} else {
					error = result.message || 'Gagal mengambil data artikel.';
					toast.error(result.message);
				}
			} catch (err) {
				console.error('Fetch data error:', err);
				error = 'Terjadi kesalahan jaringan atau server saat memuat data.';
				toast.error('Terjadi kesalahan jaringan atau server saat memuat data');
			} finally {
				loading = false;
			}
		});
	}

	function handleItemsPerPageChange(newItemsPerPage) {
		updateUrlParams(searchTerm, newItemsPerPage, 1, true);
	}

	function goToPage(pageNumber) {
		updateUrlParams(searchTerm, itemsPerPage, pageNumber, false);
	}

	function prevPage() {
		goToPage(pagination.current_page - 1);
	}

	function nextPage() {
		goToPage(pagination.current_page + 1);
	}

	function resetFilters() {
		searchTerm = '';
		updateUrlParams('', 10, 1, true);
		document.getElementById('per_page').value = 10;
		fetchDataFromUrlParams();
	}

	const openDeleteModal = (selectedItem) => {
		selected = selectedItem;
		console.log(selected.Name);
		isDeleteModalOpen = true;
	};

	const closeDeleteModal = () => {
		isDeleteModalOpen = false;
		selected = null;
	};

	async function handleConfirmDelete() {
		loading = true;
		error = '';

		try {
			const deleteUrl = `${PUBLIC_API_URL}/api/articles/${selected?.id}`;
			const response = await fetchWithTokenRefresh(deleteUrl, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json'
				}
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Gagal menghapus item.');
			}

			toast.success('Data berhasil dihapus!');
			fetchDataFromUrlParams();
		} catch (err) {
			console.error('Error saat menghapus:', err);
			toast.error(err.message || 'Terjadi kesalahan saat menghapus data.');
		}
	}

	onMount(() => {
		const urlParams = $page.url.searchParams;
		searchTerm = urlParams.get('search') || '';
		itemsPerPage = parseInt(urlParams.get('per_page') || '10');
		pagination.current_page = parseInt(urlParams.get('page') || '1');
		pagination.per_page = itemsPerPage;

		fetchDataFromUrlParams();
	});

	$effect(() => {
		if (loading) return;

		const urlParams = $page.url.searchParams;
		const urlSearch = urlParams.get('search') || '';
		const urlPerPage = parseInt(urlParams.get('per_page') || '10');
		const urlPage = parseInt(urlParams.get('page') || '1');

		if (itemsPerPage !== urlPerPage || pagination.current_page !== urlPage) {
			itemsPerPage = urlPerPage;
			pagination.current_page = urlPage;
			pagination.per_page = urlPerPage;
			fetchDataFromUrlParams();
		}
	});

	function create() {
		goto('/app/admin/articles/create');
	}

	function edit(id) {
		goto(`/app/admin/articles/${id}/edit`);
	}

	function show(id) {
		goto(`/app/admin/articles/${id}`);
	}

	function formatDate(dateString) {
		const date = new Date(dateString);
		return date.toLocaleDateString('id-ID', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function getExcerpt(content, maxLength = 100) {
		if (!content) return '-';
		const textContent = content.replace(/<[^>]*>/g, '');
		return textContent.length > maxLength
			? textContent.substring(0, maxLength) + '...'
			: textContent;
	}
</script>

<Toaster />

<div class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
	<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
		<!-- Header Section -->
		<div
        class="mb-6 flex flex-col justify-between space-y-4 sm:flex-row sm:items-center sm:space-y-0"
    >
        <h2 class="text-3xl font-bold text-gray-800">Daftar Artikel</h2>
        <div
            class="flex w-full flex-row flex-wrap items-center space-x-2 space-y-0 sm:w-auto md:flex-nowrap md:space-x-4"
        >
            <input
                type="text"
                placeholder="Cari ..."
                bind:value={searchTerm}
                oninput={() => debounce(handle_search,500)}
                class="min-w-0 flex-1 rounded-md border border-gray-300 px-4 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            <select
                id="per_page"
                onchange={(event) => handleItemsPerPageChange(event.target.value)}
                class="hidden rounded-md border border-gray-300 px-4 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm md:block"
            >
                {#each [10, 20, 50] as option}
                    <option value={option}>{option} per halaman</option>
                {/each}
            </select>
            <button
                onclick={resetFilters}
                class="w-1/3 rounded-md bg-gray-200 px-4 py-2 text-gray-700 shadow-sm transition-colors duration-200 hover:cursor-pointer hover:bg-gray-300 md:flex-1"
            >
                Reset Filter
            </button>
            <button
                onclick={create}
                aria-label="add-button"
                class="rounded-lg border border-emerald-600 p-2 text-emerald-500 shadow-md transition-colors duration-200 hover:cursor-pointer hover:bg-emerald-700 hover:text-white"
            >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24"
                    ><path fill="currentColor" d="M11 13H5v-2h6V5h2v6h6v2h-6v6h-2z" /></svg
                >
            </button>
        </div>
    </div>

		<!-- Content Section -->
		<main>
			{#if loading}
				<!-- Enhanced Loading State -->
				<div class="space-y-4">
					{#each Array(5) as _, i}
						<div class="animate-pulse rounded-2xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
							<div class="flex items-center space-x-4">
								<div class="h-16 w-16 rounded-lg bg-slate-200"></div>
								<div class="flex-1 space-y-2">
									<div class="h-4 w-3/4 rounded bg-slate-200"></div>
									<div class="h-3 w-1/2 rounded bg-slate-200"></div>
									<div class="h-3 w-1/4 rounded bg-slate-200"></div>
								</div>
								<div class="flex space-x-2">
									<div class="h-8 w-8 rounded bg-slate-200"></div>
									<div class="h-8 w-8 rounded bg-slate-200"></div>
									<div class="h-8 w-8 rounded bg-slate-200"></div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{:else if error}
				<!-- Enhanced Error State -->
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
							<h3 class="text-lg font-semibold text-red-800">Terjadi Kesalahan</h3>
							<p class="mt-1 text-red-700">{error}</p>
						</div>
					</div>
				</div>
			{:else if datas.data?.length === 0}
				<!-- Enhanced Empty State -->
				<div
					class="rounded-2xl hidden border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-12 text-center"
				>
					<div
						class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-200"
					>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-amber-600" viewBox="0 0 24 24"><!-- Icon from Solar by 480 Design - https://creativecommons.org/licenses/by/4.0/ --><g fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"><path d="M12 2.75a9.25 9.25 0 1 0 0 18.5a9.25 9.25 0 0 0 0-18.5M1.25 12C1.25 6.063 6.063 1.25 12 1.25S22.75 6.063 22.75 12S17.937 22.75 12 22.75S1.25 17.937 1.25 12"/><path d="M7.4 8.55a.75.75 0 0 1 1.05-.15l2 1.5a.75.75 0 0 1 0 1.2l-2 1.5a.75.75 0 1 1-.9-1.2l1.2-.9l-1.2-.9a.75.75 0 0 1-.15-1.05m9.2 0a.75.75 0 0 0-1.05-.15l-2 1.5a.75.75 0 0 0 0 1.2l2 1.5a.75.75 0 1 0 .9-1.2l-1.2-.9l1.2-.9a.75.75 0 0 0 .15-1.05m-1.07 7.98a.75.75 0 0 1-1.06 0l-.47-.47l-.47.47a.75.75 0 0 1-1.06 0l-.47-.47l-.47.47a.75.75 0 0 1-1.06 0l-.47-.47l-.47.47a.75.75 0 0 1-1.06-1.06l1-1a.75.75 0 0 1 1.06 0l.47.47l.47-.47a.75.75 0 0 1 1.06 0l.47.47l.47-.47a.75.75 0 0 1 1.06 0l1 1a.75.75 0 0 1 0 1.06"/></g></svg>
						
					</div>
					<h3 class="text-xl font-semibold text-amber-800">Yang kamu cari tidak ada</h3>
					<p class="mt-2 text-amber-700">Coba kata kunci yang lain atau buat baru.</p>
					<button
						onclick={create}
						class="mt-6 rounded-xl bg-amber-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-amber-700"
					>
						Buat Sekarang
					</button>
				</div>
                <EmptyCard gotoFunction={create} />
			{:else}
				<!-- Enhanced Article Cards -->
				<div class="space-y-4">
					{#each datas?.data as article, i (article.id)}
						<div
							class=" rounded-2xl bg-white p-6 shadow-lg ring-1 ring-slate-200 transition-all duration-200 hover:shadow-xl hover:ring-2 hover:ring-indigo-200"
						>
							<div class="flex items-start space-x-6">
								<!-- Article Number -->
								<div
									class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-semibold text-slate-600"
								>
									{(datas?.current_page - 1) * datas?.per_page + i + 1}
								</div>

								<!-- Article Content -->
								<div class="min-w-0 flex-1">
									<div class="flex items-start justify-between">
										<div class="min-w-0 flex-1 group">
											<h3
												class="text-lg font-semibold text-slate-900 transition-colors group-hover:text-indigo-600"
											>
												{article.title || 'Tanpa Judul'}
											</h3>

											<!-- Article Meta -->
											<div class="mt-2 flex flex-wrap items-center gap-4 text-sm text-slate-500">
												<div class="flex items-center gap-1">
													<svg
														class="h-4 w-4"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
														/>
													</svg>
													<time datetime={article.created_at}>
														{formatDate(article.created_at)}
													</time>
												</div>

												<!-- Status Badge -->
												<span
													class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
													class:bg-green-100={article.status !== 'draft'}
													class:text-green-800={article.status !== 'draft'}
													class:bg-yellow-100={article.status === 'draft'}
													class:text-yellow-800={article.status === 'draft'}
												>
													<div
														class="mr-1.5 h-2 w-2 rounded-full"
														class:bg-green-400={article.status !== 'draft'}
														class:bg-yellow-400={article.status === 'draft'}
													></div>
													{article.status === 'draft' ? 'Draft' : 'Published'}
												</span>
											</div>

											<!-- Content Preview -->
											{#if article.content}
												<p class="mt-3 text-sm leading-relaxed text-slate-600">
													{getExcerpt(article.content, 150)}
												</p>
											{/if}
										</div>

										<!-- Action Buttons -->
										<div class="ml-6 flex flex-shrink-0 items-center space-x-2">
											<ShowButton onclick={() => show(article.id)} tooltip="Show" />
											<EditButton onclick={() => edit(article.id)} tooltip="Edit" />
											<DeleteButton tooltip="Delete" onclick={() => openDeleteModal(article)}
											></DeleteButton>
										</div>
									</div>
								</div>
							</div>
						</div>
					{/each}
				</div>

				<!-- Pagination -->
				<div class="mt-8">
					<Pagination {pagination} {nextPage} {prevPage} />
				</div>
			{/if}
		</main>
	</div>
</div>

<DeleteConfirmationModal
	isOpen={isDeleteModalOpen}
	onClose={closeDeleteModal}
	onConfirm={handleConfirmDelete}
	itemName={selected?.title || selected?.Name}
/>
