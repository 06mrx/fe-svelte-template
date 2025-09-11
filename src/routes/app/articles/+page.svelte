<script>
    import { storageService } from '$lib/services/storageService';
    import { onMount } from 'svelte';
    import { goto, afterNavigate, beforeNavigate } from '$app/navigation';
    import { quintOut } from 'svelte/easing';
    import { tweened } from 'svelte/motion';
    import { page } from '$app/stores';
    import toast, { Toaster } from 'svelte-french-toast';
    // Import fungsi fetchWithProgress dan progressStore
    import { fetchWithProgress } from '$lib/services/fetchWithTokenRefresh';
    // import { fetchWithProgress, progressStore } from '$lib/services/fetchWithTokenRefresh';

    import { PUBLIC_API_URL } from '$env/static/public';
    import EditButton from '$lib/components/button/EditButton.svelte';
    import DeleteButton from '$lib/components/button/DeleteButton.svelte';
    import { debounce, setPaginationData, updateUrlParams } from '$lib/services/functionService';
    import Pagination from '$lib/components/Pagination.svelte';
    import Table from '$lib/components/Table.svelte';
    import ShowButton from '$lib/components/button/ShowButton.svelte';
    import EmptyCard from '$lib/components/EmptyCard.svelte';
	import ProgressBar from '$lib/components/ProgressBar.svelte';
    

    /** @type {import('./$types').PageData} */
    let { data } = $props();

    let datas = $state([]);
    let loading = $state(true);
    let error = $state('');

    // Menggunakan $state untuk menampung status dari store
    // let progressState = $state({ isLoading: false, progress: '0%' });

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
    const progress = tweened(0, { duration: 400, easing: quintOut });

    // State untuk mengontrol visibilitas bilah progres
    let isVisible = $state(false);

    // Aktifkan bilah progres saat navigasi dimulai
    beforeNavigate(() => {
        // Tampilkan bilah progres
        isVisible = true;

        // Progres berjalan cepat dari 0 ke 80%
        progress.set(0);
        progress.set(0.97, {
            duration: 500, // Cepat di awal
            easing: quintOut
        });
    });

    // Sembunyikan bilah progres setelah navigasi selesai
    // afterNavigate(() => {
    //     // Lambat dari 80% ke 100%
    //     progress.set(1, {
    //         duration: 500, // Lebih lambat di akhir
    //         easing: quintOut
    //     }).then(() => {
    //         // Sembunyikan bilah setelah selesai
    //         isVisible = false;
    //     });
    // });

    function handle_search() {
        updateUrlParams(searchTerm, itemsPerPage, 1, true);
        fetchDataFromUrlParams();
    }

    async function fetchDataFromUrlParams() {
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

            // Menggunakan fetchWithProgress untuk menampilkan bilah progres
            const response = await fetchWithProgress(apiUrl, {
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
            // Menggunakan fetchWithProgress untuk menampilkan bilah progres
            const response = await fetchWithProgress(deleteUrl, {
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
        } finally {
            loading = false;
        }
    }

    onMount(() => {
        // Berlangganan ke progressStore dan memperbarui state lokal
        // const unsubscribe = progressStore.subscribe(value => {
        //     progressState = value;
        // });

        const urlParams = $page.url.searchParams;
        searchTerm = urlParams.get('search') || '';
        itemsPerPage = parseInt(urlParams.get('per_page') || '10');
        pagination.current_page = parseInt(urlParams.get('page') || '1');
        pagination.per_page = itemsPerPage;

        fetchDataFromUrlParams();

        // Pastikan untuk berhenti berlangganan saat komponen dihancurkan
        // return unsubscribe;
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

    function show(id) {
        goto(`/app/articles/${id}`);
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    function getExcerpt(content, maxLength = 120) {
        if (!content) return '-';
        const textContent = content.replace(/<[^>]*>/g, '');
        return textContent.length > maxLength
            ? textContent.substring(0, maxLength) + '...'
            : textContent;
    }

    function getRandomAvatar(name) {
        const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-yellow-500'];
        const colorIndex = name ? name.length % colors.length : 0;
        return colors[colorIndex];
    }

    function getInitials(name) {
        if (!name) return 'A';
        return name.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase();
    }
</script>

<Toaster />

<!-- Bilah progres global -->
<!-- {#if progressState.isLoading}
    <div class="fixed top-0 left-0 w-full h-1 bg-blue-500 z-50 transition-all duration-300" style="width: {progressState.progress}"></div>
{/if} -->
{#if isVisible}
    <div class="fixed top-0 left-0 w-full h-0.5 bg-pink-500 z-100 shadow-md" style="width: {$progress * 100}%"></div>
{/if}
<div class="min-h-screen bg-white">
    <div class="mx-auto max-w-4xl px-4 py-8">
        <!-- Medium-style Header -->
        <div class="border-b border-gray-200 pb-8 mb-8">
            <div class="flex items-center justify-between mb-6">
                <div class="flex items-center space-x-4">
                    <h1 class="text-2xl font-bold text-gray-900">For you</h1>
                    <h2 class="text-2xl text-gray-400">Featured</h2>
                </div>
            </div>
            
            <!-- Search Bar - Medium Style -->
            <div class="relative">
                <div class="absolute inset-y-0 left-0 ml-3 flex items-center pointer-events-none">
                    <svg class="h-5 w-5 text-gray-400 " fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                    </svg>
                </div>
                <input
                    type="text"
                    placeholder="Search"
                    bind:value={searchTerm}
                    oninput={() => debounce(handle_search, 500)}
                    class="w-full pl-10 pr-4 py-3 bg-gray-50 mb-2 mt-1  border-0 rounded-full text-gray-900 placeholder-gray-500 focus:bg-white focus:ring-1 focus:ring-gray-300 focus:outline-none transition-colors"
                />
            </div>
        </div>

        <!-- Content Section -->
        <main>
            {#if loading}
                <!-- Medium-style Loading State -->
                <div class="space-y-8">
                    {#each Array(5) as _, i}
                        <div class="animate-pulse">
                            <div class="flex items-start space-x-4 mb-4">
                                <div class="w-8 h-8 bg-gray-200 rounded-full"></div>
                                <div class="flex-1">
                                    <div class="h-4 w-32 bg-gray-200 rounded mb-1"></div>
                                    <div class="h-3 w-20 bg-gray-200 rounded"></div>
                                </div>
                            </div>
                            <div class="flex">
                                <div class="flex-1 pr-6">
                                    <div class="h-6 w-4/5 bg-gray-200 rounded mb-2"></div>
                                    <div class="space-y-2 mb-4">
                                        <div class="h-4 w-full bg-gray-200 rounded"></div>
                                        <div class="h-4 w-3/4 bg-gray-200 rounded"></div>
                                    </div>
                                    <div class="h-3 w-24 bg-gray-200 rounded"></div>
                                </div>
                                <div class="w-28 h-20 bg-gray-200 rounded"></div>
                            </div>
                        </div>
                    {/each}
                </div>
            {:else if error}
                <!-- Error State -->
                <div class="text-center py-12">
                    <div class="text-red-500 mb-2">
                        <svg class="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                    </div>
                    <h3 class="text-lg font-medium text-gray-900 mb-1">Terjadi Kesalahan</h3>
                    <p class="text-gray-500">{error}</p>
                </div>
            {:else if datas.data?.length === 0}
                <!-- Empty State -->
                <EmptyCard gotoFunction={()=>{}} />
            {:else}
                <!-- Medium-style Article List -->
                <div class="space-y-8">
                    {#each datas?.data as article, i (article.id)}
                        <article class="group cursor-pointer" onclick={() => show(article.id)}>
                            <!-- Author Info -->
                            <div class="flex items-center space-x-3 mb-3">
                                <div class="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium {getRandomAvatar(article.user?.Name || 'Admin')}">
                                    {getInitials(article.user?.Name || 'Admin')}
                                </div>
                                <div class="flex items-center space-x-2 text-sm text-gray-600">
                                    <span class="font-medium">{article.user?.Name || 'Admin2'}</span>
                                    <span>·</span>
                                    <time datetime={article.created_at}>{formatDate(article.created_at)}</time>
                                </div>
                            </div>

                            <!-- Article Content -->
                            <div class="flex">
                                <div class="flex-1 pr-6">
                                    <h2 class="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-gray-700 transition-colors">
                                        {article.title || 'Tanpa Judul'}
                                    </h2>
                                    
                                    {#if article.content}
                                        <p class="text-gray-600 text-base leading-relaxed mb-4 line-clamp-3">
                                            {getExcerpt(article.content, 140)}
                                        </p>
                                    {/if}

                                    <!-- Article Meta -->
                                    <div class="flex items-center justify-between">
                                        <div class="flex items-center space-x-4">
                                            <!-- Status Badge -->
                                            <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                                                    class:bg-green-100={article.status !== 'draft'}
                                                    class:text-green-700={article.status !== 'draft'}
                                                    class:bg-yellow-100={article.status === 'draft'}
                                                    class:text-yellow-700={article.status === 'draft'}>
                                                {article.status === 'draft' ? 'Draft' : 'Published'}
                                            </span>

                                            <!-- Reading time estimate -->
                                            <span class="text-sm text-gray-500">
                                                {Math.ceil((article.content?.length || 0) / 1000)} min read
                                            </span>
                                        </div>

                                        <!-- Action buttons -->
                                        <div class="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button class="p-2 text-gray-400 hover:text-gray-600 transition-colors" onclick={() => {}}>
                                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
                                                </svg>
                                            </button>
                                            <button class="p-2 text-gray-400 hover:text-gray-600 transition-colors" onclick={() => {}}>
                                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/>
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <!-- Article Thumbnail -->
                                {#if article.image_url}
                                    <div class="w-28 h-20 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                                        <img src={PUBLIC_API_URL + '/public/' + article.image_url} alt={article.title} class="w-full h-full object-cover">
                                    </div>
                                {:else}
                                    <div class="w-28 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded flex-shrink-0 flex items-center justify-center">
                                        <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/>
                                        </svg>
                                    </div>
                                {/if}
                            </div>
                        </article>

                        {#if i < datas?.data.length - 1}
                            <hr class="border-gray-200">
                        {/if}
                    {/each}
                </div>

                <!-- Pagination -->
                <div class="mt-16 flex justify-center">
                    <Pagination {pagination} {nextPage} {prevPage} />
                </div>
            {/if}
        </main>
    </div>
</div>

<style>
    .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }
    
    .line-clamp-3 {
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }
    /* Menggunakan Tailwind CSS classes yang diperlukan */
    /* .fixed { position: fixed; }
    .top-0 { top: 0; }
    .left-0 { left: 0; }
    .w-full { width: 100%; }
    .h-1 { height: 0.25rem; }
    .bg-green-500 { background-color: #22c55e; }
    .z-50 { z-index: 50; }
    .shadow-md { box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1); } */
</style>
