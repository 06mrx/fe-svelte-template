<script lang="ts">
	import '../../../app.css';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { storageService } from '$lib/services/storageService';
	import { goto } from '$app/navigation';
	let isSidebarOpen = $state(false);
	let isMobile = $state(false);
	let isDropdownOpen = $state(false);
	let isProductsOpen = $state(false);
	import { PUBLIC_API_URL } from '$env/static/public';
	import toast, { Toaster } from 'svelte-french-toast';
	import { capitalizeFirst } from '$lib/services/functionService';

	const TOKEN = storageService.getToken();

	const checkToken = () => {
		if (!TOKEN) {
			const currentUrl = encodeURIComponent($page.url.pathname + $page.url.search);
			goto(`/auth/login?returnUrl=${currentUrl}`);
			return;
		}
	};

	// const checkRole

	const handleLogout = async () => {
		const _TOKEN = storageService.getToken();

		try {
			const response = await fetch(`${PUBLIC_API_URL}/api/logout`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Referer: window.location.origin,
					Authorization: _TOKEN
				}
			});

			const result = await response.json();

			if (response.ok) {
				// Login berhasil, simpan data ke local storage
				if (browser) {
					storageService.clearToken();
					storageService.clearUserData();
					goto('/');
				}
			} else {
				// Login gagal, tampilkan pesan error
				console.log(result.message);
				toast.error(result.message);
				// errorMessage = result.message || 'Login gagal, coba lagi.';
			}
		} catch (error) {
			// errorMessage = 'Terjadi kesalahan jaringan.';
			toast.error(error);
			console.error('Login error:', error);
		}
	};

	// Function to capitalize and format segment names
	function formatSegmentName(segment: string): string {
		// Handle special cases or keep as is for IDs
		if (/^\d+$/.test(segment)) {
			return `#${segment}`;
		}

		// Convert kebab-case or snake_case to Title Case
		return segment
			.split(/[-_]/)
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}

	// Function to generate breadcrumbs from current route
	function generateBreadcrumbs(currentPath: string) {
		const breadcrumbs = [];

		// Split path into segments and filter out empty ones
		const segments = currentPath.split('/').filter(Boolean);

		// Generate breadcrumb for each segment
		segments.forEach((segment, index) => {
			// Build the path up to current segment
			let path = '/' + segments.slice(0, index + 1).join('/');
            if (path == '/app') {
                path = '/app/user/dashboard';
            }
			const isActive = index === segments.length - 1;

			breadcrumbs.push({
				label: formatSegmentName(segment),
				href: isActive ? null : path,
				isActive: isActive
			});
		});

		return breadcrumbs;
	}

	// Reactive breadcrumbs based on current page
	const breadcrumbs = $derived($page ? generateBreadcrumbs($page.url.pathname) : []);

	onMount(() => {
		checkToken();
		checkScreenSize();

		const handleResize = () => checkScreenSize();
		window.addEventListener('resize', handleResize);

		return () => {
			window.removeEventListener('resize', handleResize);
		};
	});

	function checkScreenSize() {
		if (browser) {
			const width = window.innerWidth;
			isMobile = width < 1024;

			if (!isMobile) {
				isSidebarOpen = true;
			} else {
				isSidebarOpen = false;
			}
		}
	}

	function toggleSidebar() {
		isSidebarOpen = !isSidebarOpen;
	}

	function closeSidebar() {
		if (isMobile) {
			isSidebarOpen = false;
		}
	}

	function toggleDropdown() {
		isDropdownOpen = !isDropdownOpen;
	}

	function closeDropdown() {
		isDropdownOpen = false;
	}

	function toggleProducts() {
		isProductsOpen = !isProductsOpen;
	}
</script>

<Toaster />
<!-- Main Container -->
<div class="relative flex h-screen w-screen overflow-hidden bg-gray-50">
	<!-- Mobile Backdrop -->
	{#if isSidebarOpen && isMobile}
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div
			class="fixed inset-0 z-40 bg-white/70 bg-opacity-50 lg:hidden"
			onclick={closeSidebar}
		></div>
	{/if}

	<!-- Sidebar -->
	<div
		class="z-50 flex h-screen w-72 transform flex-col rounded-r-lg bg-slate-900 transition-all duration-300 ease-in-out"
		class:fixed={isMobile}
		class:absolute={!isMobile && !isSidebarOpen}
		class:relative={!isMobile && isSidebarOpen}
		class:inset-y-0={isMobile}
		class:left-0={isMobile}
		class:translate-x-0={isSidebarOpen}
		class:-translate-x-full={!isSidebarOpen}
	>
		<!-- Sidebar Header -->
		<div class="flex h-16 items-center justify-between border-b border-white/10 px-6">
			<div class="flex items-center space-x-3">
				<div
					class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm"
				>
					<svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M13 10V3L4 14h7v7l9-11h-7z"
						/>
					</svg>
				</div>
				<div>
					<h1 class="text-xl font-bold text-white">Dashboard</h1>
					<p class="text-xs text-white/70">User Panel</p>
				</div>
			</div>

			{#if isMobile}
				<button
					onclick={closeSidebar}
					class="rounded-lg p-2 text-white/80 transition-all hover:bg-pink-500/10 hover:text-white"
					aria-label="Close sidebar"
				>
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			{/if}
		</div>

		<!-- Sidebar Content -->
		<div
			class="custom-sidebar-scroll flex-1 space-y-2 overflow-y-auto p-4 hover:overflow-y-auto md:overflow-y-hidden"
		>
			<!-- Hapus h-screen dari sini -->
			<!-- Navigation Items -->
			<div class="space-y-1">
				<a
					onclick={isMobile ? toggleSidebar : null}
					href="/app/user/dashboard"
					class="group flex items-center rounded-xl px-4 py-3 text-white/90 transition-all hover:bg-pink-500/10 hover:text-white"
					class:bg-pink-600={$page.url.pathname == '/app/user/dashboard'}
					class:opacity-90={$page.url.pathname == '/app/user/dashboard'}
				>
					<svg
						class="mr-3 h-5 w-5 transition-transform group-hover:scale-110"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
						/>
					</svg>
					Dashboard
				</a>

				
			</div>
		</div>

		<!-- Sidebar Footer -->
		<div class="h-20 border-t border-white/10 p-2">
			<div class="flex items-center space-x-3 rounded-xl bg-white/5 p-3 backdrop-blur-sm">
				<div
					class="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-rose-400 to-pink-500"
				>
					<span class="text-xs font-bold text-white">A</span>
				</div>
				<div class="min-w-0 flex-1">
					<p class="truncate text-sm font-medium text-white">{storageService.get('name')}</p>
					<p class="truncate text-xs text-white/60">{storageService.get('email')}</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Main Content Area -->
	<div class="flex h-full w-full flex-col transition-all duration-300 ease-in-out">
		<!-- Top Navigation Bar -->
		<header
			class="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-1 shadow-lg"
		>
			<div class="flex items-center space-x-4">
				<!-- Mobile Menu Button -->
				<button
					onclick={toggleSidebar}
					class="rounded-xl bg-gray-100 p-2 text-gray-700 transition-all duration-200 hover:bg-gray-200 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 lg:hidden"
					aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
				>
					<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 6h16M4 12h16M4 18h16"
						/>
					</svg>
				</button>

				<!-- Desktop Sidebar Toggle -->
				<button
					onclick={toggleSidebar}
					class="hidden rounded-xl bg-gray-100 p-2 text-gray-700 transition-all duration-200 hover:bg-gray-200 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 lg:flex"
					aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
				>
					{#if isSidebarOpen}
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
							/>
						</svg>
					{:else}
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M13 5l7 7-7 7M5 5l7 7-7 7"
							/>
						</svg>
					{/if}
				</button>

				<!-- Dynamic Breadcrumb -->
				<nav class="hidden items-center space-x-2 text-sm sm:flex">
					{#each breadcrumbs as crumb, index}
						{#if index > 0}
							<svg
								class="h-4 w-4 text-gray-400"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 5l7 7-7 7"
								/>
							</svg>
						{/if}

						{#if crumb.href && !crumb.isActive}
							<a
								href={crumb.href}
								class="font-medium text-gray-600 transition-colors hover:text-indigo-600"
							>
								{crumb.label}
							</a>
						{:else}
							<span class="font-semibold text-gray-900">
								{crumb.label}
							</span>
						{/if}
					{/each}
				</nav>
			</div>

			<!-- Header Actions -->
			<div class="flex items-center space-x-4">
				<!-- Search -->
				<!-- <div class="relative hidden md:block">
          <input 
            type="text" 
            placeholder="Search..." 
            class="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <svg class="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div> -->

				<!-- Notifications -->
				<button
					class="relative rounded-full bg-gray-100 p-2 text-gray-700 transition-colors hover:bg-gray-200"
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 24 24"
						><!-- Icon from Google Material Icons by Material Design Authors - https://github.com/material-icons/material-icons/blob/master/LICENSE --><path
							fill="currentColor"
							d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2m6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5z"
						/></svg
					>
					<span class="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-red-500"></span>
				</button>

				<!-- User Menu Dropdown -->
				<div class="relative">
					<!-- User Button -->
					<button
						onclick={toggleDropdown}
						class="flex items-center space-x-3 rounded-xl p-2 transition-all duration-200 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
					>
						<div class="hidden text-right sm:block">
							<p class="text-sm font-medium text-gray-900">Welcome, {storageService.get('name')}</p>
							<p class="text-xs text-gray-600">{capitalizeFirst(storageService.get('role'))}</p>
						</div>

						<div
							class="flex h-10 w-10 transform items-center justify-center rounded-full bg-pink-500 font-medium text-white transition-all hover:scale-105 hover:shadow-lg"
						>
							<svg class="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
								<path
									fill-rule="evenodd"
									d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
									clip-rule="evenodd"
								/>
							</svg>
						</div>
					</button>

					<!-- Dropdown Menu -->
					{#if isDropdownOpen}
						<!-- svelte-ignore a11y-click-events-have-key-events -->
						<!-- svelte-ignore a11y-no-static-element-interactions -->
						<div class="fixed inset-0 z-10" onclick={closeDropdown}></div>

						<div
							class="absolute right-0 top-full z-20 mt-2 w-56 rounded-xl border border-gray-200 bg-white py-2 shadow-xl"
						>
							<!-- User Info Header -->
							<div class="border-b border-gray-100 px-4 py-3">
								<p class="text-sm font-medium text-gray-900">{storageService.get('email')}</p>
								<!-- <p class="text-xs text-gray-600">admin@example.com</p> -->
							</div>

							<!-- Menu Items -->
							<div class="py-2">
								<a
									href="/app/profile"
									class="flex items-center px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900"
									onclick={closeDropdown}
								>
									<svg
										class="mr-3 h-4 w-4 text-gray-500"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
										/>
									</svg>
									Profile
								</a>

								<a
									href="/app/settings"
									class="flex items-center px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900"
									onclick={closeDropdown}
								>
									<svg
										class="mr-3 h-4 w-4 text-gray-500"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
										/>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
										/>
									</svg>
									Settings
								</a>
							</div>

							<!-- Divider -->
							<div class="my-2 border-t border-gray-100"></div>

							<!-- Logout -->
							<a
								href="##"
								class="flex items-center px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 hover:text-red-800"
								onclick={handleLogout}
							>
								<svg
									class="mr-3 h-4 w-4 text-red-500"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
									/>
								</svg>
								Logout
							</a>
						</div>
					{/if}
				</div>
			</div>
		</header>

		<!-- Main Content -->
		<main class="flex-1 overflow-y-auto bg-gray-50">
			<div class="h-full px-2">
				<slot />
			</div>
		</main>
	</div>
</div>

<style>
	/* Menata scrollbar untuk div dengan class "custom-sidebar-scroll" */
	.custom-sidebar-scroll::-webkit-scrollbar {
		width: 3px; /* Lebar scrollbar */
	}

	.custom-sidebar-scroll::-webkit-scrollbar-track {
		background: #1e293b; /* Warna track scrollbar (bg-slate-900) */
	}

	.custom-sidebar-scroll::-webkit-scrollbar-thumb {
		background-color: #ec4899; /* Warna thumb scrollbar (pink-500) */
		border-radius: 3px; /* Sudut membulat untuk thumb */
	}
</style>
