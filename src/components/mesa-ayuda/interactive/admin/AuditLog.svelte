<script lang="ts">
  import { onMount } from 'svelte';

  interface Log {
    id: string;
    admin_nombre: string;
    accion: string;
    detalle: string | null;
    created_at: string;
  }

  let logs: Log[] = [];
  let cargando = true;

  async function cargar() {
    cargando = true;
    const res = await fetch('/api/mesa-ayuda/audit');
    if (res.ok) logs = await res.json();
    cargando = false;
  }

  onMount(cargar);

  function formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleString('es-CO', { 
      timeZone: 'America/Bogota',
      year: 'numeric', month: '2-digit', day: '2-digit', 
      hour: '2-digit', minute: '2-digit' 
    });
  }
</script>

<div>
  <div class="flex justify-between items-center mb-4">
    <div>
      <h2 class="text-lg font-bold text-gray-800" style="font-family: 'Montserrat', sans-serif;">Registro de Auditoría</h2>
      <p class="text-sm text-gray-500">Últimas 200 acciones críticas realizadas en el sistema.</p>
    </div>
    <button on:click={cargar} class="p-2 text-gray-400 hover:text-blue-600 rounded bg-white shadow-sm border border-gray-200">
      <i class="fas fa-sync-alt" class:fa-spin={cargando}></i>
    </button>
  </div>

  <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
    {#if cargando}
      <div class="p-8 text-center text-gray-400"><i class="fas fa-spinner fa-spin text-2xl"></i></div>
    {:else}
      <table class="w-full text-sm text-left">
        <thead class="bg-gray-50 text-xs uppercase text-gray-500">
          <tr>
            <th class="px-4 py-3">Fecha y Hora</th>
            <th class="px-4 py-3">Administrador</th>
            <th class="px-4 py-3">Acción</th>
            <th class="px-4 py-3">Detalle</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
          {#each logs as log}
            <tr class="hover:bg-gray-50">
              <td class="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(log.created_at)}</td>
              <td class="px-4 py-3 font-medium text-gray-800">{log.admin_nombre}</td>
              <td class="px-4 py-3"><span class="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-bold">{log.accion}</span></td>
              <td class="px-4 py-3 text-gray-600 max-w-md truncate" title={log.detalle ?? ''}>{log.detalle || '-'}</td>
            </tr>
          {/each}
          {#if logs.length === 0}
            <tr><td colspan="4" class="p-8 text-center text-gray-400">No hay registros de auditoría</td></tr>
          {/if}
        </tbody>
      </table>
    {/if}
  </div>
</div>
