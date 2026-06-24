<script lang="ts">
  type Rol = 'admin' | 'solicitante' | 'agente' | 'auditor';

  interface Usuario {
    id: string;
    nombre: string;
    correo: string;
    rol: Rol;
    cargo: string;
    activo: boolean;
    correo_notificacion?: string | null;
    created_at: string;
    induccion_completada?: boolean;
    induccion_habilitada?: boolean;
    induccion_valoracion_sgc?: number | null;
    induccion_valoracion_mesa?: number | null;
    acceso_evidencias?: boolean;
  }

  export let usuarios: Usuario[] = [];
  export let adminId: string = '';

  const rolConfig: Record<Rol, { label: string; cls: string }> = {
    admin:       { label: 'Admin',       cls: 'bg-red-100 text-red-700' },
    agente:      { label: 'Agente',      cls: 'bg-blue-100 text-blue-700' },
    auditor:     { label: 'Auditor',     cls: 'bg-purple-100 text-purple-700' },
    solicitante: { label: 'Solicitante', cls: 'bg-green-100 text-green-700' },
  };

  let lista: Usuario[] = [...usuarios];
  let busqueda = '';
  let filtroRol: Rol | 'todos' = 'todos';
  let cargando = false;
  let error = '';
  let exito = '';

  let modalAbierto = false;
  let editando: Usuario | null = null;
  let mostrarPassword = false;

  let form = { nombre: '', correo: '', password: '', rol: 'solicitante' as Rol, cargo: '', correo_notificacion: '', acceso_evidencias: true };

  $: filtrados = lista.filter(u => {
    if (filtroRol !== 'todos' && u.rol !== filtroRol) return false;
    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase();
    return u.nombre.toLowerCase().includes(q) || u.correo.toLowerCase().includes(q) || u.cargo.toLowerCase().includes(q);
  });

  function abrirCrear() {
    editando = null;
    form = { nombre: '', correo: '', password: '', rol: 'solicitante', cargo: '', correo_notificacion: '', acceso_evidencias: true };
    mostrarPassword = false;
    error = '';
    modalAbierto = true;
  }

  function abrirEditar(u: Usuario) {
    editando = u;
    form = { nombre: u.nombre, correo: u.correo, password: '', rol: u.rol, cargo: u.cargo, correo_notificacion: u.correo_notificacion ?? '', acceso_evidencias: u.acceso_evidencias ?? false };
    mostrarPassword = false;
    error = '';
    modalAbierto = true;
  }

  function cerrarModal() { modalAbierto = false; editando = null; mostrarPassword = false; error = ''; }

  function mostrarExito(msg: string) {
    exito = msg;
    setTimeout(() => exito = '', 3500);
  }

  async function guardar() {
    if (cargando) return;
    error = '';
    cargando = true;
    try {
      if (editando) {
        const body: Record<string, unknown> = {
          nombre: form.nombre,
          cargo: form.cargo,
          correo_notificacion: form.correo_notificacion || null,
          acceso_evidencias: form.acceso_evidencias,
        };
        if (form.password) body.password = form.password;
        if (editando.id !== adminId) body.rol = form.rol;
        const res = await fetch(`/api/mesa-ayuda/usuarios/${editando.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) { const d = await res.json(); error = d.error ?? 'Error al guardar'; return; }
        const actualizado = await res.json();
        lista = lista.map(u => u.id === actualizado.id ? actualizado : u);
        mostrarExito('Usuario actualizado correctamente.');
      } else {
        if (!form.password) { error = 'La contraseña es obligatoria al crear un usuario.'; return; }
        const res = await fetch('/api/mesa-ayuda/usuarios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, correo_notificacion: form.correo_notificacion || null }),
        });
        if (!res.ok) { const d = await res.json(); error = d.error ?? 'Error al crear'; return; }
        const nuevo = await res.json();
        lista = [nuevo, ...lista];
        mostrarExito('Usuario creado correctamente.');
      }
      cerrarModal();
    } finally {
      cargando = false;
    }
  }

  async function toggleActivo(u: Usuario) {
    if (u.id === adminId) return;
    const res = await fetch(`/api/mesa-ayuda/usuarios/${u.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo: !u.activo }),
    });
    if (res.ok) {
      const actualizado = await res.json();
      lista = lista.map(x => x.id === actualizado.id ? actualizado : x);
      mostrarExito(`Usuario ${actualizado.activo ? 'activado' : 'desactivado'}.`);
    }
  }

  async function toggleInduccionHabilitada(u: Usuario) {
    const res = await fetch(`/api/mesa-ayuda/usuarios/${u.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ induccion_habilitada: !u.induccion_habilitada }),
    });
    if (res.ok) {
      const actualizado = await res.json();
      lista = lista.map(x => x.id === actualizado.id ? actualizado : x);
      mostrarExito(`Inducción ${actualizado.induccion_habilitada ? 'habilitada' : 'deshabilitada'} para ${u.nombre}.`);
    } else {
      const d = await res.json();
      error = d.error ?? 'Error al actualizar estado de inducción';
    }
  }

  async function toggleAccesoEvidencias(u: Usuario) {
    const res = await fetch(`/api/mesa-ayuda/usuarios/${u.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acceso_evidencias: !u.acceso_evidencias }),
    });
    if (res.ok) {
      const actualizado = await res.json();
      lista = lista.map(x => x.id === actualizado.id ? actualizado : x);
      mostrarExito(`Acceso a evidencias ${actualizado.acceso_evidencias ? 'habilitado' : 'deshabilitado'} para ${u.nombre}.`);
    } else {
      const d = await res.json();
      error = d.error ?? 'Error al actualizar acceso a evidencias';
    }
  }

  async function resetPassword(u: Usuario) {
    if (!confirm(`¿Resetear la contraseña de ${u.nombre}? Se enviará una contraseña temporal a su correo.`)) return;
    const res = await fetch(`/api/mesa-ayuda/usuarios/${u.id}/reset-password`, { method: 'POST' });
    if (res.ok) mostrarExito(`Contraseña temporal enviada a ${u.correo_notificacion ?? u.correo}.`);
    else mostrarExito('Error al resetear contraseña. Revisa los logs.');
  }

  async function eliminarUsuario(u: Usuario) {
    if (!confirm(`¿Estás SEGURO de eliminar a ${u.nombre}? Esta acción no se puede deshacer y fallará si el usuario tiene tickets o historial.`)) return;
    const res = await fetch(`/api/mesa-ayuda/usuarios/${u.id}`, { method: 'DELETE' });
    if (res.ok) {
      lista = lista.filter(x => x.id !== u.id);
      mostrarExito('Usuario eliminado correctamente.');
    } else {
      const d = await res.json();
      alert('No se pudo eliminar: ' + (d.error || 'Error desconocido'));
    }
  }
</script>

<!-- Barra de herramientas -->
<div class="flex flex-col sm:flex-row gap-3 mb-5 items-start sm:items-center justify-between">
  <div class="flex gap-2 flex-wrap flex-1">
    <div class="relative flex-1 min-w-48">
      <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
      <input
        type="text"
        bind:value={busqueda}
        placeholder="Buscar por nombre, correo o cargo..."
        class="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
      />
    </div>
    <select
      bind:value={filtroRol}
      class="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
    >
      <option value="todos">Todos los roles</option>
      <option value="admin">Admin</option>
      <option value="agente">Agente</option>
      <option value="auditor">Auditor</option>
      <option value="solicitante">Solicitante</option>
    </select>
  </div>
  <button
    on:click={abrirCrear}
    class="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-gray-900 transition-opacity hover:opacity-80 shrink-0"
    style="background-color:#FFD402;"
  >
    <i class="fas fa-plus text-xs"></i> Nuevo usuario
  </button>
</div>

<!-- Mensaje de éxito -->
{#if exito}
  <div class="mb-4 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-2.5 rounded-xl">
    <i class="fas fa-check-circle"></i> {exito}
  </div>
{/if}

<!-- Tabla de usuarios -->
<div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
  <div class="overflow-x-auto">
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b border-gray-100 bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
          <th class="text-left px-4 py-3 font-semibold">Usuario</th>
          <th class="text-left px-4 py-3 font-semibold">Cargo</th>
          <th class="text-left px-4 py-3 font-semibold">Rol</th>
          <th class="text-left px-4 py-3 font-semibold">Estado</th>
          <th class="text-left px-4 py-3 font-semibold">Inducción</th>
          <th class="text-left px-4 py-3 font-semibold">Evidencias</th>
          <th class="text-left px-4 py-3 font-semibold">Notificaciones</th>
          <th class="text-right px-4 py-3 font-semibold">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {#each filtrados as u (u.id)}
          <tr class="border-b border-gray-50 hover:bg-gray-50 transition-colors">
            <td class="px-4 py-3">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-sm shrink-0">
                  {u.nombre.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p class="font-semibold text-gray-800 leading-tight">{u.nombre}</p>
                  <p class="text-xs text-gray-400">{u.correo}</p>
                </div>
              </div>
            </td>
            <td class="px-4 py-3 text-gray-600">{u.cargo}</td>
            <td class="px-4 py-3">
              <span class={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${rolConfig[u.rol]?.cls ?? 'bg-gray-100 text-gray-600'}`}>
                {rolConfig[u.rol]?.label ?? u.rol}
              </span>
            </td>
            <td class="px-4 py-3">
              <span class={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${u.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                <i class={`fas fa-circle text-[6px]`}></i>
                {u.activo ? 'Activo' : 'Inactivo'}
              </span>
            </td>
            <td class="px-4 py-3">
              {#if u.rol === 'admin'}
                <span class="text-xs text-gray-400">—</span>
              {:else if u.induccion_completada}
                <div class="flex flex-col gap-0.5">
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 w-fit">
                    <i class="fas fa-check-circle"></i> Completada
                  </span>
                  {#if typeof u.induccion_valoracion_sgc === 'number' && typeof u.induccion_valoracion_mesa === 'number'}
                    <span class="text-[9px] text-gray-400 whitespace-nowrap">
                      ⭐ SGC: {u.induccion_valoracion_sgc} | Mesa: {u.induccion_valoracion_mesa}
                    </span>
                  {/if}
                </div>
              {:else}
                <div class="flex items-center gap-2">
                  <span class={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${u.induccion_habilitada ? 'bg-amber-100 text-amber-700 animate-pulse' : 'bg-slate-100 text-slate-500'}`}>
                    <i class="fas fa-history"></i>
                    {u.induccion_habilitada ? 'Habilitada' : 'Inactiva'}
                  </span>
                  <button
                    on:click={() => toggleInduccionHabilitada(u)}
                    title={u.induccion_habilitada ? 'Deshabilitar modal de inducción' : 'Habilitar modal de inducción'}
                    class={`focus:outline-none transition-colors text-lg ${u.induccion_habilitada ? 'text-blue-600 hover:text-blue-700' : 'text-gray-300 hover:text-gray-400'}`}
                  >
                    <i class={`fas ${u.induccion_habilitada ? 'fa-toggle-on' : 'fa-toggle-off'}`}></i>
                  </button>
                </div>
              {/if}
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center gap-2">
                <span class={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${u.acceso_evidencias ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                  <i class="fas {u.acceso_evidencias ? 'fa-folder-open' : 'fa-folder'}"></i>
                  {u.acceso_evidencias ? 'Sí' : 'No'}
                </span>
                {#if u.rol !== 'admin'}
                  <button
                    on:click={() => toggleAccesoEvidencias(u)}
                    title={u.acceso_evidencias ? 'Revocar acceso a evidencias' : 'Permitir acceso a evidencias'}
                    class={`focus:outline-none transition-colors text-lg ${u.acceso_evidencias ? 'text-blue-600 hover:text-blue-700' : 'text-gray-300 hover:text-gray-400'}`}
                  >
                    <i class={`fas ${u.acceso_evidencias ? 'fa-toggle-on' : 'fa-toggle-off'}`}></i>
                  </button>
                {/if}
              </div>
            </td>
            <td class="px-4 py-3 text-xs text-gray-400">
              {#if u.correo_notificacion}
                {u.correo_notificacion}
              {:else}
                <span class="italic">usa correo principal</span>
              {/if}
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center justify-end gap-1">
                <button
                  on:click={() => abrirEditar(u)}
                  title="Editar"
                  class="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  <i class="fas fa-pen text-xs"></i>
                </button>
                {#if u.id !== adminId}
                  <button
                    on:click={() => toggleActivo(u)}
                    title={u.activo ? 'Desactivar' : 'Activar'}
                    class={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${u.activo ? 'text-gray-400 hover:text-orange-600 hover:bg-orange-50' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'}`}
                  >
                    <i class={`fas ${u.activo ? 'fa-user-slash' : 'fa-user-check'} text-xs`}></i>
                  </button>
                  <button
                    on:click={() => resetPassword(u)}
                    title="Generar nueva contraseña aleatoria por correo"
                    class="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                  >
                    <i class="fas fa-random text-xs"></i>
                  </button>
                  <button
                    on:click={() => eliminarUsuario(u)}
                    title="Eliminar usuario permanentemente"
                    class="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <i class="fas fa-trash-alt text-xs"></i>
                  </button>
                {/if}
              </div>
            </td>
          </tr>
        {/each}
        {#if filtrados.length === 0}
          <tr>
            <td colspan="7" class="px-4 py-12 text-center text-gray-400 text-sm">
              <i class="fas fa-users text-3xl text-gray-200 mb-3 block"></i>
              No hay usuarios que coincidan con los filtros.
            </td>
          </tr>
        {/if}
      </tbody>
    </table>
  </div>
  <div class="px-4 py-2 border-t border-gray-50 bg-gray-50 text-xs text-gray-400">
    {filtrados.length} usuario{filtrados.length !== 1 ? 's' : ''} encontrado{filtrados.length !== 1 ? 's' : ''}
  </div>
</div>

<!-- Modal crear/editar -->
{#if modalAbierto}
  <div class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" on:click|self={cerrarModal}>
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md">
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h2 class="text-base font-bold text-gray-900" style="font-family:'Montserrat',sans-serif;">
          {editando ? 'Editar usuario' : 'Nuevo usuario'}
        </h2>
        <button on:click={cerrarModal} class="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all">
          <i class="fas fa-times text-sm"></i>
        </button>
      </div>

      <form on:submit|preventDefault={guardar} class="px-6 py-5 space-y-4">
        {#if error}
          <div class="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg">
            <i class="fas fa-exclamation-circle"></i> {error}
          </div>
        {/if}

        <div class="grid grid-cols-2 gap-3">
          <div class="col-span-2">
            <label class="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Nombre completo *</label>
            <input bind:value={form.nombre} required class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
          </div>

          {#if !editando}
            <div class="col-span-2">
              <label class="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Correo de login *</label>
              <input bind:value={form.correo} type="email" required class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>
          {/if}

          <div class="col-span-2">
            <label class="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">{editando ? 'Nueva Contraseña (opcional)' : 'Contraseña inicial *'}</label>
            <div class="relative">
              <input
                bind:value={form.password}
                type={mostrarPassword ? 'text' : 'password'}
                required={!editando}
                placeholder={editando ? 'Dejar en blanco para mantener la actual' : 'Mínimo 6 caracteres'}
                class="w-full pl-3 pr-10 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <button
                type="button"
                on:click={() => mostrarPassword = !mostrarPassword}
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                title={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                <i class={`fas ${mostrarPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Rol *</label>
            <select
              bind:value={form.rol}
              disabled={editando?.id === adminId}
              class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50"
            >
              <option value="admin">Admin</option>
              <option value="agente">Agente</option>
              <option value="auditor">Auditor</option>
              <option value="solicitante">Solicitante</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Cargo *</label>
            <input bind:value={form.cargo} required class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
          </div>

          <div class="col-span-2">
            <label class="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Correo de notificaciones <span class="font-normal text-gray-400">(opcional)</span></label>
            <input bind:value={form.correo_notificacion} type="email" placeholder="Si difiere del correo de login" class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            <p class="text-[10px] text-gray-400 mt-0.5">Si se deja vacío, las notificaciones llegan al correo de login.</p>
          </div>

          <div class="col-span-2 flex items-center gap-2 py-1">
            <input type="checkbox" id="form-acceso-evidencias" bind:checked={form.acceso_evidencias} class="rounded text-blue-600 focus:ring-blue-500 h-4 w-4" />
            <label for="form-acceso-evidencias" class="text-xs font-bold text-gray-700 cursor-pointer select-none">Permitir acceso al Buzón de Evidencias</label>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button type="button" on:click={cerrarModal} class="px-4 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition-colors">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={cargando}
            class="px-4 py-2 rounded-xl text-sm font-bold text-gray-900 transition-opacity hover:opacity-80 disabled:opacity-50"
            style="background-color:#FFD402;"
          >
            {cargando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear usuario'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
