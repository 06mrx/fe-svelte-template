<script lang="ts">
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { PUBLIC_API_URL } from '$env/static/public';
    import toast, { Toaster } from 'svelte-french-toast';

    // Mengimpor komponen input kustom yang Anda sebutkan
    import Text from '$lib/components/input/Text.svelte';

    // Mengimpor fungsi fetch kustom
    import { fetchWithTokenRefresh } from '$lib/services/fetchWithTokenRefresh';

    // State untuk menyimpan data formulir dan status
    let title: string = $state('');
    let imageFile: File | null = $state(null);
    let imagePreviewUrl: string | null = $state(null);
    let content: string = $state('');
    let isDraft: boolean = $state(true);
    let successMessage: string = $state('');
    let errorMessage: string = $state('');
    let validationErrors: any = $state({});
    let loading: boolean = $state(false);
    let initialImageUrl: string | null = $state(null); // URL gambar awal dari server
    let showUrlModal: boolean = $state(false);
	let imageUrlToInsert: string = $state('');
	let quillSelection: { index: number; length: number } | null = null;

    // constants
    const objectName = 'Artikel';
    const endpoint = '/api/articles';
    const backUrl = '/app/admin/articles';

    let quillEditor: any;
    let editorContainer: HTMLDivElement;

    onMount(async () => {
        // Ambil ID artikel langsung dari parameter URL
        const articleId = $page.params.id;

        if (!articleId) {
            toast.error('ID artikel tidak ditemukan di URL.');
            return;
        }

        // Impor Quill.js secara dinamis di dalam onMount()
        const { default: Quill } = await import('quill');
        import('quill/dist/quill.snow.css');

        const toolbarOptions = [
            ['bold', 'italic', 'underline', 'strike'],
            ['blockquote', 'code-block'],
            [{ header: 1 }, { header: 2 }],
            [{ list: 'ordered' }, { list: 'bullet' }],
            [{ script: 'sub' }, { script: 'super' }],
            [{ indent: '-1' }, { indent: '+1' }],
            [{ direction: 'rtl' }],
            [{ size: ['small', false, 'large', 'huge'] }],
            [{ header: [1, 2, 3, 4, 5, 6, false] }],
            [{ color: [] }, { background: [] }],
            [{ font: [] }],
            [{ align: [] }],
            ['link', 'image', 'video'],
            ['clean']
        ];

        // Custom handler untuk tombol gambar
        const customImageHandler = () => {
            quillSelection = quillEditor.getSelection();
            imageUrlToInsert = '';
            showUrlModal = true;
        };

        quillEditor = new Quill(editorContainer, {
            modules: {
                toolbar: {
                    container: toolbarOptions,
                    handlers: {
                        image: customImageHandler
                    }
                }
            },
            theme: 'snow'
        });

        // Memastikan konten editor diperbarui saat ada perubahan
        quillEditor.on('text-change', () => {
            content = quillEditor.root.innerHTML;
        });

        try {
            // Mengambil data artikel yang ada dari API
            const response = await fetchWithTokenRefresh(`${PUBLIC_API_URL + endpoint}/${articleId}`);
            const articleData = await response.json();

            if (response.ok) {
                // Mengisi formulir dengan data yang ada
                title = articleData.data.title || '';
                content = articleData.data.content || '';
                isDraft = articleData.data.status === 'draft';
                initialImageUrl = articleData.data.imageUrl || null;
                imagePreviewUrl = initialImageUrl;

                // Memastikan Quill sudah diinisialisasi sebelum mengatur konten
                quillEditor.clipboard.dangerouslyPasteHTML(content);
            } else {
                errorMessage = articleData.data.message || 'Gagal mengambil data artikel.';
                toast.error(errorMessage);
            }
        } catch (error) {
            console.error('Error fetching article:', error);
            errorMessage = 'Terjadi kesalahan jaringan saat mengambil data artikel.';
            toast.error(errorMessage);
        }
    });

    // Fungsi untuk menyisipkan gambar dari URL
    function insertImageFromUrl() {
        if (imageUrlToInsert.trim() && quillSelection) {
            quillEditor.insertEmbed(quillSelection.index, 'image', imageUrlToInsert.trim(), 'user');
            quillEditor.setSelection(quillSelection.index + 1);
            showUrlModal = false;
            imageUrlToInsert = '';
        } else {
            toast.error('URL gambar tidak valid.');
        }
    }

    // Fungsi untuk menangani unggah file dan menampilkan pratinjau
    function handleImageUpload(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            const file = input.files[0];
            const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

            if (!allowedTypes.includes(file.type)) {
                toast.error('Tipe berkas tidak valid. Harap unggah .jpg, .png, atau .webp.');
                input.value = ''; // Mengatur ulang input file
                imageFile = null;
                imagePreviewUrl = initialImageUrl; // Kembalikan ke gambar awal
                return;
            }

            imageFile = file;
            imagePreviewUrl = URL.createObjectURL(file);
        } else {
            imageFile = null;
            imagePreviewUrl = initialImageUrl;
        }
    }

    // Fungsi untuk menangani pengiriman formulir
    async function handleSumit(event: Event) {
        event.preventDefault();
        errorMessage = '';
        successMessage = '';
        validationErrors = {};
        loading = true;

        const articleId = $page.params.id;
        if (!articleId) {
            toast.error('ID artikel tidak ditemukan.');
            loading = false;
            return;
        }

        // Validasi sederhana
        if (!title.trim()) {
            validationErrors.title = 'Judul artikel wajib diisi.';
            loading = false;
            toast.error('Terdapat kesalahan dalam formulir. Silakan periksa kembali.');
            return;
        }

        if (!content.trim()) {
            validationErrors.content = 'Konten artikel wajib diisi.';
            loading = false;
            toast.error('Terdapat kesalahan dalam formulir. Silakan periksa kembali.');
            return;
        }

        const formData = new FormData();
        formData.append('title', title);
        formData.append('content', content);
        formData.append('status', isDraft ? 'draft' : 'publish');
        
        // Hanya tambahkan file gambar jika ada yang baru diunggah
        if (imageFile) {
            formData.append('image', imageFile);
        }

        // Menggunakan fetchWithRefreshToken untuk panggilan API
        try {
            const response = await fetchWithTokenRefresh(`${PUBLIC_API_URL + endpoint}/${articleId}`, {
                method: 'PUT',
                body: formData
            });

            const result = await response.json();
            if (response.ok) {
                successMessage = result.message || `${objectName} berhasil diperbarui!`;
                loading = false;
                toast.success(successMessage);
                goto(backUrl);
            } else if (response.status === 400) {
                validationErrors = result.message;
                loading = false;
                toast.error('Terdapat kesalahan dalam formulir. Silakan periksa kembali.');
                // console.log(validationErrors.image.error)
            } else {
                errorMessage = result.message || 'Gagal memperbarui artikel.';
                loading = false;
                validationErrors = result.message;
                
                toast.error("Gagal memperbarui artikel");
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            errorMessage = 'Terjadi kesalahan jaringan atau server.';
            loading = false;
            toast.error("Terjadi kesalahan jaringan atau server");
        }
    }
</script>

<Toaster />
<div class="flex items-center justify-center py-6">
    <div class="w-full max-w-2xl space-y-6">
        <!-- Tombol kembali -->
        <div class="flex items-center">
            <button
                type="button"
                onclick={() => goto(backUrl)}
                class="group mb-6 inline-flex items-center gap-3 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition-all duration-200 hover:bg-slate-50 hover:text-slate-900 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
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
        <!-- Kartu Header -->
        <div class="text-center">
            <h2 class="text-2xl font-bold text-gray-900">Edit {objectName}</h2>
        </div>

        <!-- Kartu Formulir -->
        <div class="-mt-3 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <!-- Pesan Sukses -->
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

            <!-- Pesan Error -->
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
                <!-- Input Judul -->
                <Text
                    label="Judul Artikel"
                    placeholder="Tulis judul artikel Anda di sini..."
                    isRequired={true}
                    error={validationErrors?.title}
                    name="title"
                    bind:value={title}
                />

                <!-- Input Gambar Unggulan -->
                <div>
                    <label for="image" class="block text-sm font-medium text-gray-700">
                        Gambar Unggulan
                    </label>
                    <input
                        type="file"
                        id="image"
                        accept=".jpg,.png,.webp"
                        class="block w-full rounded-lg px-3 py-2.5 text-sm placeholder-gray-400 shadow-lg transition-colors focus:bg-indigo-500/10"
                        onchange={handleImageUpload}
                    />
                    {#if validationErrors?.image}
                        <p class="mt-1 text-sm text-red-600">{validationErrors.image.error}</p>
                    {/if}
                    {#if imagePreviewUrl}
                        <div class="mt-4">
                            <p class="text-sm font-medium text-gray-700">Pratinjau Gambar:</p>
                            <img src={imagePreviewUrl} alt="Pratinjau Gambar" class="mt-2 max-h-64 rounded-md object-cover" />
                        </div>
                    {/if}
                </div>

                <!-- Editor Konten -->
                <div>
                    <label class="block text-sm font-medium text-gray-700">
                        Konten Artikel <span class="text-red-500">*</span>
                    </label>
                    <div bind:this={editorContainer} id="editor" class="mt-1 min-h-64 rounded-md border border-gray-300"></div>
                    {#if validationErrors?.content}
                        <p class="mt-1 text-sm text-red-600">{validationErrors.content}</p>
                    {/if}
                </div>

                <!-- Input Draf -->
                <div class="relative flex items-start">
                    <div class="flex h-5 items-center">
                        <input
                            id="isDraft"
                            name="isDraft"
                            type="checkbox"
                            bind:checked={isDraft}
                            class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                    </div>
                    <div class="ml-3 text-sm">
                        <label for="isDraft" class="font-medium text-gray-700">Simpan sebagai draf</label>
                        <p class="text-gray-500">Centang jika artikel ini belum siap untuk dipublikasikan.</p>
                    </div>
                </div>

                <!-- Tombol Simpan -->
                <div class="flex items-center justify-between gap-4">
                    <button
                        type="submit"
                        class="inline-flex w-full justify-center rounded-lg bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-lg transition-colors duration-200 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-300 disabled:cursor-not-allowed"
                        disabled={loading}
                    >
                        {#if loading}
                            <svg class="h-5 w-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path
                                    class="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                            </svg>
                            <span class="ml-2">Menyimpan...</span>
                        {:else}
                            Simpan Perubahan
                        {/if}
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>
