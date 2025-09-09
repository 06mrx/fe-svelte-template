<script>
	import { goto } from '$app/navigation';
	import { PUBLIC_APP_NAME } from '$env/static/public';
	import { onMount } from 'svelte';

	let isVisible = false;
	let currentFeature = 0;

	const features = [
		{
			icon: '/authentication.webp',
			title: 'Authentication System',
			description:
				'Complete user authentication with JWT, session management, dan password security',
			tech: 'Go JWT + Goravel Auth'
		},
		{
			icon: '/authorization.webp',
			title: 'Authorization & Roles',
			description: 'Role-based access control (RBAC) dengan permission management yang fleksibel',
			tech: 'Custom RBAC System'
		},
		{
			icon: '/user-management.webp',
			title: 'User Management',
			description: 'CRUD user lengkap dengan profile management dan user activity tracking',
			tech: 'Go + SvelteKit'
		},
		{
			icon: 'audit.webp',
			title: 'Audit Logging',
			description: 'Comprehensive audit trails untuk tracking semua aktivitas sistem',
			tech: 'Database Logging'
		}
	];

	const techStack = [
		{ name: 'Go (Goravel)', icon: 'goravel.webp', description: 'Backend framework yang powerful dan cepat' },
		{ name: 'SvelteKit', icon: 'svelte.webp', description: 'Modern frontend framework dengan SSR' },
		{ name: 'PostgreSQL', icon: 'postgresql.webp', description: 'Reliable database untuk production' },
		{ name: 'JWT Auth', icon: 'jwt.webp', description: 'Secure token-based authentication' }
	];

	const implementations = [
		{ feature: 'User CRUD', status: '✅', description: 'Create, Read, Update, Delete users' },
		{
			feature: 'Role Management',
			status: '✅',
			description: 'Dynamic role creation and assignment'
		},
		{ feature: 'Permission System', status: '✅', description: 'Granular permission control' },
		{ feature: 'Audit Logs', status: '✅', description: 'Complete activity tracking' },
		{ feature: 'API Documentation', status: '✅', description: 'Swagger/OpenAPI ready' },
		{ feature: 'Docker Setup', status: '✅', description: 'One-click deployment ready' }
	];

	onMount(() => {
		isVisible = true;

		// Auto-rotate features
		const interval = setInterval(() => {
			currentFeature = (currentFeature + 1) % features.length;
		}, 4000);

		return () => clearInterval(interval);
	});
</script>

<main class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
	<!-- Navigation -->
	<nav class="relative sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-lg">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="flex h-16 items-center justify-between">
				<div class="flex items-center space-x-3">
					<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/50">
						<img src="/favicon/favicon-32x32.png" alt="favicon" />
					</div>
					<span class="text-2xl font-bold text-slate-900">{PUBLIC_APP_NAME}</span>
				</div>

				<div class="hidden items-center space-x-8 md:flex">
					<a
						href="#features"
						class="font-medium text-slate-600 transition-colors hover:text-indigo-600">Features</a
					>
					<a href="#tech" class="font-medium text-slate-600 transition-colors hover:text-indigo-600"
						>Tech Stack</a
					>
					<a href="##" class="font-medium text-slate-600 transition-colors hover:text-indigo-600"
						>Demo</a
					>
					<a href="#docs" class="font-medium text-slate-600 transition-colors hover:text-indigo-600"
						>Docs</a
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

	<!-- Hero Section -->
	<section class="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
		<!-- Background Elements -->
		<div class="absolute inset-0">
			<div
				class="absolute top-0 left-1/2 h-96 w-96 -translate-x-1/2 transform rounded-full bg-indigo-400 opacity-10 blur-3xl"
			></div>
			<div
				class="absolute right-1/4 bottom-0 h-64 w-64 rounded-full bg-purple-400 opacity-10 blur-3xl"
			></div>
			<div
				class="absolute top-1/3 left-1/4 h-48 w-48 animate-pulse rounded-full bg-emerald-400 opacity-10 blur-3xl"
			></div>
		</div>

		<div class="relative mx-auto max-w-7xl">
			<div class="text-center">
				<!-- Main Heading -->
				<div class="mb-6 {isVisible ? 'animate-fade-in-up' : 'opacity-0'}">
					<span
						class="mb-4 inline-block rounded-full bg-indigo-100 px-4 py-2 text-sm font-semibold text-indigo-800"
					>
						🚀 Starter Kit Ready to Use
					</span>
				</div>
        <div class="flex w-full justify-center">
          <img src="/logo.png" class=" w-56" alt="logo" />
        </div>
				<h1
					class="mb-8 text-5xl leading-tight font-bold text-slate-900 lg:text-7xl {isVisible
						? 'animate-fade-in-up'
						: 'opacity-0'}"
				>
					<!-- <span class="block">Go-SvelteX</span> -->
					<span
						class="block bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
					>
						
					</span>
					<span class="block text-3xl font-medium text-slate-600 lg:text-4xl">
						Slate Modern Admin
					</span>
				</h1>

				<!-- Subtitle -->
				<p
					class="mx-auto mb-12 max-w-4xl text-xl leading-relaxed text-slate-600 lg:text-2xl {isVisible
						? 'animate-fade-in-up'
						: 'opacity-0'}"
					style="animation-delay: 0.2s"
				>
					Complete admin starter kit dengan sistem <strong
						>Authentication, Authorization & Accounting</strong
					>
					yang dibangun menggunakan Go (Goravel) dan SvelteKit
				</p>

				<!-- CTA Buttons -->
				<div
					class="mb-16 flex flex-col items-center justify-center gap-4 sm:flex-row {isVisible
						? 'animate-fade-in-up'
						: 'opacity-0'}"
					style="animation-delay: 0.4s"
				>
					<button
						class="group rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-4 text-lg font-semibold text-white transition-all duration-300 hover:scale-105 hover:shadow-xl"
					>
						Download Starter Kit
						<svg
							class="ml-2 inline-block h-5 w-5 transition-transform duration-300 group-hover:translate-x-1"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
							/>
						</svg>
					</button>
					<button
						onclick={goto('auth/login')}
						class="rounded-xl border-2 border-slate-300 px-8 py-4 text-lg font-semibold text-slate-700 transition-all duration-300 hover:border-indigo-300 hover:bg-slate-50"
					>
						View Demo
					</button>
				</div>

				<!-- Code Preview -->
				<div
					class="relative mx-auto max-w-5xl {isVisible ? 'animate-fade-in-up' : 'opacity-0'}"
					style="animation-delay: 0.6s"
				>
					<div class="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
						<div
							class="flex items-center justify-between border-b border-slate-700 bg-slate-800 px-6 py-4"
						>
							<div class="flex items-center space-x-3">
								<div class="flex space-x-2">
									<div class="h-3 w-3 rounded-full bg-red-400"></div>
									<div class="h-3 w-3 rounded-full bg-yellow-400"></div>
									<div class="h-3 w-3 rounded-full bg-green-400"></div>
								</div>
								<span class="text-sm font-medium text-slate-400">go-sveltex/</span>
							</div>
							<div class="flex items-center space-x-2">
								<span class="text-xs text-slate-400">Go + SvelteKit</span>
							</div>
						</div>
						<div class="p-6 text-left">
							<div class="font-mono text-sm text-slate-300">
								<div class="text-emerald-400">// Quick Start</div>
								<div class="mt-2">
									<span class="text-blue-400">git clone</span>
									<span class="text-slate-300">https://github.com/username/go-sveltex</span>
								</div>
								<div class="text-blue-400">cd <span class="text-slate-300">go-sveltex</span></div>
								<div class="text-blue-400">
									docker-compose up <span class="text-slate-500">-d</span>
								</div>
								<div class="mt-4 text-emerald-400">// Features included:</div>
								<div class="text-slate-400">✅ User Authentication & Authorization</div>
								<div class="text-slate-400">✅ Role & Permission Management</div>
								<div class="text-slate-400">✅ Audit Logging System</div>
								<div class="text-slate-400">✅ Modern Admin Dashboard</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Features Section -->
	<section id="features" class="bg-white px-4 py-20 sm:px-6 lg:px-8">
		<div class="mx-auto max-w-7xl">
			<div class="mb-16 text-center">
				<h2 class="mb-6 text-4xl font-bold text-slate-900 lg:text-5xl">
					Complete <span
						class="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
						>AAA System</span
					>
				</h2>
				<p class="mx-auto max-w-3xl text-xl text-slate-600">
					Authentication, Authorization & Accounting - Everything you need for enterprise-grade
					admin system
				</p>
			</div>

			<div class="grid gap-10 md:gap-8 md:grid-cols-2 lg:grid-cols-4">
				{#each features as feature, index}
					<div
						class="group relative rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-8 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl {currentFeature ===
						index
							? 'shadow-lg ring-2 ring-indigo-200'
							: ''}"
					>
						<div
							class="mb-6 absolute -top-9 left-0  flex h-16 w-full items-center justify-center rounded-2xl  transition-transform duration-300 group-hover:scale-110"
						>
							<img src={feature.icon} class="h-16   p-1 bg-slate-200/80 rounded-2xl" alt="">
						</div>
						<h3 class="mb-3 text-xl font-bold text-slate-900">{feature.title}</h3>
						<p class="mb-4 leading-relaxed text-slate-600">{feature.description}</p>
						<div class="rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-600">
							{feature.tech}
						</div>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- Implementation Section -->
	<section class="bg-gradient-to-br from-slate-50 to-white px-4 py-20 sm:px-6 lg:px-8">
		<div class="mx-auto max-w-7xl">
			<div class="mb-16 text-center">
				<h2 class="mb-6 text-4xl font-bold text-slate-900 lg:text-5xl">
					What's <span
						class="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent"
						>Included</span
					>
				</h2>
				<p class="text-xl text-slate-600">
					Production-ready implementations that you can use immediately
				</p>
			</div>

			<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{#each implementations as item}
					<div
						class="rounded-xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
					>
						<div class="flex items-start space-x-4">
							<div class="text-2xl">{item.status}</div>
							<div>
								<h3 class="mb-2 text-lg font-bold text-slate-900">{item.feature}</h3>
								<p class="text-sm text-slate-600">{item.description}</p>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- Tech Stack Section -->
	<section id="tech" class="bg-white px-4 py-20 sm:px-6 lg:px-8">
		<div class="mx-auto max-w-7xl">
			<div class="mb-16 text-center">
				<h2 class="mb-6 text-4xl font-bold text-slate-900 lg:text-5xl">
					Modern <span
						class="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
						>Tech Stack</span
					>
				</h2>
				<p class="text-xl text-slate-600">
					Built with cutting-edge technologies for maximum performance and developer experience
				</p>
			</div>

			<div class="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
				{#each techStack as tech}
					<div class="group text-center">
						<div
							class="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-100 to-white text-4xl transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg"
						>
							<img src={tech.icon} alt="">
						</div>
						<h3 class="mb-2 text-xl font-bold text-slate-900">{tech.name}</h3>
						<p class="text-sm text-slate-600">{tech.description}</p>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- Getting Started Section -->
	<section class="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-20 sm:px-6 lg:px-8">
		<div class="mx-auto max-w-4xl text-center">
			<h2 class="mb-6 text-4xl font-bold text-white lg:text-5xl">
				Ready to Build Amazing Admin Systems?
			</h2>
			<p class="mb-12 text-xl text-indigo-100">
				Skip the boilerplate code and start building your application features immediately
			</p>

			<div class="mb-12 flex flex-col justify-center gap-4 sm:flex-row">
				<button
					class="group rounded-xl bg-white px-8 py-4 text-lg font-semibold text-indigo-600 transition-all duration-300 hover:scale-105 hover:shadow-xl"
				>
					Download Now
					<svg
						class="ml-2 inline-block h-5 w-5 transition-transform duration-300 group-hover:translate-y-1"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
						/>
					</svg>
				</button>
				<button
					class="rounded-xl border-2 border-white px-8 py-4 text-lg font-semibold text-white transition-all duration-300 hover:bg-white hover:text-indigo-600"
				>
					View Documentation
				</button>
			</div>

			<div class="text-center">
				<div
					class="inline-flex items-center space-x-4 rounded-xl bg-white/10 px-6 py-3 backdrop-blur-sm"
				>
					<svg class="h-5 w-5 text-emerald-300" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
							clip-rule="evenodd"
						/>
					</svg>
					<span class="font-medium text-white">MIT License • Free Forever</span>
				</div>
			</div>
		</div>
	</section>

	<!-- Footer -->
	<footer class="bg-slate-900 px-4 py-16 sm:px-6 lg:px-8">
		<div class="mx-auto max-w-7xl">
			<div class="mb-12 grid gap-8 md:grid-cols-4">
				<div class="md:col-span-2">
					<div class="mb-6 flex items-center space-x-3">
						<div
							class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 p-1"
						>
							<img src="/logo.png" class=" w-56" alt="logo" />
						</div>
						<span class="text-2xl font-bold text-white">{PUBLIC_APP_NAME}</span>
					</div>
					<p class="mb-6 max-w-md text-slate-400">
						Modern admin starter kit with complete AAA system. Built for developers who want to
						focus on building features, not boilerplate code.
					</p>
					<div class="flex space-x-4">
						<a
							href="##" aria-label="Twitter"
							class="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
						>
							<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
								<path
									d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
								/>
							</svg>
						</a>
					</div>
				</div>

				<div>
					<h3 class="mb-6 text-lg font-semibold text-white">Resources</h3>
					<ul class="space-y-4">
						<li>
							<a href="##" class="text-slate-400 transition-colors hover:text-white">Documentation</a
							>
						</li>
						<li>
							<a href="##" class="text-slate-400 transition-colors hover:text-white">API Reference</a
							>
						</li>
						<li>
							<a href="##" class="text-slate-400 transition-colors hover:text-white">Examples</a>
						</li>
						<li>
							<a href="##" class="text-slate-400 transition-colors hover:text-white">Tutorials</a>
						</li>
					</ul>
				</div>

				<div>
					<h3 class="mb-6 text-lg font-semibold text-white">Community</h3>
					<ul class="space-y-4">
						<li>
							<a href="##" class="text-slate-400 transition-colors hover:text-white">GitHub</a>
						</li>
						<li>
							<a href="##" class="text-slate-400 transition-colors hover:text-white">Discord</a>
						</li>
						<li>
							<a href="##" class="text-slate-400 transition-colors hover:text-white">Issues</a>
						</li>
						<li>
							<a href="##" class="text-slate-400 transition-colors hover:text-white">Discussions</a>
						</li>
					</ul>
				</div>
			</div>

			<div class="border-t border-slate-800 pt-8 text-center">
				<p class="text-slate-400">© 2024 Go-SvelteX. MIT License. Made with ❤️ for developers.</p>
			</div>
		</div>
	</footer>
</main>

<style>
	@keyframes fade-in-up {
		from {
			opacity: 0;
			transform: translateY(30px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.animate-fade-in-up {
		animation: fade-in-up 0.8s ease-out forwards;
	}
</style>
