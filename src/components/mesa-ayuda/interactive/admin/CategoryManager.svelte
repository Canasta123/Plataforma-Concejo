<script lang="ts">
  import { onMount } from 'svelte';

  interface Categoria {
    id: string;
    nombre: string;
    sla_horas_alta: number;
    sla_horas_media: number;
    sla_horas_baja: number;
  }

  let categorias: Categoria[] = [];
  let cargando = true;
  let guardando = false;
  let error = '';
  let exito = '';

  let modalAbierto = false;
  let editando: Categoria | null = null;
  let form = { nombre: '', sla_horas_alta: 4, sla_horas_media: 8, sla_horas_baja: 24 };

  async function cargar() {
    cargando = true;
    const res = await fetch('/api/mesa-ayuda/categorias');
    if (res.ok) categorias = await res.json();
    else error = 'Error al cargar categorías';
    cargando = false;
  }

  onMount(cargar);

  function abrirCrear() {
    editando = null;
    form = { nombre: '', sla_horas_alta: 4, sla_horas_media: 8, sla_horas_baja: 24 };
    modalAbierto = true;
  }

  function abrirEditar(c: Categoria) {
    editando = c;
    form = { ...c };
    modalAbierto = true;
  }

  async function guardar() {
    if (guardando) return;
    error = '';
    guardando = true;
    try {
      const url = editando ? `/api/mesa-ayuda/categorias/${editando.id}` : '/api/mesa-ayuda/categorias';
      const method = editando ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      if (res.ok) {
        modalAbierto = false;
        exito = 'Categoría guardada con éxito';
        setTimeout(() => exito = '', 3000);
        await cargar();
      } else {
        const data = await res.json();
        error = data.error || 'Error al guardar';
      }
    } catch (err: any) {
      error = err.message || 'Error al guardar';
    } finally {
      guardando = false;
    }
  }

  async function eliminar(id: string) {
    if (!confirm('¿Seguro que deseas eliminar esta categoría? Si hay tickets asignados a ella, la operación fallará.')) return;
    
    const res = await fetch(`/api/mesa-ayuda/categorias/${id}`, { method: 'DELETE' });
    if (res.ok) {
      exito = 'Categoría eliminada';
      setTimeout(() => exito = '', 3000);
      await cargar();
    } else {
      const data = await res.json();
      alert(data.error || 'Error al eliminar');
    }
  }
</script>

<div>
  <div class="flex justify-between items-center mb-4">
    <h2 class="text-lg font-bold text-gray-800" style="font-family: 'Montserrat', sans-serif;">Categorías y SLAs</h2>
    <button on:click={abrirCrear} class="px-4 py-2 bg-[#FFD402] text-gray-900 rounded-xl font-bold text-sm hover:bg-[#efc200] transition-colors">
      <i class="fas fa-plus"></i> Nueva Categoría
    </button>
  </div>

  {#if exito}
    <div class="mb-4 p-3 bg-green-50 text-green-700 border border-green-200 rounded-xl text-sm">
      <i class="fas fa-check-circle"></i> {exito}
    </div>
  {/if}

  <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
    {#if cargando}
      <div class="p-8 text-center text-gray-400"><i class="fas fa-spinner fa-spin text-2xl"></i></div>
    {:else}
      <table class="w-full text-sm text-left">
        <thead class="bg-gray-50 text-xs uppercase text-gray-500">
          <tr>
            <th class="px-4 py-3">Nombre</th>
            <th class="px-4 py-3 text-center">SLA Alta (h)</th>
            <th class="px-4 py-3 text-center">SLA Media (h)</th>
            <th class="px-4 py-3 text-center">SLA Baja (h)</th>
            <th class="px-4 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
          {#each categorias as c}
            <tr class="hover:bg-gray-50">
              <td class="px-4 py-3 font-semibold">{c.nombre}</td>
              <td class="px-4 py-3 text-center">{c.sla_horas_alta}</td>
              <td class="px-4 py-3 text-center">{c.sla_horas_media}</td>
              <td class="px-4 py-3 text-center">{c.sla_horas_baja}</td>
              <td class="px-4 py-3 flex justify-end gap-2">
                <button on:click={() => abrirEditar(c)} class="p-2 text-gray-400 hover:text-blue-600 rounded"><i class="fas fa-pen"></i></button>
                <button on:click={() => eliminar(c.id)} class="p-2 text-gray-400 hover:text-red-600 rounded"><i class="fas fa-trash"></i></button>
              </td>
            </tr>
          {/each}
          {#if categorias.length === 0}
            <tr><td colspan="5" class="p-8 text-center text-gray-400">No hay categorías configuradas</td></tr>
          {/if}
        </tbody>
      </table>
    {/if}
  </div>

  {#if modalAbierto}
    <div class="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-2xl w-full max-w-md p-6">
        <h3 class="text-lg font-bold mb-4">{editando ? 'Editar Categoría' : 'Nueva Categoría'}</h3>
        
        {#if error}
          <div class="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200">{error}</div>
        {/if}

        <form on:submit|preventDefault={guardar} class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-gray-600 uppercase mb-1">Nombre de la categoría</label>
            <input bind:value={form.nombre} required class="w-full p-2 border rounded-xl" placeholder="Ej: Hardware" />
          </div>
          
          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="block text-xs font-bold text-gray-600 uppercase mb-1">SLA Alta</label>
              <input type="number" bind:value={form.sla_horas_alta} required class="w-full p-2 border rounded-xl" />
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-600 uppercase mb-1">SLA Media</label>
              <input type="number" bind:value={form.sla_horas_media} required class="w-full p-2 border rounded-xl" />
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-600 uppercase mb-1">SLA Baja</label>
              <input type="number" bind:value={form.sla_horas_baja} required class="w-full p-2 border rounded-xl" />
            </div>
          </div>
          <p class="text-xs text-gray-400">Los tiempos SLA se expresan en horas.</p>

          <div class="flex justify-end gap-2 pt-4">
            <button type="button" on:click={() => modalAbierto = false} class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl">Cancelar</button>
            <button type="submit" disabled={guardando} class="px-4 py-2 bg-[#FFD402] font-bold rounded-xl hover:bg-[#efc200] disabled:opacity-50">
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  {/if}
</div>
