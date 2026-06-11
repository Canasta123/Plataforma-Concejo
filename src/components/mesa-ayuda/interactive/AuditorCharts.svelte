<script lang="ts">
  import { onMount } from 'svelte';

  export let data: {
    total: number;
    porEstado: Record<string, number>;
    porPrioridad: Record<string, number>;
    porCategoria: Record<string, number>;
    sla: { total: number; cumplidos: number; pct: number };
    vencidos: number;
    volumen: { labels: string[]; data: number[] };
  };

  let Chart: any;
  let mounted = false;

  onMount(async () => {
    const mod = await import('chart.js/auto');
    Chart = mod.default;
    mounted = true;
    initCharts();
  });

  function initCharts() {
    // Estado
    new Chart(document.getElementById('chart-estado'), {
      type: 'doughnut',
      data: {
        labels: ['Abierto', 'En Progreso', 'Resuelto', 'Cerrado'],
        datasets: [{
          data: [
            data.porEstado.abierto,
            data.porEstado.en_progreso,
            data.porEstado.resuelto,
            data.porEstado.cerrado,
          ],
          backgroundColor: ['#3b82f6', '#eab308', '#22c55e', '#9ca3af'],
          borderWidth: 0,
        }],
      },
      options: { plugins: { legend: { position: 'bottom' } }, cutout: '65%' },
    });

    // Prioridad
    new Chart(document.getElementById('chart-prioridad'), {
      type: 'bar',
      data: {
        labels: ['Alta', 'Media', 'Baja'],
        datasets: [{
          label: 'Tickets',
          data: [data.porPrioridad.alta, data.porPrioridad.media, data.porPrioridad.baja],
          backgroundColor: ['#ef4444', '#f97316', '#6b7280'],
          borderRadius: 6,
        }],
      },
      options: {
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
      },
    });

    // Categoría
    new Chart(document.getElementById('chart-categoria'), {
      type: 'bar',
      data: {
        labels: ['Hardware', 'Software', 'Redes', 'Otro'],
        datasets: [{
          label: 'Tickets',
          data: [
            data.porCategoria.hardware,
            data.porCategoria.software,
            data.porCategoria.redes,
            data.porCategoria.otro,
          ],
          backgroundColor: ['#6366f1', '#0ea5e9', '#14b8a6', '#a78bfa'],
          borderRadius: 6,
        }],
      },
      options: {
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
      },
    });

    // Volumen por día
    if (data.volumen.labels.length > 0) {
      new Chart(document.getElementById('chart-volumen'), {
        type: 'line',
        data: {
          labels: data.volumen.labels,
          datasets: [{
            label: 'Tickets creados',
            data: data.volumen.data,
            borderColor: '#FFD402',
            backgroundColor: 'rgba(255,212,2,0.12)',
            fill: true,
            tension: 0.3,
            pointBackgroundColor: '#FFD402',
            pointRadius: 4,
          }],
        },
        options: {
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { maxTicksLimit: 10 } },
            y: { beginAtZero: true, ticks: { stepSize: 1 } },
          },
        },
      });
    }
  }
</script>

<!-- KPI cards -->
<div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
  <div class="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm">
    <p class="text-3xl font-bold text-gray-900">{data.total}</p>
    <p class="text-xs text-gray-500 mt-1 font-semibold">Total Tickets</p>
  </div>
  <div class="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm">
    <p class="text-3xl font-bold text-green-600">{data.sla.pct}%</p>
    <p class="text-xs text-gray-500 mt-1 font-semibold">Cumplimiento SLA</p>
    <p class="text-[10px] text-gray-400">{data.sla.cumplidos}/{data.sla.total} resueltos</p>
  </div>
  <div class="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm">
    <p class="text-3xl font-bold text-red-600">{data.vencidos}</p>
    <p class="text-xs text-gray-500 mt-1 font-semibold">Tickets Vencidos</p>
  </div>
  <div class="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm">
    <p class="text-3xl font-bold text-yellow-500">{data.porEstado.en_progreso}</p>
    <p class="text-xs text-gray-500 mt-1 font-semibold">En Progreso</p>
  </div>
</div>

{#if mounted}
<!-- Charts grid -->
<div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
  <div class="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
    <h3 class="text-sm font-bold text-gray-700 mb-4">Tickets por Estado</h3>
    <div class="relative h-48">
      <canvas id="chart-estado"></canvas>
    </div>
  </div>

  <div class="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
    <h3 class="text-sm font-bold text-gray-700 mb-4">Tickets por Prioridad</h3>
    <div class="relative h-48">
      <canvas id="chart-prioridad"></canvas>
    </div>
  </div>

  <div class="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
    <h3 class="text-sm font-bold text-gray-700 mb-4">Tickets por Categoría</h3>
    <div class="relative h-48">
      <canvas id="chart-categoria"></canvas>
    </div>
  </div>

  <div class="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
    <h3 class="text-sm font-bold text-gray-700 mb-4">Volumen — Últimos 30 días</h3>
    <div class="relative h-48">
      {#if data.volumen.labels.length > 0}
        <canvas id="chart-volumen"></canvas>
      {:else}
        <div class="flex items-center justify-center h-full text-gray-300 text-sm">Sin datos suficientes</div>
      {/if}
    </div>
  </div>
</div>
{:else}
  <div class="flex items-center justify-center py-20 text-gray-300">
    <i class="fas fa-spinner fa-spin text-2xl mr-3"></i>
    <span class="text-sm text-gray-400">Cargando gráficas...</span>
  </div>
{/if}
