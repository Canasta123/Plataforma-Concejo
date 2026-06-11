<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { Chart as ChartType } from 'chart.js';

  let canvas: HTMLCanvasElement;
  let chart: ChartType | undefined;

  onMount(async () => {
    const { Chart, registerables } = await import('chart.js');
    Chart.register(...registerables);

    chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: [
          'P1. Direccionamiento',
          'P2. Gestión Calidad',
          'P3. Relacionamiento',
          'P4. Control Político',
          'P5. Proyectos Acuerdo',
          'P6. Jurídica/Contractual',
          'P7. Gestión Doc. y TI',
          'P8. G. Administrativa',
          'P9. Evaluación Indep.',
        ],
        datasets: [{
          label: 'Cantidad de Formatos',
          data: [25, 15, 10, 8, 12, 22, 28, 45, 10],
          backgroundColor: [
            '#0384BA', '#0384BA', '#0384BA',
            '#009741', '#009741',
            '#FFD402', '#FFD402', '#FFD402',
            '#E30D21',
          ],
          borderColor: 'transparent',
          borderWidth: 0,
          borderRadius: 4,
          barPercentage: 0.6,
          categoryPercentage: 0.8,
        }],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(26,46,90,0.9)',
            titleFont: { family: "'Montserrat', sans-serif", size: 13 },
            bodyFont: { family: "'Lato', sans-serif", size: 12 },
            padding: 10,
            cornerRadius: 8,
            displayColors: false,
          },
        },
        scales: {
          x: {
            grid: { color: '#f3f4f6' },
            ticks: { font: { family: "'Lato', sans-serif", size: 10 }, color: '#9ca3af' },
            border: { display: false },
          },
          y: {
            grid: { display: false },
            ticks: { font: { family: "'Montserrat', sans-serif", weight: 600, size: 11 }, color: '#4b5563' },
            border: { display: false },
          },
        },
        animation: { duration: 1500, easing: 'easeOutQuart' },
      },
    });
  });

  onDestroy(() => chart?.destroy());
</script>

<canvas bind:this={canvas}></canvas>
