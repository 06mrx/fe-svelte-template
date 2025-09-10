<script lang="ts">
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { PUBLIC_APP_NAME, PUBLIC_API_URL } from '$env/static/public';

    // Ambil data dari load server
    let {data} = $props();
    
    let article: any = $state(data.article);
    let loading: boolean = $state(!data.article && !data.errorMessage);
    let errorMessage: string = $state(data.errorMessage);

    const objectName = 'Artikel';
    const backUrl = '/app/admin/articles';

    function formatDate(dateString: string) {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    function getReadingTime(content: string) {
        const wordsPerMinute = 200;
        const textContent = content.replace(/<[^>]*>/g, '');
        const wordCount = textContent.split(/\s+/).length;
        return Math.ceil(wordCount / wordsPerMinute);
    }
</script>

<svelte:head>
  <title>{PUBLIC_APP_NAME + (article ? ' - ' + article.title : '')}</title>
  <meta name="description" content={article?.content?.slice(0,50)}/>
  <meta name="robots" content="index, follow" />

  <!-- Open Graph -->
  <meta property="og:type" content="website" />
  <meta property="og:title" content={PUBLIC_APP_NAME + (article ? ' - ' + article.title : '')} />
  <meta property="og:description" content={article?.content?.slice(0,50)} />
  <meta property="og:url" content="http://go-sveltex.cloudlabx.online" />
  <meta property="og:image" content={article?.image_url ? PUBLIC_API_URL + '/public/' + article.image_url : '/logo.webp'} />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={PUBLIC_APP_NAME} />
  <meta name="twitter:description" content={article?.content?.slice(0,50)} />
  <meta name="twitter:image" content={article?.image_url ? PUBLIC_API_URL + '/public/' + article.image_url : '/logo.webp'} />
</svelte:head>

<div class="min-h-[50dvh] bg-gradient-to-br from-slate-50 via-white to-slate-100">
    <div class="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <header class="mb-8">
            <button
                type="button"
                on:click={() => goto(backUrl)}
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

        <main>
            {#if loading}
                <div class="space-y-6 animate-pulse">
                    <div class="mb-6 h-8 w-3/4 rounded-lg bg-slate-200"></div>
                    <div class="mb-4 h-4 w-1/2 rounded bg-slate-200"></div>
                    <div class="mb-6 h-96 w-full rounded-2xl bg-slate-200"></div>
                    <div class="space-y-3">
                        <div class="h-4 w-full rounded bg-slate-200"></div>
                        <div class="h-4 w-5/6 rounded bg-slate-200"></div>
                        <div class="h-4 w-4/5 rounded bg-slate-200"></div>
                        <div class="h-4 w-full rounded bg-slate-200"></div>
                        <div class="h-4 w-3/4 rounded bg-slate-200"></div>
                    </div>
                </div>
            {:else if errorMessage}
                <div class="rounded-2xl border border-red-200 bg-gradient-to-r from-red-50 to-red-100 p-8">
                    <p class="text-red-700">{errorMessage}</p>
                </div>
            {:else if article}
                <article class="overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-slate-200">
                    {#if article.image_url}
                        <div class="relative overflow-hidden">
                            <img
                                src={PUBLIC_API_URL + '/public/' + article.image_url}
                                alt={article.title}
                                class="h-96 w-full object-cover transition-transform duration-500 hover:scale-105"
                            />
                            <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                        </div>
                    {/if}

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

                    <div class="px-8 pb-12 sm:px-12">
                        <div class="prose prose-lg prose-slate max-w-none">
                            {@html article.content}
                        </div>
                    </div>
                </article>
            {/if}
        </main>
    </div>
</div>
