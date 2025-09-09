<script>
    import { onMount } from 'svelte';

    // SMA Color Palette
    const smaColors = {
        primary: '#4f46e5',      // indigo-600
        secondary: '#64748b',     // slate-500
        success: '#059669',       // emerald-600
        warning: '#d97706',       // amber-600
        danger: '#dc2626',        // red-600
        info: '#0ea5e9',         // sky-500
        background: '#f8fafc',    // slate-50
        grid: '#e2e8f0'          // slate-200
    };

    // State
    let loading = $state(true);
    
    // Chart instances
    let barChart, areaChart, pieChart, stackedBarChart, multiLineChart;

    // Dummy Data
    const statsData = [
        { title: 'Total Users', value: '1,247', icon: 'users', color: 'bg-blue-500', change: '+12.3%', trend: 'up' },
        { title: 'Total Articles', value: '342', icon: 'document', color: 'bg-emerald-500', change: '+8.1%', trend: 'up' },
        { title: 'Total Roles', value: '24', icon: 'shield', color: 'bg-amber-500', change: '+2.4%', trend: 'up' },
        { title: 'Total Permissions', value: '156', icon: 'key', color: 'bg-red-500', change: '-1.2%', trend: 'down' }
    ];

    const barChartData = [
        { month: 'Jan', users: 65, articles: 28 },
        { month: 'Feb', users: 59, articles: 48 },
        { month: 'Mar', users: 80, articles: 40 },
        { month: 'Apr', users: 81, articles: 19 },
        { month: 'May', users: 56, articles: 86 },
        { month: 'Jun', users: 55, articles: 27 }
    ];

    const lineChartData = [
        { date: '1 Jan', views: 2400, sessions: 1400 },
        { date: '5 Jan', views: 1398, sessions: 2100 },
        { date: '10 Jan', views: 9800, sessions: 2000 },
        { date: '15 Jan', views: 3908, sessions: 2780 },
        { date: '20 Jan', views: 4800, sessions: 1890 },
        { date: '25 Jan', views: 3800, sessions: 2390 },
        { date: '30 Jan', views: 4300, sessions: 3490 }
    ];

    const pieChartData = [
        { name: 'Desktop', value: 45, color: smaColors.primary },
        { name: 'Mobile', value: 35, color: smaColors.success },
        { name: 'Tablet', value: 20, color: smaColors.warning }
    ];

    const stackedBarData = [
        { month: 'Jan', published: 20, draft: 8, pending: 5 },
        { month: 'Feb', published: 35, draft: 12, pending: 8 },
        { month: 'Mar', published: 28, draft: 15, pending: 6 },
        { month: 'Apr', published: 42, draft: 10, pending: 9 },
        { month: 'May', published: 38, draft: 18, pending: 7 },
        { month: 'Jun', published: 45, draft: 14, pending: 11 }
    ];

    const multiLineData = [
        { month: 'Jan', organic: 1200, paid: 800, social: 600, direct: 400 },
        { month: 'Feb', organic: 1800, paid: 1200, social: 800, direct: 600 },
        { month: 'Mar', organic: 1600, paid: 1000, social: 700, direct: 500 },
        { month: 'Apr', organic: 2200, paid: 1500, social: 900, direct: 700 },
        { month: 'May', organic: 2000, paid: 1300, social: 850, direct: 650 },
        { month: 'Jun', organic: 2400, paid: 1600, social: 1000, direct: 800 }
    ];

    const recentActivities = [
        { 
            user: 'Ahmad Rizki', 
            action: 'Login ke sistem', 
            time: '2 menit yang lalu',
            ip: '192.168.1.100',
            device: 'Chrome on Windows',
            status: 'success'
        },
        { 
            user: 'Siti Nurhaliza', 
            action: 'Membuat artikel baru', 
            time: '15 menit yang lalu',
            ip: '192.168.1.105',
            device: 'Safari on macOS',
            status: 'success'
        },
        { 
            user: 'Budi Santoso', 
            action: 'Gagal login (3x)', 
            time: '32 menit yang lalu',
            ip: '203.142.15.22',
            device: 'Firefox on Linux',
            status: 'error'
        },
        { 
            user: 'Diana Putri', 
            action: 'Update profile', 
            time: '1 jam yang lalu',
            ip: '192.168.1.110',
            device: 'Edge on Windows',
            status: 'success'
        },
        { 
            user: 'Eko Prasetyo', 
            action: 'Mengubah permission role', 
            time: '2 jam yang lalu',
            ip: '192.168.1.120',
            device: 'Chrome on Android',
            status: 'warning'
        }
    ];

    function getIcon(iconName) {
        const icons = {
            users: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>`,
            document: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>`,
            shield: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>`,
            key: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>`
        };
        return icons[iconName] || '';
    }

    function getStatusColor(status) {
        const colors = {
            success: 'text-green-600 bg-green-100',
            error: 'text-red-600 bg-red-100',
            warning: 'text-yellow-600 bg-yellow-100'
        };
        return colors[status] || 'text-gray-600 bg-gray-100';
    }

    // ApexCharts configurations
    const commonChartOptions = {
        chart: {
            fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
            toolbar: { show: false },
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 800
            }
        },
        colors: [smaColors.primary, smaColors.success, smaColors.warning, smaColors.danger],
        grid: {
            borderColor: smaColors.grid,
            strokeDashArray: 3
        },
        tooltip: {
            theme: 'light',
            style: {
                fontSize: '12px'
            }
        }
    };

    function initCharts() {
        // Bar Chart
        if (typeof ApexCharts !== 'undefined') {
            const barOptions = {
                ...commonChartOptions,
                chart: {
                    ...commonChartOptions.chart,
                    type: 'bar',
                    height: 300
                },
                series: [
                    { name: 'Users', data: barChartData.map(d => d.users) },
                    { name: 'Articles', data: barChartData.map(d => d.articles) }
                ],
                xaxis: {
                    categories: barChartData.map(d => d.month),
                    axisBorder: { show: false },
                    axisTicks: { show: false }
                },
                yaxis: {
                    axisBorder: { show: false },
                    axisTicks: { show: false }
                },
                plotOptions: {
                    bar: {
                        borderRadius: 4,
                        columnWidth: '60%'
                    }
                },
                dataLabels: { enabled: false }
            };
            barChart = new ApexCharts(document.querySelector("#barChart"), barOptions);
            barChart.render();

            // Area Chart
            const areaOptions = {
                ...commonChartOptions,
                chart: {
                    ...commonChartOptions.chart,
                    type: 'area',
                    height: 300
                },
                series: [
                    { name: 'Page Views', data: lineChartData.map(d => d.views) },
                    { name: 'Sessions', data: lineChartData.map(d => d.sessions) }
                ],
                xaxis: {
                    categories: lineChartData.map(d => d.date),
                    axisBorder: { show: false },
                    axisTicks: { show: false }
                },
                yaxis: {
                    axisBorder: { show: false },
                    axisTicks: { show: false }
                },
                fill: {
                    type: 'gradient',
                    gradient: {
                        shadeIntensity: 1,
                        opacityFrom: 0.3,
                        opacityTo: 0.1,
                        stops: [0, 90, 100]
                    }
                },
                stroke: {
                    curve: 'smooth',
                    width: 2
                },
                dataLabels: { enabled: false }
            };
            areaChart = new ApexCharts(document.querySelector("#areaChart"), areaOptions);
            areaChart.render();

            // Pie Chart
            const pieOptions = {
                ...commonChartOptions,
                chart: {
                    ...commonChartOptions.chart,
                    type: 'pie',
                    height: 300
                },
                series: pieChartData.map(d => d.value),
                labels: pieChartData.map(d => d.name),
                colors: pieChartData.map(d => d.color),
                legend: {
                    position: 'bottom'
                },
                dataLabels: {
                    enabled: true,
                    formatter: function (val) {
                        return Math.round(val) + "%"
                    }
                }
            };
            pieChart = new ApexCharts(document.querySelector("#pieChart"), pieOptions);
            pieChart.render();

            // Stacked Bar Chart
            const stackedOptions = {
                ...commonChartOptions,
                chart: {
                    ...commonChartOptions.chart,
                    type: 'bar',
                    height: 300,
                    stacked: true
                },
                series: [
                    { name: 'Published', data: stackedBarData.map(d => d.published) },
                    { name: 'Draft', data: stackedBarData.map(d => d.draft) },
                    { name: 'Pending', data: stackedBarData.map(d => d.pending) }
                ],
                xaxis: {
                    categories: stackedBarData.map(d => d.month),
                    axisBorder: { show: false },
                    axisTicks: { show: false }
                },
                yaxis: {
                    axisBorder: { show: false },
                    axisTicks: { show: false }
                },
                plotOptions: {
                    bar: {
                        borderRadius: 4,
                        columnWidth: '60%'
                    }
                },
                dataLabels: { enabled: false },
                colors: [smaColors.success, smaColors.warning, smaColors.danger]
            };
            stackedBarChart = new ApexCharts(document.querySelector("#stackedBarChart"), stackedOptions);
            stackedBarChart.render();

            // Multi Line Chart
            const multiLineOptions = {
                ...commonChartOptions,
                chart: {
                    ...commonChartOptions.chart,
                    type: 'line',
                    height: 350
                },
                series: [
                    { name: 'Organic', data: multiLineData.map(d => d.organic) },
                    { name: 'Paid Ads', data: multiLineData.map(d => d.paid) },
                    { name: 'Social Media', data: multiLineData.map(d => d.social) },
                    { name: 'Direct', data: multiLineData.map(d => d.direct) }
                ],
                xaxis: {
                    categories: multiLineData.map(d => d.month),
                    axisBorder: { show: false },
                    axisTicks: { show: false }
                },
                yaxis: {
                    axisBorder: { show: false },
                    axisTicks: { show: false }
                },
                stroke: {
                    curve: 'smooth',
                    width: 3
                },
                markers: {
                    size: 4,
                    hover: { size: 6 }
                },
                dataLabels: { enabled: false }
            };
            multiLineChart = new ApexCharts(document.querySelector("#multiLineChart"), multiLineOptions);
            multiLineChart.render();
        }
    }

    onMount(() => {
        // Load ApexCharts
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/apexcharts/3.44.0/apexcharts.min.js';
        script.onload = () => {
            // Simulate loading
            setTimeout(() => {
                loading = false;
                // Initialize charts after loading state ends
                setTimeout(() => {
                    initCharts();
                }, 100);
            }, 100);
        };
        document.head.appendChild(script);

        // Cleanup on destroy
        return () => {
            if (barChart) barChart.destroy();
            if (areaChart) areaChart.destroy();
            if (pieChart) pieChart.destroy();
            if (stackedBarChart) stackedBarChart.destroy();
            if (multiLineChart) multiLineChart.destroy();
        };
    });
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
    <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <!-- Header Section -->
        <header class="mb-8">
            <div class="flex flex-col justify-between space-y-4 sm:flex-row sm:items-center sm:space-y-0">
                <div>
                    <h1 class="text-4xl font-bold text-slate-900 sm:text-5xl">Dashboard</h1>
                    <p class="mt-2 text-lg text-slate-600">Selamat datang kembali! Berikut ringkasan aktivitas Anda.</p>
                </div>
                <div class="flex items-center gap-3">
                    <div class="text-sm text-slate-500">
                        Terakhir diperbarui: {new Date().toLocaleString('id-ID')}
                    </div>
                    <button class="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
                        Refresh Data
                    </button>
                </div>
            </div>
        </header>

        {#if loading}
            <!-- Loading State -->
            <div class="space-y-6">
                <!-- Stats Cards Skeleton -->
                <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {#each Array(4) as _}
                        <div class="animate-pulse rounded-2xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
                            <div class="flex items-center justify-between">
                                <div class="space-y-2">
                                    <div class="h-4 w-20 rounded bg-slate-200"></div>
                                    <div class="h-8 w-16 rounded bg-slate-200"></div>
                                </div>
                                <div class="h-12 w-12 rounded-lg bg-slate-200"></div>
                            </div>
                        </div>
                    {/each}
                </div>
                
                <!-- Charts Skeleton -->
                <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {#each Array(6) as _}
                        <div class="animate-pulse rounded-2xl bg-white p-8 shadow-lg ring-1 ring-slate-200">
                            <div class="mb-6 h-6 w-32 rounded bg-slate-200"></div>
                            <div class="h-80 rounded bg-slate-200"></div>
                        </div>
                    {/each}
                </div>
            </div>
        {:else}
            <!-- Stats Cards -->
            <div class="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {#each statsData as stat}
                    <div class="group rounded-2xl bg-white p-6 shadow-lg ring-1 ring-slate-200 transition-all duration-200 hover:shadow-xl hover:ring-2 hover:ring-indigo-200">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-slate-600">{stat.title}</p>
                                <p class="mt-2 text-3xl font-bold text-slate-900">{stat.value}</p>
                                <div class="mt-2 flex items-center text-sm">
                                    <span class="flex items-center gap-1 {stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}">
                                        {#if stat.trend === 'up'}
                                            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"/>
                                            </svg>
                                        {:else}
                                            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
                                            </svg>
                                        {/if}
                                        {stat.change}
                                    </span>
                                    <span class="ml-2 text-slate-500">dari bulan lalu</span>
                                </div>
                            </div>
                            <div class="rounded-xl {stat.color} p-3 text-white">
                                <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {@html getIcon(stat.icon)}
                                </svg>
                            </div>
                        </div>
                    </div>
                {/each}
            </div>

            <!-- Charts Grid -->
            <div class="space-y-8">
                <!-- Row 1: Bar Chart & Area Chart -->
                <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <!-- Bar Chart -->
                    <div class="rounded-2xl bg-white p-8 shadow-lg ring-1 ring-slate-200">
                        <h3 class="text-xl font-semibold text-slate-900 mb-6">Statistik Bulanan</h3>
                        <div id="barChart"></div>
                    </div>

                    <!-- Area Chart -->
                    <div class="rounded-2xl bg-white p-8 shadow-lg ring-1 ring-slate-200">
                        <h3 class="text-xl font-semibold text-slate-900 mb-6">Traffic Harian</h3>
                        <div id="areaChart"></div>
                    </div>
                </div>

                <!-- Row 2: Pie Chart & Stacked Bar Chart -->
                <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <!-- Pie Chart -->
                    <div class="rounded-2xl bg-white p-8 shadow-lg ring-1 ring-slate-200">
                        <h3 class="text-xl font-semibold text-slate-900 mb-6">Distribusi Perangkat</h3>
                        <div id="pieChart"></div>
                    </div>

                    <!-- Stacked Bar Chart -->
                    <div class="rounded-2xl bg-white p-8 shadow-lg ring-1 ring-slate-200">
                        <h3 class="text-xl font-semibold text-slate-900 mb-6">Status Artikel per Bulan</h3>
                        <div id="stackedBarChart"></div>
                    </div>
                </div>

                <!-- Row 3: Multi-Line Chart & Recent Activities Table -->
                <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <!-- Multi-Line Chart -->
                    <div class="lg:col-span-2 rounded-2xl bg-white p-8 shadow-lg ring-1 ring-slate-200">
                        <h3 class="text-xl font-semibold text-slate-900 mb-6">Sumber Traffic</h3>
                        <div id="multiLineChart"></div>
                    </div>

                    <!-- Recent Activities Table -->
                    <div class="rounded-2xl bg-white p-8 shadow-lg ring-1 ring-slate-200">
                        <h3 class="text-xl font-semibold text-slate-900 mb-6">Aktivitas Terbaru</h3>
                        <div class="space-y-4 max-h-80 overflow-y-auto">
                            {#each recentActivities as activity}
                                <div class="flex items-start space-x-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                                    <div class="flex-shrink-0 mt-1">
                                        <div class="h-2 w-2 rounded-full {activity.status === 'success' ? 'bg-green-500' : activity.status === 'error' ? 'bg-red-500' : 'bg-yellow-500'}"></div>
                                    </div>
                                    <div class="min-w-0 flex-1">
                                        <div class="text-sm font-medium text-slate-900">{activity.user}</div>
                                        <div class="text-sm text-slate-600">{activity.action}</div>
                                        <div class="text-xs text-slate-500 mt-1">
                                            {activity.time} • {activity.device}
                                        </div>
                                        <div class="text-xs text-slate-400 mt-1">
                                            IP: {activity.ip}
                                        </div>
                                    </div>
                                    <div class="flex-shrink-0">
                                        <span class="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium {getStatusColor(activity.status)}">
                                            {activity.status}
                                        </span>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    </div>
                </div>
            </div>
        {/if}
    </div>
</div>