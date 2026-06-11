<script lang="ts">
  import { onMount } from 'svelte';

  export let userRol: string = 'solicitante';
  export let userId: string = '';

  interface Recurso { id: string; nombre: string; tipo: string; }
  interface Reserva {
    id: string; motivo: string; fecha_inicio: string; fecha_fin: string; estado: string;
    nota_admin: string | null;
    solicitante: { id: string; nombre: string; correo: string };
    recurso: { id: string; nombre: string; tipo: string; notificar_usuario_id?: string | null; notificar_usuarios_ids?: string[] | null };
    aprobador?: { nombre: string };
    grupo_id?: string | null;
    isGroup?: boolean;
    recursosList?: Array<{
      id: string;
      recurso_id: string;
      nombre: string;
      tipo: string;
      estado: string;
      nota_admin: string | null;
      aprobador?: { nombre: string };
      notificar_usuario_id?: string | null;
      notificar_usuarios_ids?: string[] | null;
    }>;
  }

  let reservas: Reserva[] = [];
  let recursos: Recurso[] = [];
  let cargando = true;
  let viewDate = new Date();          // Mes que se está viendo
  let selectedDay: Date | null = null; // Día seleccionado para sidebar
  let sidebarOpen = false;

  // Modales
  let modalCrear = false;
  let modalDetalle: Reserva | null = null;
  let guardando = false;
  let error = '';
  let exito = '';
  let notaAdmin = '';
  let selectedRecursosIds: string[] = [];
  let form = { fecha: '', hora_inicio: '08:00', hora_fin: '09:00', motivo: '' };

  const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const COLORES: Record<string, { bg: string; text: string; dot: string }> = {
    pendiente: { bg: 'bg-yellow-100 border-yellow-300 text-yellow-800', text: 'text-yellow-700', dot: 'bg-yellow-400' },
    aprobada:  { bg: 'bg-green-100 border-green-300 text-green-800',   text: 'text-green-700',  dot: 'bg-green-500' },
    rechazada: { bg: 'bg-red-100 border-red-300 text-red-800',         text: 'text-red-700',    dot: 'bg-red-500'   },
    cancelada: { bg: 'bg-gray-100 border-gray-300 text-gray-800',       text: 'text-gray-700',   dot: 'bg-gray-400'   },
  };

  // Agrupar reservas reactivamente
  $: groupedReservas = (() => {
    const groups: Record<string, Reserva[]> = {};
    const singles: Reserva[] = [];

    reservas.forEach(r => {
      if (r.grupo_id) {
        if (!groups[r.grupo_id]) groups[r.grupo_id] = [];
        groups[r.grupo_id].push(r);
      } else {
        singles.push(r);
      }
    });

    const groupedList = Object.entries(groups).map(([grupo_id, list]) => {
      // Prioridad de espacio principal
      const espacioRes = list.find(r => r.recurso.tipo === 'espacio');
      let estadoGrupo = 'pendiente';
      
      if (espacioRes) {
        estadoGrupo = espacioRes.estado;
      } else {
        const allAprobadas = list.every(r => r.estado === 'aprobada');
        const someRechazada = list.some(r => r.estado === 'rechazada');
        const allCanceladas = list.every(r => r.estado === 'cancelada');
        if (allCanceladas) estadoGrupo = 'cancelada';
        else if (someRechazada) estadoGrupo = 'rechazada';
        else if (allAprobadas) estadoGrupo = 'aprobada';
        else estadoGrupo = 'pendiente';
      }

      return {
        id: list[0].id,
        grupo_id,
        isGroup: true,
        motivo: list[0].motivo,
        fecha_inicio: list[0].fecha_inicio,
        fecha_fin: list[0].fecha_fin,
        estado: estadoGrupo,
        nota_admin: list.map(r => r.nota_admin).filter(Boolean).join(' | ') || null,
        solicitante: list[0].solicitante,
        recursosList: list.map(r => ({
          id: r.id,
          recurso_id: r.recurso.id,
          nombre: r.recurso.nombre,
          tipo: r.recurso.tipo,
          estado: r.estado,
          nota_admin: r.nota_admin,
          aprobador: r.aprobador,
          notificar_usuario_id: r.recurso.notificar_usuario_id,
          notificar_usuarios_ids: r.recurso.notificar_usuarios_ids
        })),
        recurso: {
          id: '',
          nombre: list.map(r => r.recurso.nombre).join(' + '),
          tipo: 'grupo'
        }
      } as Reserva;
    });

    return [...singles, ...groupedList];
  })();

  // Generar celdas del mes (incluyendo días de relleno del mes anterior/siguiente)
  $: calendarDays = (() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay  = new Date(year, month + 1, 0);
    const startDow = (firstDay.getDay() + 6) % 7;
    const days: { date: Date; currentMonth: boolean }[] = [];

    for (let i = startDow - 1; i >= 0; i--) {
      days.push({ date: new Date(year, month, -i), currentMonth: false });
    }
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push({ date: new Date(year, month, d), currentMonth: true });
    }
    while (days.length % 7 !== 0) {
      days.push({ date: new Date(year, month + 1, days.length - lastDay.getDate() - startDow + 1), currentMonth: false });
    }
    return days;
  })();

  function reservasDelDia(dia: Date): Reserva[] {
    return groupedReservas.filter(r => {
      const d = new Date(r.fecha_inicio);
      return d.getFullYear() === dia.getFullYear() &&
             d.getMonth()    === dia.getMonth() &&
             d.getDate()     === dia.getDate();
    });
  }

  $: reservasSelected = selectedDay ? reservasDelDia(selectedDay) : [];

  function seleccionarDia(dia: Date) {
    selectedDay = dia;
    sidebarOpen = true;
  }

  function esHoy(dia: Date): boolean {
    const hoy = new Date();
    return dia.toDateString() === hoy.toDateString();
  }

  function esSeleccionado(dia: Date): boolean {
    return !!selectedDay && dia.toDateString() === selectedDay.toDateString();
  }

  function prevMes() { viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1); }
  function nextMes() { viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1); }
  function irHoy()   { viewDate = new Date(); selectedDay = new Date(); sidebarOpen = true; }

  function formatHora(iso: string) { return new Date(iso).toLocaleTimeString('es-CO', { timeZone: 'America/Bogota', hour: '2-digit', minute: '2-digit' }); }
  function formatFechaLarga(iso: string) {
    return new Date(iso).toLocaleString('es-CO', { timeZone: 'America/Bogota', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function abrirCrearParaDia(dia: Date) {
    const yyyy = dia.getFullYear();
    const mm   = String(dia.getMonth() + 1).padStart(2, '0');
    const dd   = String(dia.getDate()).padStart(2, '0');
    form = { fecha: `${yyyy}-${mm}-${dd}`, hora_inicio: '08:00', hora_fin: '09:00', motivo: '' };
    selectedRecursosIds = [];
    error = '';
    modalCrear = true;
  }

  async function cargar() {
    cargando = true;
    const [rRes, recRes] = await Promise.all([
      fetch('/api/mesa-ayuda/reservas'),
      fetch('/api/mesa-ayuda/recursos'),
    ]);
    if (rRes.ok)   reservas  = await rRes.json();
    if (recRes.ok) recursos  = await recRes.json();
    cargando = false;
  }

  onMount(cargar);

  async function crear() {
    if (guardando) return;
    error = '';
    if (selectedRecursosIds.length === 0 || !form.fecha || !form.motivo) { 
      error = 'Selecciona al menos un recurso y completa los campos.'; 
      return; 
    }
    const fecha_inicio = new Date(`${form.fecha}T${form.hora_inicio}:00`).toISOString();
    const fecha_fin    = new Date(`${form.fecha}T${form.hora_fin}:00`).toISOString();
    
    if (new Date(fecha_fin) <= new Date(fecha_inicio)) {
      error = 'La hora de fin debe ser posterior a la de inicio.';
      return;
    }

    guardando = true;
    const res = await fetch('/api/mesa-ayuda/reservas', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recursos_ids: selectedRecursosIds, fecha_inicio, fecha_fin, motivo: form.motivo }),
    });
    const data = await res.json();
    guardando = false;
    if (res.ok) {
      modalCrear = false;
      exito = 'Reserva solicitada correctamente.';
      setTimeout(() => exito = '', 5000);
      await cargar();
    } else {
      error = data.error || 'Error al crear la reserva';
    }
  }

  async function cambiarEstadoRecurso(id: string, estado: 'aprobada' | 'rechazada') {
    if (guardando) return;
    guardando = true;
    error = '';
    const res = await fetch(`/api/mesa-ayuda/reservas/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado, nota_admin: notaAdmin || null }),
    });
    guardando = false;
    if (res.ok) {
      exito = `Recurso ${estado === 'aprobada' ? 'aprobado ✓' : 'rechazado'}.`;
      setTimeout(() => exito = '', 4000);
      await cargar();
      if (modalDetalle) {
        if (modalDetalle.isGroup) {
          modalDetalle = groupedReservas.find(g => g.grupo_id === modalDetalle!.grupo_id) || null;
        } else {
          modalDetalle = reservas.find(r => r.id === modalDetalle!.id) || null;
        }
      }
      notaAdmin = '';
    } else {
      const d = await res.json(); error = d.error || 'Error';
    }
  }

  async function cancelarReserva(reservaOrGroup: any) {
    if (!confirm('¿Estás seguro de que deseas cancelar esta reserva?')) return;
    guardando = true;
    error = '';
    
    const targets = reservaOrGroup.isGroup 
      ? reservaOrGroup.recursosList.filter((r: any) => r.estado !== 'cancelada' && r.estado !== 'rechazada')
      : [reservaOrGroup];

    try {
      let failCount = 0;
      for (const t of targets) {
        const res = await fetch(`/api/mesa-ayuda/reservas/${t.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ estado: 'cancelada' })
        });
        if (!res.ok) failCount++;
      }
      
      if (failCount === 0) {
        exito = 'Reserva cancelada correctamente.';
        setTimeout(() => exito = '', 4000);
        modalDetalle = null;
        await cargar();
      } else {
        error = 'Algunos recursos no pudieron ser cancelados.';
      }
    } catch (e) {
      error = 'Error de conexión al cancelar la reserva.';
    } finally {
      guardando = false;
    }
  }
</script>

<div class="flex flex-col gap-6">

  <!-- Header -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
    <div>
      <h1 class="text-2xl font-bold text-gray-900" style="font-family:'Montserrat',sans-serif;">Reservas</h1>
      <p class="text-sm text-gray-500 mt-0.5">Gestiona el préstamo de equipos y espacios del Concejo.</p>
    </div>
    <div class="flex gap-2">
      <button on:click={irHoy} class="px-3 py-2 text-sm font-semibold border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600">Hoy</button>
      <button on:click={() => { form = { fecha: '', hora_inicio: '08:00', hora_fin: '09:00', motivo: '' }; selectedRecursosIds = []; error = ''; modalCrear = true; }}
        class="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm text-gray-900 hover:shadow-md transition-all cursor-pointer"
        style="background:#FFD402;">
        <i class="fas fa-plus"></i> Nueva Reserva
      </button>
    </div>
  </div>

  {#if exito}
    <div class="p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm font-bold">
      <i class="fas fa-check-circle mr-2"></i>{exito}
    </div>
  {/if}

  <!-- Calendario + Sidebar -->
  <div class="flex gap-4 items-start">

    <!-- Calendario -->
    <div class="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

      <!-- Navegación del mes -->
      <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <button on:click={prevMes} class="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
          <i class="fas fa-chevron-left text-sm"></i>
        </button>
        <h2 class="font-bold text-gray-800 text-base" style="font-family:'Montserrat',sans-serif;">
          {MESES[viewDate.getMonth()]} {viewDate.getFullYear()}
        </h2>
        <button on:click={nextMes} class="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
          <i class="fas fa-chevron-right text-sm"></i>
        </button>
      </div>

      <!-- Cabecera de días -->
      <div class="grid grid-cols-7 border-b border-gray-100">
        {#each DIAS as d}
          <div class="py-2 text-center text-xs font-bold text-gray-400 uppercase">{d}</div>
        {/each}
      </div>

      <!-- Grid de días -->
      {#if cargando}
        <div class="p-16 text-center text-gray-400"><i class="fas fa-spinner fa-spin text-3xl"></i></div>
      {:else}
        <div class="grid grid-cols-7 divide-x divide-y divide-gray-50">
          {#each calendarDays as { date, currentMonth }}
            {@const rdias = reservasDelDia(date)}
            {@const hoy   = esHoy(date)}
            {@const sel   = esSeleccionado(date)}
            <button
              on:click={() => seleccionarDia(date)}
              class={`relative min-h-[80px] p-2 text-left transition-colors group ${
                currentMonth ? 'bg-white hover:bg-blue-50/40' : 'bg-gray-50/50 hover:bg-gray-100/50'
              } ${sel ? 'ring-2 ring-inset ring-blue-500' : ''}`}
            >
              <!-- Número del día -->
              <span class={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold transition-colors ${
                hoy ? 'bg-blue-600 text-white' : sel ? 'bg-blue-100 text-blue-700' : currentMonth ? 'text-gray-700' : 'text-gray-300'
              }`}>
                {date.getDate()}
              </span>

              <!-- Dots de reservas -->
              {#if rdias.length > 0}
                <div class="flex flex-wrap gap-0.5 mt-1.5">
                  {#each rdias.slice(0, 3) as r}
                    <span class={`w-2 h-2 rounded-full ${COLORES[r.estado]?.dot ?? 'bg-gray-400'}`} title={r.recurso.nombre}></span>
                  {/each}
                  {#if rdias.length > 3}
                    <span class="text-[9px] text-gray-400 font-bold">+{rdias.length - 3}</span>
                  {/if}
                </div>

                <!-- Vista previa compacta del primer evento -->
                {#if rdias.length <= 2}
                  <div class="hidden sm:block mt-1 space-y-0.5">
                    {#each rdias.slice(0, 2) as r}
                      <div class={`text-[10px] font-semibold px-1.5 py-0.5 rounded truncate border ${COLORES[r.estado]?.bg ?? ''}`}>
                        {formatHora(r.fecha_inicio)} {r.recurso.nombre}
                      </div>
                    {/each}
                  </div>
                {/if}
              {/if}

              <!-- Botón + al hover (para días del mes actual) -->
              {#if currentMonth && rdias.length === 0}
                <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <i class="fas fa-plus text-gray-300 text-lg"></i>
                </div>
              {/if}
            </button>
          {/each}
        </div>
      {/if}

      <!-- Leyenda -->
      <div class="flex gap-5 px-5 py-3 border-t border-gray-100">
        {#each Object.entries(COLORES) as [estado, cls]}
          <span class="flex items-center gap-1.5 text-xs text-gray-500">
            <span class={`w-2.5 h-2.5 rounded-full ${cls.dot}`}></span>
            {estado.charAt(0).toUpperCase() + estado.slice(1)}
          </span>
        {/each}
      </div>
    </div>

    <!-- Sidebar: detalle del día seleccionado -->
    {#if sidebarOpen && selectedDay}
      <div class="w-80 shrink-0 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

        <!-- Header sidebar -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
          <div>
            <p class="text-xs text-gray-400 uppercase font-bold">{DIAS[(selectedDay.getDay() + 6) % 7]}</p>
            <p class="text-2xl font-black text-gray-800">{selectedDay.getDate()}</p>
            <p class="text-xs text-gray-500">{MESES[selectedDay.getMonth()]} {selectedDay.getFullYear()}</p>
          </div>
          <div class="flex items-center gap-2">
            <button
              on:click={() => abrirCrearParaDia(selectedDay!)}
              class="px-3 py-1.5 text-xs font-bold rounded-lg"
              style="background:#FFD402;"
              title="Nueva reserva para este día"
            >
              <i class="fas fa-plus mr-1"></i>Reservar
            </button>
            <button on:click={() => { sidebarOpen = false; selectedDay = null; }} class="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
              <i class="fas fa-times text-sm"></i>
            </button>
          </div>
        </div>

        <!-- Lista de reservas del día -->
        <div class="p-3 space-y-2 max-h-[600px] overflow-y-auto">
          {#if reservasSelected.length === 0}
            <div class="py-10 text-center">
              <i class="fas fa-calendar-day text-gray-200 text-3xl mb-2 block"></i>
              <p class="text-sm text-gray-400">Sin reservas este día</p>
            </div>
          {:else}
            {#each reservasSelected as r}
              <button
                on:click={() => { modalDetalle = r; notaAdmin = ''; error = ''; }}
                class={`w-full text-left p-3 rounded-xl border transition-all hover:shadow-sm ${COLORES[r.estado]?.bg ?? 'bg-gray-50 border-gray-200'}`}
              >
                <div class="flex items-start justify-between gap-2 mb-1">
                  <p class="font-bold text-sm leading-tight">{r.recurso.nombre}</p>
                  <span class={`text-[10px] font-bold uppercase shrink-0 ${COLORES[r.estado]?.text ?? ''}`}>{r.estado}</span>
                </div>
                <p class="text-xs opacity-75">{formatHora(r.fecha_inicio)} – {formatHora(r.fecha_fin)}</p>
                <p class="text-xs opacity-60 mt-0.5 truncate">{r.solicitante.nombre}</p>
              </button>
            {/each}
          {/if}
        </div>
      </div>
    {/if}

  </div><!-- fin flex -->

</div><!-- fin main -->

<!-- Modal: Nueva Reserva -->
{#if modalCrear}
  <div class="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl">
      <h3 class="text-lg font-bold mb-4" style="font-family:'Montserrat',sans-serif;">Nueva Reserva</h3>
      {#if error}<div class="mb-3 p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200">{error}</div>{/if}

      <form on:submit|preventDefault={crear} class="space-y-4">
        <div>
          <label class="block text-xs font-bold text-gray-600 uppercase mb-2">Espacios (Lugar Principal)</label>
          <div class="space-y-2 max-h-32 overflow-y-auto p-2.5 border border-gray-200 rounded-xl mb-3">
            {#each recursos.filter(r => r.tipo === 'espacio') as r}
              <label class="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer">
                <input type="checkbox" value={r.id} bind:group={selectedRecursosIds} class="rounded text-blue-600 focus:ring-blue-500" />
                {r.nombre}
              </label>
            {/each}
            {#if recursos.filter(r => r.tipo === 'espacio').length === 0}
              <p class="text-xs text-gray-400">No hay espacios disponibles.</p>
            {/if}
          </div>

          <label class="block text-xs font-bold text-gray-600 uppercase mb-2">Equipos / Recursos adicionales</label>
          <div class="space-y-2 max-h-32 overflow-y-auto p-2.5 border border-gray-200 rounded-xl">
            {#each recursos.filter(r => r.tipo !== 'espacio') as r}
              <label class="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer">
                <input type="checkbox" value={r.id} bind:group={selectedRecursosIds} class="rounded text-blue-600 focus:ring-blue-500" />
                {r.nombre}
              </label>
            {/each}
            {#if recursos.filter(r => r.tipo !== 'espacio').length === 0}
              <p class="text-xs text-gray-400">No hay equipos disponibles.</p>
            {/if}
          </div>
        </div>
        <div>
          <label class="block text-xs font-bold text-gray-600 uppercase mb-1">Fecha</label>
          <input type="date" bind:value={form.fecha} required class="w-full p-2.5 border border-gray-200 rounded-xl text-sm" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-bold text-gray-600 uppercase mb-1">Hora inicio</label>
            <input type="time" bind:value={form.hora_inicio} required class="w-full p-2.5 border border-gray-200 rounded-xl text-sm" />
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-600 uppercase mb-1">Hora fin</label>
            <input type="time" bind:value={form.hora_fin} required class="w-full p-2.5 border border-gray-200 rounded-xl text-sm" />
          </div>
        </div>
        <div>
          <label class="block text-xs font-bold text-gray-600 uppercase mb-1">Motivo o descripción</label>
          <textarea bind:value={form.motivo} required rows="3" placeholder="Ej: Presentación de presupuesto anual..." class="w-full p-2.5 border border-gray-200 rounded-xl resize-none text-sm"></textarea>
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <button type="button" on:click={() => modalCrear = false} class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl text-sm cursor-pointer">Cancelar</button>
          <button type="submit" disabled={guardando} class="px-5 py-2 font-bold rounded-xl text-sm disabled:opacity-50 cursor-pointer" style="background:#FFD402;">
            {guardando ? 'Enviando...' : 'Solicitar Reserva'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- Modal: Detalle de Reserva -->
{#if modalDetalle}
  <div class="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl">
      <div class="flex items-start justify-between mb-4">
        <div>
          <h3 class="text-lg font-bold" style="font-family:'Montserrat',sans-serif;">Detalles de la Reserva</h3>
          <p class="text-sm text-gray-500 mt-0.5">Solicitante: {modalDetalle.solicitante.nombre}</p>
        </div>
        <span class={`text-xs font-bold px-2.5 py-1 rounded-full border ${COLORES[modalDetalle.estado]?.bg ?? ''}`}>
          {modalDetalle.estado.charAt(0).toUpperCase() + modalDetalle.estado.slice(1)}
        </span>
      </div>

      <div class="space-y-2.5 text-sm mb-4 bg-gray-50 rounded-xl p-4 border border-gray-100">
        <div class="flex gap-3"><span class="text-gray-400 w-20 shrink-0 font-semibold">Motivo</span><span class="text-gray-700">{modalDetalle.motivo}</span></div>
        <div class="flex gap-3"><span class="text-gray-400 w-20 shrink-0 font-semibold">Inicio</span><span class="text-gray-700">{formatFechaLarga(modalDetalle.fecha_inicio)}</span></div>
        <div class="flex gap-3"><span class="text-gray-400 w-20 shrink-0 font-semibold">Fin</span><span class="text-gray-700">{formatFechaLarga(modalDetalle.fecha_fin)}</span></div>
      </div>

      <!-- Lista de Recursos Solicitados con estado individual -->
      <div class="mb-4">
        <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">Recursos Solicitados</span>
        <div class="mt-1.5 space-y-3 bg-gray-50 border border-gray-200/80 rounded-xl p-3 max-h-48 overflow-y-auto">
          {#each (modalDetalle.isGroup ? modalDetalle.recursosList : [{
            id: modalDetalle.id,
            nombre: modalDetalle.recurso.nombre,
            estado: modalDetalle.estado,
            nota_admin: modalDetalle.nota_admin,
            aprobador: modalDetalle.aprobador,
            notificar_usuario_id: modalDetalle.recurso.notificar_usuario_id,
            notificar_usuarios_ids: modalDetalle.recurso.notificar_usuarios_ids
          }]) as r}
            {@const rPuedeAprobar = ['admin', 'agente'].includes(userRol) || r.notificar_usuario_id === userId || (r.notificar_usuarios_ids && r.notificar_usuarios_ids.includes(userId))}
            <div class="border-b border-gray-200 last:border-none pb-2 last:pb-0">
              <div class="flex items-center justify-between gap-2">
                <span class="font-bold text-sm text-gray-800">{r.nombre}</span>
                <span class={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${COLORES[r.estado]?.bg ?? ''}`}>{r.estado}</span>
              </div>
              {#if r.aprobador}
                <p class="text-[10px] text-gray-400 mt-0.5">Revisado por: {r.aprobador.nombre}</p>
              {/if}
              {#if r.nota_admin}
                <p class="text-xs text-gray-500 italic mt-1 bg-white p-2 rounded border border-gray-100">{r.nota_admin}</p>
              {/if}

              <!-- Controles de aprobación individuales por recurso -->
              {#if rPuedeAprobar && r.estado === 'pendiente'}
                <div class="mt-2 flex gap-2">
                  <div class="flex-1">
                    <input bind:value={notaAdmin} placeholder="Nota (opcional)..." class="w-full p-1.5 border border-gray-200 rounded-lg text-xs" />
                  </div>
                  <button on:click={() => cambiarEstadoRecurso(r.id, 'aprobada')} disabled={guardando} class="px-2.5 py-1 bg-green-600 text-white font-bold rounded-lg text-xs hover:bg-green-700 disabled:opacity-50 cursor-pointer">
                    Aprobar
                  </button>
                  <button on:click={() => cambiarEstadoRecurso(r.id, 'rechazada')} disabled={guardando} class="px-2.5 py-1 bg-red-600 text-white font-bold rounded-lg text-xs hover:bg-red-700 disabled:opacity-50 cursor-pointer">
                    Rechazar
                  </button>
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </div>

      {#if error}<div class="mb-3 p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200">{error}</div>{/if}

      <!-- Cancelación por solicitante o admin (aplica a todos los recursos del grupo) -->
      {#if (modalDetalle.solicitante.id === userId || ['admin'].includes(userRol)) && modalDetalle.estado !== 'cancelada' && modalDetalle.estado !== 'rechazada'}
        <button on:click={() => cancelarReserva(modalDetalle)} disabled={guardando} class="w-full py-2.5 border border-red-200 text-red-600 font-bold rounded-xl text-sm hover:bg-red-50 disabled:opacity-50 cursor-pointer transition-colors">
          Cancelar esta reserva
        </button>
      {/if}

      <button on:click={() => modalDetalle = null} class="w-full mt-2 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 cursor-pointer">
        Cerrar
      </button>
    </div>
  </div>
{/if}
