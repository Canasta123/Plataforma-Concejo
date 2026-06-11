<script lang="ts">
  import { fade, slide } from 'svelte/transition';
  import TicketAdjuntos from './TicketAdjuntos.svelte';

  export let ticket:       any;
  export let trazabilidad: any[]   = [];
  export let sessionRol:   string  = 'solicitante';
  export let sessionId:    string  = '';

  let nuevoComentario = '';
  let activeTab       = 'respuesta'; // 'respuesta' | 'interna'
  let loadingComentario = false;
  let loadingEstado     = false;
  let errorMsg = '';


  const estadoOpciones = ['abierto', 'en_progreso', 'resuelto', 'cerrado'];
  const estadoClsMap: Record<string, string> = {
    abierto: 'bg-blue-100 text-blue-800', en_progreso: 'bg-yellow-100 text-yellow-800',
    resuelto: 'bg-green-100 text-green-800', cerrado: 'bg-gray-100 text-gray-500',
  };
  const tipoIcon: Record<string, string> = {
    comentario: 'fa-comment', respuesta: 'fa-reply', cambio_estado: 'fa-refresh', asignacion: 'fa-user-check',
  };

  async function enviarComentario() {
    if (loadingComentario) return;
    if (!nuevoComentario.trim()) return;
    errorMsg = '';
    loadingComentario = true;
    try {
      const res = await fetch(`/api/mesa-ayuda/tickets/${ticket.id}/comentarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contenido: nuevoComentario.trim(), es_interno: activeTab === 'interna' }),
      });
      if (!res.ok) { const d = await res.json(); errorMsg = d.error ?? 'Error'; return; }
      window.location.reload();
    } catch { errorMsg = 'Error de conexión'; }
    finally { loadingComentario = false; }
  }

  function handleStateClick(nuevoEstado: string) {
    if (nuevoEstado === ticket.estado) return;
    cambiarEstado(nuevoEstado);
  }


  async function cambiarEstado(nuevoEstado: string) {
    if (loadingEstado) return;
    loadingEstado = true;
    try {
      await fetch(`/api/mesa-ayuda/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      window.location.reload();
    } catch { errorMsg = 'Error al cambiar estado'; }
    finally { loadingEstado = false; }
  }

  async function asignarme() {
    if (loadingEstado) return;
    loadingEstado = true;
    try {
      await fetch(`/api/mesa-ayuda/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asignar: true }),
      });
      window.location.reload();
    } catch { errorMsg = 'Error al asignar'; }
    finally { loadingEstado = false; }
  }

  function formatFecha(f: string) {
    return new Date(f).toLocaleString('es-CO', { timeZone: 'America/Bogota', dateStyle: 'medium', timeStyle: 'short' });
  }
</script>

<div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

  <!-- MAIN COLUMN -->
  <div class="lg:col-span-2 flex flex-col gap-6">
    
    <!-- Nuevo comentario (TABS) -->
    {#if ticket.estado !== 'cerrado'}
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {#if sessionRol === 'agente'}
          <div class="flex border-b border-gray-100">
            <button
              on:click={() => activeTab = 'respuesta'}
              class={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'respuesta' ? 'text-blue-700 border-b-2 border-blue-700 bg-blue-50/30' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <i class="fas fa-reply mr-1"></i> Responder al Usuario
            </button>
            <button
              on:click={() => activeTab = 'interna'}
              class={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'interna' ? 'text-amber-700 border-b-2 border-amber-500 bg-amber-50/50' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <i class="fas fa-lock mr-1"></i> Nota Interna
            </button>
          </div>
        {:else}
          <div class="px-5 py-3 border-b border-gray-100 bg-gray-50/50">
            <h3 class="text-sm font-bold text-gray-700">Agregar comentario</h3>
          </div>
        {/if}

        <div class={`p-5 ${activeTab === 'interna' ? 'bg-amber-50/30' : ''}`}>
          <textarea
            bind:value={nuevoComentario}
            placeholder={activeTab === 'interna' ? 'Escribe una nota visible solo para agentes...' : 'Escribe tu respuesta al usuario...'}
            rows={4}
            class={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 resize-none mb-3 transition-colors ${activeTab === 'interna' ? 'border-amber-200 focus:ring-amber-400 bg-amber-50/50' : 'border-gray-200 focus:ring-blue-300 bg-white'}`}
          ></textarea>

          <div class="flex justify-end">
            <button
              on:click={enviarComentario}
              disabled={loadingComentario || !nuevoComentario.trim()}
              class="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 shadow-sm"
              style={activeTab === 'interna' ? 'background-color:#F59E0B; color:white;' : 'background-color:#FFD402; color:#111;'}
            >
              {#if loadingComentario}
                <i class="fas fa-spinner fa-spin"></i> Enviando...
              {:else}
                <i class="fas fa-paper-plane"></i> {activeTab === 'interna' ? 'Guardar Nota' : 'Enviar Respuesta'}
              {/if}
            </button>
          </div>
        </div>
      </div>
    {/if}

    <!-- Historial TIMELINE -->
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:p-8">
      <h3 class="text-sm font-bold text-gray-700 mb-8 flex items-center gap-2"><i class="fas fa-history text-gray-400"></i> Línea de tiempo</h3>
      
      {#if errorMsg}
        <div class="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm mb-6">{errorMsg}</div>
      {/if}

      <div class="relative pl-6 border-l-2 border-gray-100 space-y-8">
        {#if trazabilidad.length === 0}
          <p class="text-sm text-gray-400 py-4">Sin actividad registrada.</p>
        {:else}
          {#each trazabilidad as entrada (entrada.id)}
            <div class="relative">
              <!-- Timeline dot -->
              <div class={`absolute -left-[37px] w-8 h-8 rounded-full flex items-center justify-center border-4 border-white shadow-sm ${entrada.es_interno ? 'bg-amber-400' : entrada.tipo === 'cambio_estado' ? 'bg-purple-100 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                {#if entrada.es_interno}
                  <i class="fas fa-lock text-xs text-white"></i>
                {:else}
                  <i class={`fas ${tipoIcon[entrada.tipo] ?? 'fa-circle'} text-xs`}></i>
                {/if}
              </div>
              
              <!-- Content -->
              <div class={`rounded-xl border p-4 shadow-sm transition-all hover:shadow-md ${entrada.es_interno ? 'bg-amber-50 border-amber-200' : entrada.contenido.includes('RESUMEN DE RESOLUCIÓN') ? 'bg-green-50 border-green-200 ring-1 ring-green-400/20' : 'bg-white border-gray-100'}`}>
                <div class="flex items-center justify-between mb-2 gap-4 flex-wrap">
                  <div class="flex items-center gap-2 min-w-0">
                    <span class="text-sm font-bold text-gray-800">{entrada.autor?.nombre ?? 'Sistema'}</span>
                    <span class="hidden sm:inline text-xs text-gray-400">{entrada.autor?.cargo ?? ''}</span>
                    {#if entrada.es_interno}
                      <span class="text-[10px] bg-amber-200 text-amber-800 px-2 py-0.5 rounded font-bold uppercase tracking-wider ml-1">Nota Interna</span>
                    {/if}
                  </div>
                  <span class="text-xs text-gray-400 shrink-0">{formatFecha(entrada.created_at)}</span>
                </div>
                <p class="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words">{entrada.contenido}</p>
              </div>
            </div>
          {/each}
        {/if}
      </div>
    </div>
  </div>

  <!-- SIDEBAR (Sticky) -->
  {#if sessionRol === 'agente'}
    <div class="relative w-full">
      <div class="sticky top-24 flex flex-col gap-5">
        
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 class="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <i class="fas fa-sliders-h"></i> Panel de Control
          </h3>
          
          <div class="space-y-5">
            <div>
              <span class="block text-xs font-semibold text-gray-600 mb-2">Cambiar Estado</span>
              <div class="flex flex-col gap-2">
                {#each estadoOpciones as op}
                  <button
                    on:click={() => handleStateClick(op)}
                    disabled={loadingEstado || ticket.estado === op}
                    class={`px-4 py-2.5 rounded-xl text-sm font-bold text-left transition-all border ${
                      ticket.estado === op ? estadoClsMap[op] + ' border-transparent ring-2 ring-offset-2 ' + (op==='resuelto'?'ring-green-400':'ring-blue-400') : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm'
                    }`}
                  >
                    <div class="flex items-center justify-between">
                      <span class="capitalize">{op.replace('_', ' ')}</span>
                      {#if ticket.estado === op}<i class="fas fa-check"></i>{/if}
                    </div>
                  </button>
                {/each}
              </div>
            </div>

            <div class="pt-5 border-t border-gray-100">
              <span class="block text-xs font-semibold text-gray-600 mb-2">Asignación</span>
              {#if !ticket.agente_id}
                <button
                  on:click={asignarme}
                  disabled={loadingEstado}
                  class="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <i class="fas fa-user-plus"></i> Asignarme Ticket
                </button>
              {:else}
                <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <div class="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                    <i class="fas fa-user-check text-sm"></i>
                  </div>
                  <div class="text-sm text-gray-700 font-semibold leading-tight">Ticket Asignado</div>
                </div>
              {/if}
            </div>
          </div>
        </div>
        
      </div>
    </div>
  {/if}

</div>

<!-- Adjuntos: fuera del grid, ancho completo -->
<div class="mt-6">
  <TicketAdjuntos
    ticketId={ticket.id}
    {sessionId}
    {sessionRol}
    ticketCerrado={ticket.estado === 'cerrado'}
  />
</div>
