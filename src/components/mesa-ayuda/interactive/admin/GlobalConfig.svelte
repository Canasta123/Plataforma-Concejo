<script lang="ts">
  import { onMount } from 'svelte';

  let form = {
    banner_activo: 'false',
    banner_tipo: 'info',
    banner_mensaje: ''
  };

  let cargando = true;
  let guardando = false;
  let exito = '';
  let error = '';

  async function cargar() {
    cargando = true;
    const res = await fetch('/api/mesa-ayuda/config/global');
    if (res.ok) {
      const data = await res.json();
      if (data.banner_activo !== undefined) form.banner_activo = data.banner_activo;
      if (data.banner_tipo !== undefined) form.banner_tipo = data.banner_tipo;
      if (data.banner_mensaje !== undefined) form.banner_mensaje = data.banner_mensaje;
    }
    cargando = false;
  }

  onMount(cargar);

  async function guardar() {
    if (guardando) return;
    guardando = true;
    error = '';
    exito = '';

    const res = await fetch('/api/mesa-ayuda/config/global', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });

    if (res.ok) {
      exito = 'Configuración guardada correctamente.';
      setTimeout(() => exito = '', 3000);
      
      // Loggear la acción de auditoría
      fetch('/api/mesa-ayuda/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: 'UPDATE_CONFIG', detalle: 'Actualizó mensaje global' })
      });
    } else {
      error = 'Error al guardar la configuración.';
    }
    guardando = false;
  }
</script>

<div>
  <div class="mb-4">
    <h2 class="text-lg font-bold text-gray-800" style="font-family: 'Montserrat', sans-serif;">Mensaje Global (Banner)</h2>
    <p class="text-sm text-gray-500">Muestra una alerta en la parte superior del Dashboard de todos los usuarios de la Mesa de Ayuda.</p>
  </div>

  {#if cargando}
    <div class="p-8 text-center text-gray-400"><i class="fas fa-spinner fa-spin text-2xl"></i></div>
  {:else}
    <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-6 max-w-2xl">
      {#if exito}
        <div class="mb-4 p-3 bg-green-50 text-green-700 border border-green-200 rounded-xl text-sm font-bold">
          <i class="fas fa-check-circle"></i> {exito}
        </div>
      {/if}
      {#if error}
        <div class="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm">
          <i class="fas fa-exclamation-circle"></i> {error}
        </div>
      {/if}

      <form on:submit|preventDefault={guardar} class="space-y-4">
        <div>
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.banner_activo === 'true'} on:change={(e) => form.banner_activo = e.currentTarget.checked ? 'true' : 'false'} class="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
            <span class="text-sm font-bold text-gray-700">Activar mensaje global</span>
          </label>
        </div>

        <div>
          <label class="block text-xs font-bold text-gray-600 uppercase mb-1">Tipo de alerta</label>
          <select bind:value={form.banner_tipo} class="w-full p-2 border border-gray-200 rounded-xl text-sm bg-white">
            <option value="info">Información (Azul)</option>
            <option value="warning">Advertencia (Amarillo)</option>
            <option value="danger">Crítico (Rojo)</option>
            <option value="success">Éxito (Verde)</option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-bold text-gray-600 uppercase mb-1">Mensaje</label>
          <textarea bind:value={form.banner_mensaje} rows="3" required={form.banner_activo === 'true'} placeholder="Ej: El viernes habrá mantenimiento de servidores de 2pm a 4pm..." class="w-full p-3 border border-gray-200 rounded-xl text-sm"></textarea>
        </div>

        <!-- Vista previa -->
        {#if form.banner_activo === 'true' && form.banner_mensaje}
          <div class="mt-4 border-t pt-4">
            <p class="text-xs font-bold text-gray-500 uppercase mb-2">Vista previa:</p>
            <div class={`p-3 rounded-lg text-sm flex gap-2 items-start ${
              form.banner_tipo === 'info' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
              form.banner_tipo === 'warning' ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' :
              form.banner_tipo === 'danger' ? 'bg-red-50 text-red-800 border border-red-200' :
              'bg-green-50 text-green-800 border border-green-200'
            }`}>
              <i class={`fas mt-0.5 ${
                form.banner_tipo === 'info' ? 'fa-info-circle' :
                form.banner_tipo === 'warning' ? 'fa-exclamation-triangle' :
                form.banner_tipo === 'danger' ? 'fa-times-circle' : 'fa-check-circle'
              }`}></i>
              <span>{form.banner_mensaje}</span>
            </div>
          </div>
        {/if}

        <div class="pt-4">
          <button type="submit" disabled={guardando} class="px-6 py-2 bg-[#FFD402] text-gray-900 rounded-xl font-bold text-sm hover:bg-[#efc200] disabled:opacity-50">
            {guardando ? 'Guardando...' : 'Guardar Configuración'}
          </button>
        </div>
      </form>
    </div>
  {/if}
</div>
