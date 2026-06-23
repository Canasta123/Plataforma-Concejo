<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  interface Notificacion {
    id: string;
    titulo: string;
    contenido: string;
    leido: boolean;
    tipo: string;
    created_at: string;
  }

  let notificaciones: Notificacion[] = [];
  let unreadCount = 0;
  let isOpen = false;
  let intervalId: any;

  async function fetchNotifications() {
    try {
      const res = await fetch('/api/mesa-ayuda/notificaciones');
      if (res.ok) {
        notificaciones = await res.json();
        unreadCount = notificaciones.filter(n => !n.leido).length;
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  }

  async function markAllAsRead() {
    try {
      const res = await fetch('/api/mesa-ayuda/notificaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'read_all' })
      });
      if (res.ok) {
        notificaciones = notificaciones.map(n => ({ ...n, leido: true }));
        unreadCount = 0;
      }
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  }

  async function markOneAsRead(id: string) {
    try {
      const res = await fetch('/api/mesa-ayuda/notificaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'read_one', id })
      });
      if (res.ok) {
        notificaciones = notificaciones.map(n => n.id === id ? { ...n, leido: true } : n);
        unreadCount = notificaciones.filter(n => !n.leido).length;
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }

  function toggleDropdown(e: Event) {
    e.stopPropagation();
    isOpen = !isOpen;
  }

  function closeDropdown() {
    isOpen = false;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      isOpen = false;
    }
  }

  function formatDate(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('es-CO', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  }

  function getIcon(tipo: string): string {
    switch (tipo) {
      case 'reserva': return 'fa-calendar-alt text-emerald-600 bg-emerald-50 border border-emerald-100';
      case 'ticket': return 'fa-ticket-alt text-blue-600 bg-blue-50 border border-blue-100';
      case 'evidencia': return 'fa-folder-open text-amber-600 bg-amber-50 border border-amber-100';
      default: return 'fa-bell text-gray-500 bg-gray-50 border border-gray-150';
    }
  }

  onMount(() => {
    fetchNotifications();
    intervalId = setInterval(fetchNotifications, 20000);
    window.addEventListener('click', closeDropdown);
    window.addEventListener('keydown', handleKeydown);
  });

  onDestroy(() => {
    if (intervalId) clearInterval(intervalId);
    if (typeof window !== 'undefined') {
      window.removeEventListener('click', closeDropdown);
      window.removeEventListener('keydown', handleKeydown);
    }
  });
</script>

<div class="relative shrink-0 select-none">
  <!-- Bell Button -->
  <button
    on:click={toggleDropdown}
    class="relative w-9 h-9 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex items-center justify-center transition-colors focus:outline-none"
    title="Notificaciones"
  >
    <i class="fas fa-bell text-lg"></i>
    {#if unreadCount > 0}
      <span class="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center shadow-sm">
        {unreadCount > 9 ? '9+' : unreadCount}
      </span>
    {/if}
  </button>

  <!-- Dropdown -->
  {#if isOpen}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div
      on:click|stopPropagation
      class="absolute right-0 mt-2 w-80 max-w-sm bg-white rounded-xl shadow-xl border border-gray-200 z-[100] flex flex-col max-h-[420px] overflow-hidden animate-fade-in"
      role="menu"
    >
      <!-- Dropdown Header -->
      <div class="px-4 py-3 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center shrink-0">
        <h3 class="text-xs font-bold text-gray-800">Notificaciones</h3>
        {#if unreadCount > 0}
          <button
            on:click={markAllAsRead}
            class="text-[10px] font-bold text-brand-blue hover:text-blue-700 hover:underline"
          >
            Marcar todo leído
          </button>
        {/if}
      </div>

      <!-- Notifications List -->
      <div class="overflow-y-auto flex-1 custom-scroll divide-y divide-gray-100">
        {#if notificaciones.length === 0}
          <div class="p-8 text-center text-gray-400 text-xs flex flex-col items-center justify-center gap-2">
            <i class="fas fa-bell-slash text-2xl text-gray-300"></i>
            <span>No tienes notificaciones</span>
          </div>
        {:else}
          {#each notificaciones as n (n.id)}
            <button
              on:click={() => { markOneAsRead(n.id); }}
              class="w-full text-left p-3.5 hover:bg-slate-50 transition-colors flex gap-3 relative items-start
                { !n.leido ? 'bg-blue-50/20' : '' }"
            >
              <!-- Icon Container -->
              <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 {getIcon(n.tipo)}">
                <i class="fas {n.tipo === 'reserva' ? 'fa-calendar-alt' : n.tipo === 'ticket' ? 'fa-ticket-alt' : n.tipo === 'evidencia' ? 'fa-folder-open' : 'fa-bell'} text-xs"></i>
              </div>

              <!-- Content -->
              <div class="flex-1 min-w-0 pr-2">
                <div class="flex justify-between items-baseline gap-1">
                  <h4 class="text-[11px] font-bold text-gray-800 truncate { !n.leido ? 'text-brand-blue' : '' }">{n.titulo}</h4>
                  <span class="text-[9px] text-gray-400 font-semibold whitespace-nowrap">{formatDate(n.created_at)}</span>
                </div>
                <p class="text-[10px] text-gray-500 leading-snug mt-0.5 line-clamp-2">{n.contenido}</p>
              </div>

              <!-- Unread dot indicator -->
              {#if !n.leido}
                <span class="absolute top-4 right-3.5 w-1.5 h-1.5 rounded-full bg-brand-blue shrink-0"></span>
              {/if}
            </button>
          {/each}
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .custom-scroll::-webkit-scrollbar {
    width: 5px;
  }
  .custom-scroll::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scroll::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 10px;
  }
  .custom-scroll::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }

  .animate-fade-in {
    animation: fadeIn 0.15s ease-out forwards;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
