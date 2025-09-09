<script lang="ts">
	import { onMount } from 'svelte';
	import { PUBLIC_API_URL } from '$env/static/public';
	import toast, { Toaster } from 'svelte-french-toast';

	// Import custom fetch function for token refresh
	import { fetchWithTokenRefresh } from '$lib/services/fetchWithTokenRefresh';
	import { debounce, setPaginationData, updateUrlParams } from '$lib/services/functionService';
	import { page } from '$app/stores';
	import Pagination from '$lib/components/Pagination.svelte';

	// Data type for audit entries
	interface Audit {
		ID: number;
		AuditableType: string;
		AuditableID: string;
		Event: string;
		UserID: string;
		OldValues: any | null;
		NewValues: any | null;
		CreatedAt: string;
		UpdatedAt: string;
	}

	// Reactive state
	let audits: Audit[] = $state([]);
	let loading: boolean = $state(true);
	let errorMessage: string = $state('');
     let error = $state('');

	// State to manage the display of OldValues/NewValues details
	let expandedAudits: Set<number> = $state(new Set());

	// Function to format the date
	function formatDate(dateString: string): string {
		if (!dateString) return 'N/A';
		const date = new Date(dateString);
		return date.toLocaleString('id-ID', {
			dateStyle: 'medium',
			timeStyle: 'short'
		});
	}

	// Function to decode Base64 and parse JSON
	function decodeBase64AndParse(base64String: string | null): string {
		if (!base64String) {
			return 'N/A';
		}
		try {
			// Decode the Base64 string
			const decodedString = atob(base64String);
			// Parse the JSON object from the decoded string
			return JSON.stringify(JSON.parse(decodedString), null, 2);
		} catch (e) {
			console.error('Failed to decode Base64 or parse JSON:', e);
			return `Error: Failed to process data. Raw value: ${base64String}`;
		}
	}

	// Function to fetch audit data from the API
	// async function fetchAudits() {
	// 	try {
	// 		const response = await fetchWithTokenRefresh(`${PUBLIC_API_URL}/api/audits`, {
	// 			method: 'GET'
	// 		});

	// 		const result = await response.json();
	// 		if (response.ok) {
	// 			audits = result.data.data || [];
	// 		} else {
	// 			errorMessage = result.message || 'Failed to fetch audit log data.';
	// 			toast.error(errorMessage);
	// 		}
	// 	} catch (error) {
	// 		errorMessage = 'An error occurred during data retrieval.';
	// 		toast.error(errorMessage);
	// 	} finally {
	// 		loading = false;
	// 	}
	// }
    let searchTerm = $state(''); // State untuk input pencarian (user typing)
    let itemsPerPage = $state(10); // State untuk items per halaman dari select
    let sortOder = $state('ASC');
    let pagination = $state({
        current_page: 1,
        last_page: 1,
        per_page: 10, // Akan disinkronkan dari URL atau disetel ke 10
        total: 0
    });

    let timeout;
    function handle_search() {
        updateUrlParams(searchTerm, itemsPerPage, 1, true, sortOder);
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
            const currentSortOder = urlParams.get('sort_order') || 'ASC';

            try {
                let apiUrl = `${PUBLIC_API_URL}/api/audits?page=${currentPage}&per_page=${currentItemsPerPage}&sort_order=${currentSortOder}`;
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
                    audits = result.data.data || [];
                    
                    // console.log(audits.current_page);
                    pagination = setPaginationData(pagination, result);
                    // toast.success(result.message);
                } else {
                    error = result.message || 'Gagal mengambil data peran.';
                    toast.error(result.message);
                }
            } catch (err) {
                console.error('Fetch permissions error:', err);
                error = 'Terjadi kesalahan jaringan atau server saat memuat data.';
                toast.error('Terjadi kesalahan jaringan atau server saat memuat data');
            } finally {
                loading = false;
            }
        });
    }

    function handleItemsPerPageChange(newItemsPerPage) {
        // alert(newItemsPerPage);
        updateUrlParams(searchTerm, newItemsPerPage, 1, true, sortOder);
    }
    function handleItemsSortOrderChange(newSortOrder) {
        // alert(newItemsPerPage);
        updateUrlParams(searchTerm, itemsPerPage, 1, true, newSortOrder);
    }

    function goToPage(pageNumber) {
        updateUrlParams(searchTerm, itemsPerPage, pageNumber, false, sortOder);
    }

    function prevPage() {
        goToPage(pagination.current_page - 1);
    }

    function nextPage() {
        goToPage(pagination.current_page + 1);
    }

    function resetFilters() {
        searchTerm = ''; // Reset state input
        updateUrlParams('', 10,1, true, 'ASC'); // Update URL untuk mereset semua filter
        (document.getElementById('per_page') as HTMLSelectElement).value = '10';
        (document.getElementById('sort_order') as HTMLSelectElement).value = 'ASC';
        fetchDataFromUrlParams();
    }

	// Call the fetch function when the component is mounted
	onMount(() => {
		const urlParams = $page.url.searchParams;
        searchTerm = urlParams.get('search') || '';
        itemsPerPage = parseInt(urlParams.get('per_page') || '10');
        pagination.current_page = parseInt(urlParams.get('page') || '1');
        pagination.per_page = itemsPerPage;

        fetchDataFromUrlParams();
	});

	// Function to toggle the display of details (corrected for reactivity)
	function toggleDetails(auditId: number) {
		const newExpandedAudits = new Set(expandedAudits);
		if (newExpandedAudits.has(auditId)) {
			newExpandedAudits.delete(auditId);
		} else {
			newExpandedAudits.add(auditId);
		}
		expandedAudits = newExpandedAudits; // Reassigning to trigger reactivity
	}

    $effect(() => {
        if (loading) return;

        const urlParams = $page.url.searchParams;
        const urlSearch = urlParams.get('search') || '';
        const urlPerPage = parseInt(urlParams.get('per_page') || '10');
        const urlPage = parseInt(urlParams.get('page') || '1');
        const urlSortOrder = urlParams.get('sort_order') || 'ASC';
        if (
            // searchTerm !== urlSearch || // Membiarkan searchTerm tidak memicu fetch berulang saat diketik
            itemsPerPage !== urlPerPage ||
            pagination.current_page !== urlPage ||
            sortOder !== urlSortOrder

        ) {
            // searchTerm = urlSearch;
            itemsPerPage = urlPerPage;
            pagination.current_page = urlPage;
            sortOder = urlSortOrder;
            pagination.per_page = urlPerPage;
            fetchDataFromUrlParams();
        }
    });
</script>



<Toaster />

<div class="container mx-auto p-4 md:p-8">
	<div
		class="mb-6 flex flex-col justify-between space-y-4 sm:flex-row sm:items-center sm:space-y-0"
	>
		<h2 class="text-3xl font-bold text-gray-800">Log Audit</h2>
		<div
			class="flex w-full flex-row flex-wrap items-center space-y-0 space-x-2 sm:w-auto md:flex-nowrap md:space-x-4"
		>
			<input
				type="text"
				placeholder="Cari ..."
				bind:value={searchTerm}
				oninput={() => debounce(handle_search, 500)}
				class="min-w-0 flex-1 rounded-md border border-gray-300 px-4 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
			/>
			<select
				id="per_page"
				onchange={(event) => handleItemsPerPageChange((event.target as HTMLSelectElement).value)}
				class="hidden rounded-md border border-gray-300 px-4 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm md:block"
			>
				{#each [10, 20, 50] as option}
					<option value={option}>{option} per halaman</option>
				{/each}
			</select>
            <select
				id="sort_order"
				onchange={(event) => handleItemsSortOrderChange((event.target as HTMLSelectElement).value)}
				class="hidden rounded-md border border-gray-300 px-4 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm md:block"
			>
				{#each ['ASC', 'DESC'] as option}
					<option value={option}>{option == 'ASC' ? 'A-Z' : 'Z-A'} </option>
				{/each}
			</select>
			<button
				onclick={resetFilters}
				class="w-1/3 rounded-md bg-gray-200 px-4 py-2 text-gray-700 shadow-sm transition-colors duration-200 hover:cursor-pointer hover:bg-gray-300 md:flex-1"
			>
				Reset Filter
			</button>
			
		</div>
	</div>

	<!-- Loading and Error State -->
	{#if loading}
		<div class="flex items-center justify-center py-12">
			<svg
				class="h-10 w-10 animate-spin text-indigo-600"
				fill="none"
				viewBox="0 0 24 24"
				xmlns="http://www.w3.org/2000/svg"
			>
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
				<path
					class="opacity-75"
					fill="currentColor"
					d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
				/>
			</svg>
			<span class="ml-4 text-lg text-gray-600">Fetching audit data...</span>
		</div>
	{:else if errorMessage}
		<div class="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
			<p class="font-medium text-red-800">{errorMessage}</p>
			<p class="mt-2 text-sm text-red-600">
				Make sure the API server is running and you have access permissions.
			</p>
		</div>
	{:else if audits.length === 0}
		<div class="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
			<p class="font-medium text-gray-600">No audit logs found.</p>
		</div>
	{:else}
		<!-- Audit Log List -->
		<div class="space-y-4">
			{#each audits as audit (audit.ID)}
				<div
					class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-xl hover:ring-2 hover:ring-indigo-200"
				>
					<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div>
							<p class="text-xs font-medium text-gray-500 uppercase">Event</p>
							<p class="text-lg font-semibold text-gray-800">{audit.Event}</p>
						</div>
						<div>
							<p class="text-xs font-medium text-gray-500 uppercase">Type / ID</p>
							<p class="text-sm text-gray-800">
								{audit.AuditableType} - <span class="font-mono">{audit.AuditableID || 'N/A'}</span>
							</p>
						</div>
						<div>
							<p class="text-xs font-medium text-gray-500 uppercase">User ID</p>
							<p class="truncate font-mono text-sm text-gray-600">{audit.UserID || 'N/A'}</p>
						</div>
						<div>
							<p class="text-xs font-medium text-gray-500 uppercase">Time</p>
							<p class="text-sm text-gray-600">{formatDate(audit.CreatedAt)}</p>
						</div>
					</div>

					<!-- Button to show/hide details -->
					<div class="mt-4 border-t border-gray-100 pt-4">
						<button
							onclick={() => toggleDetails(audit.ID)}
							class="text-sm font-medium text-indigo-600 hover:text-indigo-800"
						>
							{#if expandedAudits.has(audit.ID)}
								Hide Details
							{:else}
								Show Details
							{/if}
						</button>
					</div>

					<!-- Collapsible detail content -->
					{#if expandedAudits.has(audit.ID)}
						<div class="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
							<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
								<div>
									<h4 class="text-xs font-medium text-gray-500 uppercase">Old Values</h4>
									<pre
										class="mt-1 overflow-x-auto rounded-md bg-white p-2 text-sm text-gray-800 shadow-inner">{decodeBase64AndParse(
											audit.OldValues
										)}</pre>
								</div>
								<div>
									<h4 class="text-xs font-medium text-gray-500 uppercase">New Values</h4>
									<pre
										class="mt-1 overflow-x-auto rounded-md bg-white p-2 text-sm text-gray-800 shadow-inner">{decodeBase64AndParse(
											audit.NewValues
										)}</pre>
								</div>
							</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>
        <div class="mt-3">
            <Pagination {pagination} {nextPage} {prevPage} />
        </div>
	{/if}
</div>
