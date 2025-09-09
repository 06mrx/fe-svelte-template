<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
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

	// State untuk modal URL gambar
	let showUrlModal: boolean = $state(false);
	let imageUrlToInsert: string = $state('');
	let quillSelection: { index: number; length: number } | null = null;

	//constants
	const objectName = 'Artikel';
	const endpoint = '/api/articles';
	const backUrl = '/app/admin/articles';

	let quillEditor: any;
	let editorContainer: HTMLDivElement;

	// Menginisialisasi editor Quill setelah komponen dimuat
	onMount(async () => {
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
			['link', 'image', 'video'], // Tambahkan 'image'
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
				imagePreviewUrl = null;
				return;
			}

			imageFile = file;
			imagePreviewUrl = URL.createObjectURL(file);
		} else {
			imageFile = null;
			imagePreviewUrl = null;
		}
	}

	// Fungsi untuk menangani pengiriman formulir
	async function handleSumit(event: Event) {
		event.preventDefault();
		errorMessage = '';
		successMessage = '';
		validationErrors = {};
		loading = true;

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
		formData.append('status', isDraft ? 'publish' : 'draft');
		if (imageFile) {
			formData.append('image', imageFile);
		}

		// Menggunakan fetchWithRefreshToken untuk panggilan API
		try {
			const response = await fetchWithTokenRefresh(`${PUBLIC_API_URL + endpoint}`, {
				method: 'POST',
				body: formData
			});

			const result = await response.json();
			if (response.ok) {
				successMessage = result.message || `${objectName} berhasil ditambahkan!`;
				loading = false;
				goto(backUrl);
			} else if (response.status === 400) {
				validationErrors = result.message;
				loading = false;
				toast.error('Terdapat kesalahan dalam formulir. Silakan periksa kembali.');
			} else {
				errorMessage = result.message || 'Gagal membuat artikel.';
				loading = false;
                validationErrors = result.message;
				toast.error("Gagal membuat artikel");
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
			<h2 class="text-2xl font-bold text-gray-900">Tambah {objectName} Baru</h2>
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
						class="block w-full rounded-lg  px-3 py-2.5 text-sm placeholder-gray-400 shadow-lg transition-colors focus:bg-indigo-500/10"
						onchange={handleImageUpload}
					/>
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

				<!-- Checkbox Draft -->
				<div class="relative flex items-start">
					<div class="flex h-5 items-center">
						<input
							id="draft"
							name="draft"
							type="checkbox"
							class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
							bind:checked={isDraft}
						/>
					</div>
					<div class="ml-3 text-sm">
						<label for="draft" class="font-medium text-gray-700">Simpan sebagai Draf</label>
						<p class="text-gray-500">Centang jika artikel ini belum siap dipublikasikan.</p>
					</div>
				</div>

				<!-- Tombol Submit -->
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
							Buat {objectName}
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
</div>

<!-- Modal untuk memasukkan URL gambar -->
{#if showUrlModal}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50"
		aria-labelledby="modal-title"
		role="dialog"
		aria-modal="true"
	>
		<div class="w-full max-w-sm transform rounded-lg bg-white p-6 shadow-xl transition-all">
			<div class="text-center">
				<h3 class="text-xl font-bold leading-6 text-gray-900" id="modal-title">Sisipkan Gambar dari URL</h3>
				<div class="mt-4">
					<p class="text-sm text-gray-500">
						Tempelkan URL gambar yang ingin Anda sisipkan ke dalam konten artikel.
					</p>
					<div class="mt-4">
						<Text
							label="URL Gambar"
							placeholder="https://contoh.com/gambar.jpg"
							name="imageUrl"
							bind:value={imageUrlToInsert}
							isRequired={true}
						/>
					</div>
				</div>
			</div>
			<div class="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse sm:gap-3">
				<button
					type="button"
					class="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
					onclick={insertImageFromUrl}
				>
					Sisipkan
				</button>
				<button
					type="button"
					class="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
					onclick={() => (showUrlModal = false)}
				>
					Batal
				</button>
			</div>
		</div>
	</div>
{/if}
