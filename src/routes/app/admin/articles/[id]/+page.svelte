<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { PUBLIC_API_URL, PUBLIC_APP_NAME } from '$env/static/public';
	import { fetchWithTokenRefresh } from '$lib/services/fetchWithTokenRefresh';

	// State untuk menyimpan data artikel dan status
	let article: any = $state(null);
	let loading: boolean = $state(true);
	let errorMessage: string = $state('');

	// constants
	const objectName = 'Artikel';
	const endpoint = '/api/articles';
	const backUrl = '/app/admin/articles';

	// Mengambil ID artikel dari URL
	const articleId = $page.params.id;

	// Fungsi untuk memuat data artikel
	onMount(async () => {
		try {
			const response = await fetchWithTokenRefresh(`${PUBLIC_API_URL + endpoint}/${articleId}`, {
				method: 'GET'
			});

			if (response.ok) {
				const result = await response.json();
				article = result.data;
			} else {
				const result = await response.json();
				errorMessage = result.message || 'Gagal memuat artikel.';
			}
		} catch (error) {
			console.error('Error fetching article:', error);
			errorMessage = 'Terjadi kesalahan jaringan atau server.';
		} finally {
			loading = false;
		}
	});

	// Fungsi untuk memformat tanggal yang lebih elegant
	function formatDate(dateString: string) {
		const date = new Date(dateString);
		return date.toLocaleDateString('id-ID', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	// Fungsi untuk estimasi waktu baca
	function getReadingTime(content: string) {
		const wordsPerMinute = 200;
		const textContent = content.replace(/<[^>]*>/g, '');
		const wordCount = textContent.split(/\s+/).length;
		const readingTime = Math.ceil(wordCount / wordsPerMinute);
		return readingTime;
	}
</script>

<style>
	/*
		Tambahkan aturan CSS kustom ini untuk menimpa gaya bawaan dari
		Tailwind's `prose` dan memastikan gambar berada di tengah.
		Ini akan menargetkan semua gambar di dalam blok `prose`.
	*/
	:global(.prose img) {
		display: block;
		margin-left: auto;
		margin-right: auto;
	}
</style>
<svelte:head>
  <!-- Basic SEO -->
  <title>{PUBLIC_APP_NAME + ' - ' + article.title}</title>
  <meta name="description" content={article.content?.slice(0,50)}/>
  <meta name="robots" content={'index, follow'} />

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website" />
  <meta property="og:title" content={PUBLIC_APP_NAME + ' - ' + article.title} />
  <meta property="og:description" content={article.content?.slice(0,50)} />
  <meta property="og:url" content={'http://go-sveltex.cloudlabx.online'} />
  <meta property="og:image" content='/logo.png' />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={PUBLIC_APP_NAME} />
  <meta name="twitter:description" content={article.content?.slice(0,50)} />
  <meta name="twitter:image" content={'/logo.png'} />
</svelte:head>

<div class="min-h-[50dvh] bg-gradient-to-br from-slate-50 via-white to-slate-100">
	<div class="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
		<!-- Header dengan tombol kembali -->
		<header class="mb-8">
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
		</header>

		<!-- Content Area -->
		<main>
			{#if loading}
				<!-- Loading State dengan skeleton yang lebih menarik -->
				<div class="space-y-6">
					<div class="animate-pulse">
						<!-- Header skeleton -->
						<div class="mb-6 h-8 w-3/4 rounded-lg bg-slate-200"></div>
						<div class="mb-4 h-4 w-1/2 rounded bg-slate-200"></div>
						
						<!-- Image skeleton -->
						<div class="mb-6 h-96 w-full rounded-2xl bg-slate-200"></div>
						
						<!-- Content skeleton -->
						<div class="space-y-3">
							<div class="h-4 w-full rounded bg-slate-200"></div>
							<div class="h-4 w-5/6 rounded bg-slate-200"></div>
							<div class="h-4 w-4/5 rounded bg-slate-200"></div>
							<div class="h-4 w-full rounded bg-slate-200"></div>
							<div class="h-4 w-3/4 rounded bg-slate-200"></div>
						</div>
					</div>
				</div>
			{:else if errorMessage}
				<!-- Error State dengan design yang lebih baik -->
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
							<p class="mt-1 text-red-700">{errorMessage}</p>
						</div>
					</div>
				</div>
			{:else if article}
				<!-- Article Content dengan design yang enhanced -->
				<article class="overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-slate-200">
					<!-- Hero Image Section -->
					{#if article.image_url}
						<div class="relative overflow-hidden">
							<img
								src={PUBLIC_API_URL + '/public/' + article.image_url}
								alt={article.title}
                                loading="lazy" 
								class="h-96 w-full object-cover transition-transform duration-500 hover:scale-105"
							/>
							<div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
						</div>
					{/if}

					<!-- Article Header -->
					<header class="px-8 py-8 sm:px-12">
						<div class="flex flex-wrap items-center gap-4 text-sm text-slate-500 mb-6">
							<div class="flex items-center gap-2">
								<div class="h-2 w-2 rounded-full bg-indigo-500"></div>
								<time datetime={article.created_at}>
									{formatDate(article.created_at)}
								</time>
							</div>
							{#if article.content}
								<div class="flex items-center gap-2">
									<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
									</svg>
									<span>{getReadingTime(article.content)} menit baca</span>
								</div>
							{/if}
						</div>

						<h1 class="text-xl font-bold leading-tight text-slate-900 sm:text-5xl md:text-2xl">
							{article.title}
						</h1>
					</header>

					<!-- Article Content -->
					<div class="px-8 pb-12 sm:px-12">
						<div class="prose prose-lg prose-slate max-w-none prose-headings:font-semibold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:leading-relaxed prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline prose-blockquote:border-l-indigo-500 prose-blockquote:bg-slate-50 prose-blockquote:py-1 prose-img:rounded-lg prose-img:shadow-md">
							{@html article.content}
						</div>
					</div>

					<!-- Article Footer dengan social sharing atau actions -->
					<footer class="border-t border-slate-200 bg-slate-50 px-8 py-6 sm:px-12">
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-2 text-sm text-slate-600">
								<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
								</svg>
								<span>Artikel</span>
							</div>
							<button
								type="button"
								onclick={() => goto(backUrl)}
								class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
							>
								Lihat Artikel Lainnya
							</button>
						</div>
					</footer>
				</article>
			{:else}
				<!-- Not Found State -->
				<div class="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-8 text-center">
					<div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-200">
						<svg class="h-8 w-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
						</svg>
					</div>
					<h3 class="text-lg font-semibold text-amber-800">Artikel Tidak Ditemukan</h3>
					<p class="mt-2 text-amber-700">Artikel yang Anda cari mungkin telah dihapus atau tidak tersedia.</p>
					<button
						type="button"
						onclick={() => goto(backUrl)}
						class="mt-4 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700"
					>
						Kembali ke Daftar Artikel
					</button>
				</div>
			{/if}
		</main>
	</div>
</div>
