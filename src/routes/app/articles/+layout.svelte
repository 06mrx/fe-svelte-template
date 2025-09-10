<script>
	import { goto } from "$app/navigation";
	import { PUBLIC_APP_NAME } from "$env/static/public";

    
</script>
<main class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
    <nav class="relative sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-lg">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="flex h-16 items-center justify-between">
				<button onclick="{goto('/')}" class="flex items-center space-x-3 hover:cursor-pointer">
					<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/50">
						<img src="/favicon/favicon-96x96.png" loading="lazy" alt="favicon" title="favicon" />
					</div>
					<span class="text-2xl font-bold text-slate-900">{PUBLIC_APP_NAME}</span>
				</button>

				<div class="hidden items-center space-x-8 md:flex">
					<a
						href="javascript:void(0)"
						class="font-medium text-slate-600 transition-colors hover:text-indigo-600">Features</a
					>
					<a href="#tech" class="font-medium text-slate-600 transition-colors hover:text-indigo-600"
						>Tech Stack</a
					>
					<a href="javascript:void(0)" class="font-medium text-slate-600 transition-colors hover:text-indigo-600"
						>Docs</a
					>
					<a href="/app/articles" class="font-medium text-slate-600 transition-colors hover:text-indigo-600"
						>Articles</a
					>
				</div>

				<div class=" items-center space-x-3 hidden md:flex">
					<button class="font-medium text-slate-600 transition-colors hover:text-indigo-600">
						GitHub
					</button>
					<button
						class="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-2 font-medium text-white transition-all duration-300 hover:scale-105 hover:shadow-lg"
					>
						Download
					</button>
				</div>
			</div>
		</div>
	</nav>
<slot><!-- optional fallback --></slot>
<footer class="bg-slate-900 px-4 py-16 sm:px-6 lg:px-8">
		<div class="mx-auto max-w-7xl">
			<div class="mb-3 grid gap-8 md:grid-cols-4">
				<div class="md:col-span-2">
					<div class="mb-6 flex items-center space-x-3">
						<div
							class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 p-1"
						>
							<img loading="lazy" src="/logo.webp" class=" w-56" alt="logo" title="logo" />
						</div>
						<span class="text-2xl font-bold text-white">{PUBLIC_APP_NAME}</span>
					</div>
					<p class="mb-6 max-w-md text-slate-400">
						Modern admin starter kit with complete AAA system. Built for developers who want to
						focus on building features, not boilerplate code.
					</p>
					
				</div>

			
			</div>

			<div class="border-t border-slate-800 pt-1 text-center">
				<p class="text-slate-400">© 2024 Go-SvelteX. MIT License. Made with ❤️ for developers.</p>
			</div>
		</div>
	</footer>
</main>
