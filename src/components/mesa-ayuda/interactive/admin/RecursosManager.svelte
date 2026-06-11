<script lang="ts">
  import { onMount } from 'svelte';

  interface Recurso {
    id: string; nombre: string; tipo: string; descripcion: string | null; activo: boolean;
    notificar_usuario_id: string | null;
    notificar_usuarios_ids: string[] | null;
    responsable: { id: string; nombre: string; correo: string } | null;
    responsables: Array<{ id: string; nombre: string; correo: string }>;
  }
  interface Usuario { id: string; nombre: string; correo: string; rol: string; }

  let recursos: Recurso[] = [];
  let usuarios: Usuario[] = [];
  let cargando = true;
  let guardando = false;
  let exito = '';
  let error = '';
  let modalAbierto = false;
  let editando: Recurso | null = null;
  let form = { nombre: '', tipo: 'equipo', descripcion: '', notificar_usuarios_ids: [] as string[] };

  async function cargar() {
    cargando = true;
    const [rRes, uRes] = await Promise.all([
      fetch('/api/mesa-ayuda/recursos'),
      fetch('/api/mesa-ayuda/usuarios'),
    ]);
    if (rRes.ok) recursos = await rRes.json();
    if (uRes.ok) usuarios = await uRes.json();
    cargando = false;
  }

  onMount(cargar);

  function abrirCrear() {
    editando = null;
    form = { nombre: '', tipo: 'equipo', descripcion: '', notificar_usuarios_ids: [] };
    modalAbierto = true;
  }

  function abrirEditar(r: Recurso) {
    editando = r;
    form = {
      nombre: r.nombre,
      tipo: r.tipo,
      descripcion: r.descripcion ?? '',
      notificar_usuarios_ids: r.notificar_usuarios_ids || (r.notificar_usuario_id ? [r.notificar_usuario_id] : []),
    };
    modalAbierto = true;
  }

  async function guardar() {
    if (guardando) return;
    error = '';
    guardando = true;
    try {
      const url    = editando ? `/api/mesa-ayuda/recursos/${editando.id}` : '/api/mesa-ayuda/recursos';
      const method = editando ? 'PATCH' : 'POST';
      const payload = {
        nombre: form.nombre,
        tipo: form.tipo,
        descripcion: form.descripcion || null,
        notificar_usuarios_ids: form.notificar_usuarios_ids,
      };
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) {
        modalAbierto = false;
        exito = 'Recurso guardado';
        setTimeout(() => exito = '', 3000);
        await cargar();
      } else {
        const d = await res.json();
        error = d.error || 'Error al guardar';
      }
    } catch (err: any) {
      error = err.message || 'Error al guardar';
    } finally {
      guardando = false;
    }
  }

  async function eliminar(id: string) {
    if (!confirm('¿Desactivar este recurso?')) return;
    const res = await fetch(`/api/mesa-ayuda/recursos/${id}`, { method: 'DELETE' });
    if (res.ok) { exito = 'Recurso desactivado'; setTimeout(() => exito = '', 3000); await cargar(); }
    else { const d = await res.json(); alert(d.error || 'Error'); }
  }

  const tipoLabel: Record<string, string> = { equipo: 'Equipo', espacio: 'Espacio', otro: 'Otro' };
</script>

<div>
  <div class="flex justify-between items-center mb-4">
    <div>
      <h2 class="text-lg font-bold text-gray-800" style="font-family:'Montserrat',sans-serif;">Recursos para Reservas</h2>
      <p class="text-sm text-gray-500">Configura los recursos disponibles y su responsable de aprobación.</p>
    </div>
    <button on:click={abrirCrear} class="px-4 py-2 rounded-xl font-bold text-sm" style="background:#FFD402;">
      <i class="fas fa-plus mr-1"></i> Nuevo Recurso
    </button>
  </div>

  {#if exito}
    <div class="mb-4 p-3 bg-green-50 text-green-700 border border-green-200 rounded-xl text-sm font-bold">
      <i class="fas fa-check-circle mr-1"></i>{exito}
    </div>
  {/if}

  <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
    {#if cargando}
      <div class="p-8 text-center text-gray-400"><i class="fas fa-spinner fa-spin text-2xl"></i></div>
    {:else}
      <table class="w-full text-sm">
        <thead class="bg-gray-50 text-xs uppercase text-gray-500">
          <tr>
            <th class="px-4 py-3 text-left">Nombre</th>
            <th class="px-4 py-3 text-left">Tipo</th>
            <th class="px-4 py-3 text-left">Responsable de notificación</th>
            <th class="px-4 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
          {#each recursos as r}
            <tr class="hover:bg-gray-50">
              <td class="px-4 py-3 font-semibold">{r.nombre}
                {#if r.descripcion}<p class="text-xs text-gray-400 font-normal">{r.descripcion}</p>{/if}
              </td>
              <td class="px-4 py-3">
                <span class="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-bold">{tipoLabel[r.tipo] ?? r.tipo}</span>
              </td>
              <td class="px-4 py-3">
                {#if r.responsables && r.responsables.length > 0}
                  <div class="flex flex-wrap gap-1.5 max-w-xs">
                    {#each r.responsables as resp}
                      <span class="inline-flex items-center gap-1 bg-blue-50 border border-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-lg font-medium" title={resp.correo}>
                        <span class="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-bold">
                          {resp.nombre.charAt(0)}
                        </span>
                        {resp.nombre}
                      </span>
                    {/each}
                  </div>
                {:else if r.responsable}
                  <div class="flex items-center gap-2">
                    <div class="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                      {r.responsable.nombre.charAt(0)}
                    </div>
                    <div>
                      <p class="text-sm font-semibold text-gray-700">{r.responsable.nombre}</p>
                      <p class="text-xs text-gray-400">{r.responsable.correo}</p>
                    </div>
                  </div>
                {:else}
                  <span class="text-xs text-gray-400 italic">Todos los admin/agentes</span>
                {/if}
              </td>
              <td class="px-4 py-3">
                <div class="flex justify-end gap-1">
                  <button on:click={() => abrirEditar(r)} class="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"><i class="fas fa-pen text-xs"></i></button>
                  <button on:click={() => eliminar(r.id)} class="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"><i class="fas fa-trash text-xs"></i></button>
                </div>
              </td>
            </tr>
          {/each}
          {#if recursos.length === 0}
            <tr><td colspan="4" class="p-8 text-center text-gray-400">No hay recursos configurados</td></tr>
          {/if}
        </tbody>
      </table>
    {/if}
  </div>

  {#if modalAbierto}
    <div class="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <h3 class="text-lg font-bold mb-4" style="font-family:'Montserrat',sans-serif;">{editando ? 'Editar Recurso' : 'Nuevo Recurso'}</h3>
        {#if error}<div class="mb-3 p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200">{error}</div>{/if}

        <form on:submit|preventDefault={guardar} class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-gray-600 uppercase mb-1">Nombre *</label>
            <input bind:value={form.nombre} required class="w-full p-2.5 border rounded-xl text-sm" placeholder="Ej: Proyector Epson" />
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-600 uppercase mb-1">Tipo</label>
            <select bind:value={form.tipo} class="w-full p-2.5 border rounded-xl bg-white text-sm">
              <option value="equipo">Equipo</option>
              <option value="espacio">Espacio</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-600 uppercase mb-1">Descripción</label>
            <textarea bind:value={form.descripcion} rows="2" class="w-full p-2.5 border rounded-xl resize-none text-sm" placeholder="Descripción breve..."></textarea>
          </div>

          <!-- Responsables de notificación -->
          <div class="border-t border-gray-100 pt-4">
            <label class="block text-xs font-bold text-gray-600 uppercase mb-1">
              Responsables de notificación
              <span class="font-normal normal-case text-gray-400 ml-1">(recibirán los avisos de solicitud)</span>
            </label>
            <div class="max-h-40 overflow-y-auto border border-gray-200 rounded-xl p-3 space-y-2 bg-gray-50/50">
              {#each usuarios as u}
                <label class="flex items-center gap-2 text-xs text-gray-700 cursor-pointer hover:bg-gray-100 p-1.5 rounded transition-colors">
                  <input type="checkbox" 
                         value={u.id} 
                         checked={form.notificar_usuarios_ids.includes(u.id)}
                         on:change={(e) => {
                           if (e.currentTarget.checked) {
                             form.notificar_usuarios_ids = [...form.notificar_usuarios_ids, u.id];
                           } else {
                             form.notificar_usuarios_ids = form.notificar_usuarios_ids.filter(id => id !== u.id);
                           }
                         }}
                         class="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4" />
                  <div class="flex flex-col">
                    <span class="font-bold">{u.nombre}</span>
                    <span class="text-[10px] text-gray-400">{u.correo}</span>
                  </div>
                </label>
              {/each}
              {#if usuarios.length === 0}
                <p class="text-xs text-gray-400 italic text-center py-2">No hay usuarios cargados</p>
              {/if}
            </div>
            <p class="text-xs text-gray-400 mt-1">Si no seleccionas a nadie, la notificación llegará a todos los admins y agentes.</p>
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <button type="button" on:click={() => modalAbierto = false} class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl text-sm">Cancelar</button>
            <button type="submit" disabled={guardando} class="px-4 py-2 font-bold rounded-xl text-sm disabled:opacity-50" style="background:#FFD402;">
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  {/if}
</div>
