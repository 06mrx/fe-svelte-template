<script>
    import { storageService } from '$lib/services/storageService';
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores'; // Import $page store
    import toast, { Toaster } from 'svelte-french-toast';
    import { fetchWithTokenRefresh } from '$lib/services/fetchWithTokenRefresh'; // Mengimpor fungsi wrapper baru

    import DeleteConfirmationModal from '$lib/components/modal/DeleteConfirmationModal.svelte';
    import { PUBLIC_API_URL } from '$env/static/public';
    import EditButton from '$lib/components/button/EditButton.svelte';
    import DeleteButton from '$lib/components/button/DeleteButton.svelte';
    import { debounce, setPaginationData, updateUrlParams } from '$lib/services/functionService';
    import Pagination from '$lib/components/Pagination.svelte';
    import Table from '$lib/components/Table.svelte';
	import EmptyCard from '$lib/components/EmptyCard.svelte';
    /** @type {import('./$types').PageData} */
    let { data } = $props();

    let roles = $state([]);
    let loading = $state(true);
    let error = $state('');

    // modal state
    let selected = $state(null);
    let isDeleteModalOpen = $state(false);

    let searchTerm = $state(''); // State untuk input pencarian (user typing)
    let itemsPerPage = $state(10); // State untuk items per halaman dari select

    let pagination = $state({
        current_page: 1,
        last_page: 1,
        per_page: 10, // Akan disinkronkan dari URL atau disetel ke 10
        total: 0
    });

    let timeout;
    // function handle_search() {
    // 	if (timeout) clearTimeout(timeout);
    // 	timeout = setTimeout(() => {
    // 		updateUrlParams(searchTerm, itemsPerPage, 1, true);
    // 		fetchDataFromUrlParams();
    // 	}, 500);
    // }

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
                let apiUrl = `${PUBLIC_API_URL}/api/roles?page=${currentPage}&per_page=${currentItemsPerPage}`;
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
                    roles = result.data;
                    console.log(roles.current_page);
                    pagination = setPaginationData(pagination, result);
                    toast.success(result.message);
                } else {
                    error = result.message || 'Gagal mengambil data peran.';
                    toast.error(result.message);
                }
            } catch (err) {
                console.error('Fetch roles error:', err);
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
        searchTerm = ''; // Reset state input
        updateUrlParams('', 10, 1, true); // Update URL untuk mereset semua filter
        document.getElementById('per_page').value = 10;
        fetchDataFromUrlParams();
    }

    // Logika untuk Modal
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
            const deleteUrl = `${PUBLIC_API_URL}/api/roles/${selected?.id}`;
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

            toast.success('Peran berhasil dihapus!');
            fetchDataFromUrlParams();
        } catch (err) {
            console.error('Error saat menghapus:', err);
            toast.error(err.message || 'Terjadi kesalahan saat menghapus peran.');
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

    // $effect: Ini adalah "otak" reaktivitas utama.
    $effect(() => {
        if (loading) return;

        const urlParams = $page.url.searchParams;
        const urlSearch = urlParams.get('search') || '';
        const urlPerPage = parseInt(urlParams.get('per_page') || '10');
        const urlPage = parseInt(urlParams.get('page') || '1');

        if (
            // searchTerm !== urlSearch || // Membiarkan searchTerm tidak memicu fetch berulang saat diketik
            itemsPerPage !== urlPerPage ||
            pagination.current_page !== urlPage
        ) {
            // searchTerm = urlSearch;
            itemsPerPage = urlPerPage;
            pagination.current_page = urlPage;
            pagination.per_page = urlPerPage;
            fetchDataFromUrlParams();
        }
    });

    function create() {
        goto('/app/admin/roles/create');
    }

    function edit(userId) {
        goto(`/app/admin/roles/${userId}/edit`);
    }
</script>

<Toaster />

<div class="mx-auto w-full p-3 md:p-5">
    <div
        class="mb-6 flex flex-col justify-between space-y-4 sm:flex-row sm:items-center sm:space-y-0"
    >
        <h2 class="text-3xl font-bold text-gray-800">Daftar Peran</h2>
        <div
            class="flex w-full flex-row flex-wrap items-center space-x-2 space-y-0 sm:w-auto md:flex-nowrap md:space-x-4"
        >
            <input
                type="text"
                placeholder="Cari peran..."
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

    {#if loading}
        <div class="flex h-48 items-center justify-center">
            <div
                class="h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"
            ></div>
            <p class="ml-4 text-gray-700">Memuat peran...</p>
        </div>
    {:else if error}
        <div
            class="relative rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700"
            role="alert"
        >
            <strong class="font-bold">Error!</strong>
            <span class="block sm:inline">{error}</span>
        </div>
    {:else if roles.data?.length === 0}
        <EmptyCard gotoFunction={create} />
    {:else}
        <div class=" rounded-lg bg-white shadow-lg"> <!-- Tambahkan overflow-x-auto untuk responsivitas horizontal -->
            <Table>
                <thead class="bg-gray-50">
                    <tr>
                        <th
                            scope="col"
                            class="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                            >#</th
                        >
                        <th
                            scope="col"
                            class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                            >Nama</th
                        >
                        <th
                            scope="col"
                            class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                            >Izin</th
                        > <!-- Kolom Izin Baru -->
                        <!-- <th
                            scope="col"
                            class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                            >Dibuat Pada</th
                        > -->
                        <th
                            scope="col"
                            class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                            >Diperbarui Pada</th
                        >
                        <th
                            scope="col"
                            class="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"
                            >Aksi</th
                        >
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 bg-white">
                    {#each roles?.data as role, i (role.id)}
                        <tr>
                            <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-900"
                                >{(roles?.current_page - 1) * roles?.per_page + i + 1}.
                            </td>
                            <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{role.Name || '-'}</td>
                            <td class="px-6 py-4 text-sm text-gray-700"> <!-- Kolom Izin -->
                                {#if role.Permissions && role.Permissions.length > 0}
                                    <div class="flex flex-wrap gap-1">
                                        {#each role.Permissions as permission (permission.id)}
                                            <span class="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                                                {permission.name}
                                            </span>
                                        {/each}
                                    </div>
                                {:else}
                                    <span class="text-gray-500">-</span>
                                {/if}
                            </td>
                            <!-- <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                {new Date(role.CreatedAt).toLocaleDateString('id-ID', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </td> -->
                            <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                {new Date(role.UpdatedAt).toLocaleDateString('id-ID', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </td>
                            <td class="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                <EditButton onclick={() => edit(role.id)} tooltip="Edit" />
                                <DeleteButton tooltip="Delete" onclick={() => openDeleteModal(role)}></DeleteButton>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </Table>
            <Pagination {pagination} {nextPage} {prevPage} />
        </div>
    {/if}
</div>
<DeleteConfirmationModal
    isOpen={isDeleteModalOpen}
    onClose={closeDeleteModal}
    onConfirm={handleConfirmDelete}
    itemName={selected?.Name}
/>
