<script lang="ts">
  import { onMount, tick } from 'svelte';

  export let data: {
    total: number;
    eficaciaPct: number;
    vencidos: number;
    reformulados: number;
    porTipo: { correctiva: number; mejora: number; riesgo: number; producto_no_conforme: number };
    porEstado: {
      abierto: number;
      en_tratamiento: number;
      en_analisis: number;
      en_plan_accion: number;
      en_evaluacion: number;
      cerrado_eficaz: number;
      cerrado_no_eficaz: number;
      reformulado: number;
    };
    porProceso: Array<{ id: string; nombre: string; count: number }>;
  };

  let Chart: any;
  let mounted = false;

  onMount(async () => {
    const mod = await import('chart.js/auto');
    Chart = mod.default;
    mounted = true;
    await tick();
    initCharts();
  });

  function initCharts() {
    // Tipo chart
    const elTipo = document.getElementById('chart-mejora-tipo');
    if (elTipo) {
      new Chart(elTipo, {
        type: 'doughnut',
        data: {
          labels: ['No conformidad Mayor', 'No conformidad Menor', 'Oportunidad de Mejora', 'Producto no Conforme'],
          datasets: [{
            data: [
              (data.porTipo as any).no_conformidad_mayor ?? (data.porTipo as any).correctiva ?? 0,
              (data.porTipo as any).no_conformidad_menor ?? 0,
              (data.porTipo as any).oportunidad_mejora ?? (data.porTipo as any).mejora ?? 0,
              (data.porTipo as any).producto_no_conforme ?? 0
            ],
            backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6', '#a855f7'],
            borderWidth: 0,
          }],
        },
        options: { plugins: { legend: { position: 'bottom' } }, cutout: '65%' },
      });
    }

    // Estado chart
    const elEstado = document.getElementById('chart-mejora-estado');
    if (elEstado) {
      new Chart(elEstado, {
        type: 'bar',
        data: {
          labels: ['Abierto', 'Tratamiento', 'Análisis', 'Plan Acción', 'Evaluación', 'Cerrado Eficaz', 'Cerrado Ineficaz'],
          datasets: [{
            label: 'Hallazgos',
            data: [
              data.porEstado.abierto || 0,
              data.porEstado.en_tratamiento || 0,
              data.porEstado.en_analisis || 0,
              data.porEstado.en_plan_accion || 0,
              data.porEstado.en_evaluacion || 0,
              data.porEstado.cerrado_eficaz || 0,
              data.porEstado.cerrado_no_eficaz || 0
            ],
            backgroundColor: ['#3b82f6', '#f59e0b', '#6366f1', '#06b6d4', '#a855f7', '#22c55e', '#ef4444'],
            borderRadius: 6,
          }],
        },
        options: {
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
        },
      });
    }

    // Proceso chart
    const elProceso = document.getElementById('chart-mejora-proceso');
    if (elProceso && data.porProceso && data.porProceso.length > 0) {
      new Chart(elProceso, {
        type: 'bar',
        data: {
          labels: data.porProceso.map(p => p.nombre.length > 20 ? p.nombre.slice(0, 20) + '...' : p.nombre),
          datasets: [{
            label: 'Hallazgos por proceso',
            data: data.porProceso.map(p => p.count),
            backgroundColor: '#3359A4',
            borderRadius: 6,
          }],
        },
        options: {
          indexAxis: 'y',
          plugins: { legend: { display: false } },
          scales: { x: { beginAtZero: true, ticks: { stepSize: 1 } } },
        },
      });
    }
  }
</script>

<!-- KPI Cards Grid -->
<div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
  <div class="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Hallazgos</p>
        <p class="text-3xl font-bold text-gray-900 mt-1 font-['Montserrat']">{data.total}</p>
      </div>
      <div class="w-12 h-12 rounded-xl bg-blue-50 text-[#3359A4] flex items-center justify-center text-xl">
        <i class="fas fa-search"></i>
      </div>
    </div>
  </div>

  <div class="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-xs font-bold text-gray-400 uppercase tracking-wider">Tasa de Eficacia</p>
        <p class="text-3xl font-bold text-green-600 mt-1 font-['Montserrat']">{data.eficaciaPct}%</p>
      </div>
      <div class="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center text-xl">
        <i class="fas fa-check-double"></i>
      </div>
    </div>
  </div>

  <div class="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-xs font-bold text-gray-400 uppercase tracking-wider">Vencidos / En Riesgo</p>
        <p class="text-3xl font-bold text-red-600 mt-1 font-['Montserrat']">{data.vencidos}</p>
      </div>
      <div class="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center text-xl">
        <i class="fas fa-exclamation-triangle"></i>
      </div>
    </div>
  </div>

  <div class="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-xs font-bold text-gray-400 uppercase tracking-wider">Reformulados</p>
        <p class="text-3xl font-bold text-orange-500 mt-1 font-['Montserrat']">{data.reformulados}</p>
      </div>
      <div class="w-12 h-12 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center text-xl">
        <i class="fas fa-redo-alt"></i>
      </div>
    </div>
  </div>
</div>

{#if mounted}
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
    <div class="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <h3 class="text-sm font-bold text-gray-800 font-['Montserrat'] mb-4">Clasificación por Tipo de Hallazgo</h3>
      <div class="relative h-56">
        <canvas id="chart-mejora-tipo"></canvas>
      </div>
    </div>

    <div class="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <h3 class="text-sm font-bold text-gray-800 font-['Montserrat'] mb-4">Distribución por Etapa / Estado</h3>
      <div class="relative h-56">
        <canvas id="chart-mejora-estado"></canvas>
      </div>
    </div>

    <div class="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <h3 class="text-sm font-bold text-gray-800 font-['Montserrat'] mb-4">Hallazgos por Proceso del SGC</h3>
      <div class="relative h-64">
        {#if data.porProceso && data.porProceso.length > 0}
          <canvas id="chart-mejora-proceso"></canvas>
        {:else}
          <div class="flex items-center justify-center h-full text-gray-400 text-xs italic">No hay hallazgos registrados por proceso aún.</div>
        {/if}
      </div>
    </div>
  </div>
{:else}
  <div class="flex items-center justify-center py-20 text-gray-400">
    <i class="fas fa-spinner fa-spin text-2xl mr-3"></i>
    <span class="text-sm">Cargando tablero de indicadores...</span>
  </div>
{/if}
