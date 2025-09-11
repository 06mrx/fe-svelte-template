<script>
    import { storageService } from '$lib/services/storageService';
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import toast, { Toaster } from 'svelte-french-toast';
    // Mengimpor store dan fungsi fetch
    import { fetchWithTokenRefresh, progressStore } from '$lib/services/fetchWithTokenRefresh';

    import DeleteConfirmationModal from '$lib/components/modal/DeleteConfirmationModal.svelte';
    import { PUBLIC_API_URL } from '$env/static/public';
    import EditButton from '$lib/components/button/EditButton.svelte';
    import DeleteButton from '$lib/components/button/DeleteButton.svelte';
    import { setPaginationData, updateUrlParams } from '$lib/services/functionService';
    import EmptyCard from '$lib/components/EmptyCard.svelte';
	import ProgressBar from '$lib/components/ProgressBar.svelte';
    /** @type {import('./$types').PageData} */
    let { data } = $props();

    let users = $state([]);
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
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => {
            updateUrlParams(searchTerm, itemsPerPage, 1, true);
            fetchUsersFromUrlParams();
        }, 500);
    }

    async function fetchUsersFromUrlParams() {
        error = '';

        const urlParams = $page.url.searchParams;
        const currentPage = parseInt(urlParams.get('page') || '1');
        const currentSearchTerm = urlParams.get('search') || '';
        const currentItemsPerPage = parseInt(urlParams.get('per_page') || '10');

        try {
            let apiUrl = `${PUBLIC_API_URL}/api/users?page=${currentPage}&per_page=${currentItemsPerPage}`;
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
                users = result.data;
                pagination = setPaginationData(pagination, result);
                toast.success(result.message);
            } else {
                error = result.message || 'Gagal mengambil data pengguna.';
                toast.error(result.message);
            }
        } catch (err) {
            console.error('Fetch users error:', err);
            error = 'Terjadi kesalahan jaringan atau server saat memuat data.';
            toast.error('Terjadi kesalahan jaringan atau server saat memuat data');
        }
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
    }

    // Logika untuk Modal
    const openDeleteModal = (selectedItem) => {
        selected = selectedItem;
        isDeleteModalOpen = true;
    };

    const closeDeleteModal = () => {
        isDeleteModalOpen = false;
        selected = null;
    };

    async function handleConfirmDelete() {
        error = '';

        try {
            const deleteUrl = `${PUBLIC_API_URL}/api/users/${selected?.id}`;
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

            toast.success('Pengguna berhasil dihapus!');
            fetchUsersFromUrlParams();
        } catch (err) {
            console.error('Error saat menghapus:', err);
            toast.error(err.message || 'Terjadi kesalahan saat menghapus pengguna.');
        } finally {
            closeDeleteModal();
        }
    }

    onMount(() => {
        const token = storageService.getToken();
        if (!token) {
            const currentUrl = encodeURIComponent($page.url.pathname + $page.url.search);
            goto(`/auth/login?returnUrl=${currentUrl}`);
            return;
        }

        const urlParams = $page.url.searchParams;
        searchTerm = urlParams.get('search') || '';
        itemsPerPage = parseInt(urlParams.get('per_page') || '10');
        pagination.current_page = parseInt(urlParams.get('page') || '1');
        pagination.per_page = itemsPerPage;

        fetchUsersFromUrlParams();
    });

    $effect(() => {
        const urlParams = $page.url.searchParams;
        const urlPerPage = parseInt(urlParams.get('per_page') || '10');
        const urlPage = parseInt(urlParams.get('page') || '1');

        if (itemsPerPage !== urlPerPage || pagination.current_page !== urlPage) {
            itemsPerPage = urlPerPage;
            pagination.current_page = urlPage;
            pagination.per_page = urlPerPage;
            fetchUsersFromUrlParams();
        }
    });

    function createUser() {
        goto('/app/admin/users/create');
    }

    function editUser(userId) {
        goto(`/app/admin/users/${userId}/edit`);
    }
</script>

<Toaster />



<div class="mx-auto w-full p-3 md:p-5">
    <div
        class="mb-6 flex flex-col justify-between space-y-4 sm:flex-row sm:items-center sm:space-y-0"
    >
        <h2 class="text-3xl font-bold text-gray-800">Daftar Pengguna</h2>
        <div
            class="flex w-full flex-row flex-wrap items-center space-x-2 space-y-0 sm:w-auto md:flex-nowrap md:space-x-4"
        >
            <input
                type="text"
                placeholder="Cari pengguna..."
                bind:value={searchTerm}
                oninput={handle_search}
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
                disabled={$progressStore.isLoading}
            >
                Reset Filter
            </button>
            <button
                onclick={createUser}
                aria-label="add-button"
                class="rounded-lg border border-emerald-600 p-2 text-emerald-500 shadow-md transition-colors duration-200 hover:cursor-pointer hover:bg-emerald-700 hover:text-white"
                disabled={$progressStore.isLoading}
            >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24"
                    ><path fill="currentColor" d="M11 13H5v-2h6V5h2v6h6v2h-6v6h-2z" /></svg
                >
            </button>
        </div>
    </div>

    {#if $progressStore.isLoading}
        <div class="flex h-48 items-center justify-center">
            <div
                class="h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"
            ></div>
            <p class="ml-4 text-gray-700">Memuat pengguna...</p>
        </div>
    {:else if error}
        <div
            class="relative rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700"
            role="alert"
        >
            <strong class="font-bold">Error!</strong>
            <span class="block sm:inline">{error}</span>
        </div>
    {:else if users.data?.length === 0}
        <EmptyCard gotoFunction={() => createUser()} />
    {:else}
        <div class="overflow-hidden rounded-lg bg-white shadow-lg">
            <div class="min-w-20 overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
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
                                >Email</th
                            >
                            <th
                                scope="col"
                                class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                                >Dibuat Pada</th
                            >
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
                        {#each users?.data as user, i (user.id)}
                            <tr>
                                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-900"
                                    >{(users?.current_page - 1) * users?.per_page + i + 1}.
                                </td>
                                <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{user.Name || '-'}</td
                                >
                                <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900"
                                    >{user.Email || '-'}</td
                                >
                                <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                    {new Date(user.CreatedAt).toLocaleDateString('id-ID', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </td>
                                <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                    {new Date(user.UpdatedAt).toLocaleDateString('id-ID', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </td>
                                <td class="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                    <EditButton onclick={() => editUser(user.id)} tooltip="Edit" />
                                    <DeleteButton
                                        tooltip="Delete"
                                        onclick={() => openDeleteModal(user)}
                                    ></DeleteButton>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>

            <!-- Pagination Controls -->
            <nav
                class="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6"
                aria-label="Pagination"
            >
                <div class="hidden sm:block">
                    <p class="text-sm text-gray-700">
                        Menampilkan
                        <span class="font-medium"
                            >{(pagination.current_page - 1) * pagination.per_page + 1}</span
                        >
                        sampai
                        <span class="font-medium"
                            >{Math.min(pagination.current_page * pagination.per_page, pagination.total)}</span
                        >
                        dari
                        <span class="font-medium">{pagination.total}</span>
                        hasil
                    </p>
                </div>
                <div class="flex flex-1 justify-between sm:justify-end">
                    <button
                        onclick={prevPage}
                        disabled={pagination.current_page === 1 || $progressStore.isLoading}
                        class="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:cursor-pointer hover:bg-gray-50 {pagination.current_page ===
                        1 || $progressStore.isLoading
                            ? 'cursor-not-allowed opacity-50'
                            : ''}"
                    >
                        Sebelumnya
                    </button>
                    <button
                        onclick={nextPage}
                        disabled={pagination.current_page === pagination.last_page || $progressStore.isLoading}
                        class="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:cursor-pointer hover:bg-gray-50 {pagination.current_page ===
                        pagination.last_page || $progressStore.isLoading
                            ? 'cursor-not-allowed opacity-50'
                            : ''}"
                    >
                        Berikutnya
                    </button>
                </div>
            </nav>
        </div>
    {/if}
</div>
<DeleteConfirmationModal
    isOpen={isDeleteModalOpen}
    onClose={closeDeleteModal}
    onConfirm={handleConfirmDelete}
    itemName={selected?.Name}
/>
