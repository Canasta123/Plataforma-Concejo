<script lang="ts">
  import { onMount } from 'svelte';

  interface KbArticle {
    id: string;
    titulo: string;
    categoria: string;
    resumen: string;
    contenido: string;
    tags: string[];
    created_at: string;
  }

  let articulos: KbArticle[] = [];
  let cargando = true;
  let guardando = false;
  let exito = '';
  let error = '';

  let modalAbierto = false;
  let editando: KbArticle | null = null;
  
  let form = {
    titulo: '',
    categoria: 'software',
    resumen: '',
    contenido: '',
    tagsString: ''
  };

  async function cargar() {
    cargando = true;
    const res = await fetch('/api/mesa-ayuda/kb');
    if (res.ok) articulos = await res.json();
    cargando = false;
  }

  onMount(cargar);

  function abrirCrear() {
    editando = null;
    form = { titulo: '', categoria: 'software', resumen: '', contenido: '', tagsString: '' };
    modalAbierto = true;
  }

  function abrirEditar(a: KbArticle) {
    editando = a;
    form = { 
      titulo: a.titulo, 
      categoria: a.categoria, 
      resumen: a.resumen, 
      contenido: a.contenido, 
      tagsString: a.tags.join(', ') 
    };
    modalAbierto = true;
  }

  async function guardar() {
    if (guardando) return;
    error = '';
    guardando = true;
    try {
      const body = {
        titulo: form.titulo,
        categoria: form.categoria,
        resumen: form.resumen,
        contenido: form.contenido,
        tags: form.tagsString.split(',').map(t => t.trim()).filter(t => t)
      };

      const url = editando ? `/api/mesa-ayuda/kb/${editando.id}` : '/api/mesa-ayuda/kb';
      const method = editando ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        modalAbierto = false;
        exito = 'Artículo guardado con éxito';
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
    if (!confirm('¿Seguro que deseas eliminar este artículo de la base de conocimiento?')) return;
    
    const res = await fetch(`/api/mesa-ayuda/kb/${id}`, { method: 'DELETE' });
    if (res.ok) {
      exito = 'Artículo eliminado';
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
    <div>
      <h2 class="text-lg font-bold text-gray-800" style="font-family: 'Montserrat', sans-serif;">Base de Conocimiento</h2>
      <p class="text-sm text-gray-500">Gestiona los artículos de ayuda para los usuarios (FAQs).</p>
    </div>
    <button on:click={abrirCrear} class="px-4 py-2 bg-[#FFD402] text-gray-900 rounded-xl font-bold text-sm hover:bg-[#efc200] transition-colors">
      <i class="fas fa-plus"></i> Nuevo Artículo
    </button>
  </div>

  {#if exito}
    <div class="mb-4 p-3 bg-green-50 text-green-700 border border-green-200 rounded-xl text-sm font-bold">
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
            <th class="px-4 py-3">Título</th>
            <th class="px-4 py-3">Categoría</th>
            <th class="px-4 py-3">Resumen</th>
            <th class="px-4 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
          {#each articulos as a}
            <tr class="hover:bg-gray-50">
              <td class="px-4 py-3 font-semibold text-gray-800">{a.titulo}</td>
              <td class="px-4 py-3"><span class="bg-gray-100 px-2 py-1 rounded text-xs">{a.categoria}</span></td>
              <td class="px-4 py-3 text-gray-500 max-w-xs truncate" title={a.resumen}>{a.resumen}</td>
              <td class="px-4 py-3 flex justify-end gap-2">
                <button on:click={() => abrirEditar(a)} class="p-2 text-gray-400 hover:text-blue-600 rounded"><i class="fas fa-pen"></i></button>
                <button on:click={() => eliminar(a.id)} class="p-2 text-gray-400 hover:text-red-600 rounded"><i class="fas fa-trash"></i></button>
              </td>
            </tr>
          {/each}
          {#if articulos.length === 0}
            <tr><td colspan="4" class="p-8 text-center text-gray-400">No hay artículos en la base de conocimiento</td></tr>
          {/if}
        </tbody>
      </table>
    {/if}
  </div>

  {#if modalAbierto}
    <div class="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div class="bg-white rounded-2xl w-full max-w-3xl p-6 my-8">
        <h3 class="text-lg font-bold mb-4">{editando ? 'Editar Artículo' : 'Nuevo Artículo'}</h3>
        
        {#if error}
          <div class="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200">{error}</div>
        {/if}

        <form on:submit|preventDefault={guardar} class="space-y-4">
          <div class="grid grid-cols-3 gap-4">
            <div class="col-span-2">
              <label class="block text-xs font-bold text-gray-600 uppercase mb-1">Título</label>
              <input bind:value={form.titulo} required class="w-full p-2 border rounded-xl" />
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-600 uppercase mb-1">Categoría</label>
              <select bind:value={form.categoria} required class="w-full p-2 border rounded-xl bg-white">
                <option value="software">Software</option>
                <option value="hardware">Hardware</option>
                <option value="redes">Redes</option>
                <option value="otro">Otro</option>
              </select>
            </div>
          </div>
          
          <div>
            <label class="block text-xs font-bold text-gray-600 uppercase mb-1">Tags (separados por coma)</label>
            <input bind:value={form.tagsString} class="w-full p-2 border rounded-xl" placeholder="ej: impresora, papel, tinta" />
          </div>

          <div>
            <label class="block text-xs font-bold text-gray-600 uppercase mb-1">Resumen Corto</label>
            <textarea bind:value={form.resumen} required rows="2" class="w-full p-2 border rounded-xl" placeholder="Resumen visible en la tarjeta..."></textarea>
          </div>

          <div>
            <label class="block text-xs font-bold text-gray-600 uppercase mb-1">Contenido (Soporta Markdown/HTML básico)</label>
            <textarea bind:value={form.contenido} required rows="8" class="w-full p-2 border rounded-xl font-mono text-sm" placeholder="Contenido detallado paso a paso..."></textarea>
          </div>

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
