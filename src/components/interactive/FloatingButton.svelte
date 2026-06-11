<script lang="ts">
  import { onMount } from 'svelte';

  import { isUploadOpen, isDownloadOpen, isSearchOpen, isSupportOpen } from '../../store/modals';

  let iconsVisible = false;
  let pulseInterval: ReturnType<typeof setInterval>;
  let dragDistance = 0;

  const buttons = [
    { icon: 'fas fa-upload',   label: 'Subir archivo',     action: () => { toggle(); $isUploadOpen = true; } },
    { icon: 'fas fa-download', label: 'Descargar archivo', action: () => { toggle(); $isDownloadOpen = true; } },
    { icon: 'fas fa-search',   label: 'Buscar documento',  action: () => { toggle(); $isSearchOpen = true; } },
    { icon: 'fas fa-envelope-open-text', label: 'Solicitud de Actualización', action: () => { toggle(); $isSupportOpen = true; } },
    { icon: 'fas fa-headset',  label: 'Mesa de Ayuda',     action: () => { toggle(); window.location.href = '/mesa-ayuda'; } },
  ];

  function toggle() {
    iconsVisible = !iconsVisible;
  }

  function handleToggle(e: Event) {
    if (dragDistance > 5) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    toggle();
  }

  function draggable(node: HTMLElement) {
    let x = 0;
    let y = 0;
    let startX = 0;
    let startY = 0;
    let isDragging = false;

    function handleMousedown(e: MouseEvent | TouchEvent) {
      if (e.target instanceof Element && e.target.closest('.no-drag')) return;
      isDragging = true;
      dragDistance = 0;
      const clientX = e.type === 'touchstart' ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = e.type === 'touchstart' ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY;
      startX = clientX - x;
      startY = clientY - y;

      window.addEventListener('mousemove', handleMousemove);
      window.addEventListener('mouseup', handleMouseup);
      window.addEventListener('touchmove', handleMousemove, { passive: false });
      window.addEventListener('touchend', handleMouseup);
    }

    function handleMousemove(e: MouseEvent | TouchEvent) {
      if (!isDragging) return;
      const clientX = e.type === 'touchmove' ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = e.type === 'touchmove' ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY;
      
      const newX = clientX - startX;
      const newY = clientY - startY;
      
      dragDistance += Math.abs(newX - x) + Math.abs(newY - y);
      
      x = newX;
      y = newY;
      
      node.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      
      if (dragDistance > 5 && e.cancelable) {
        e.preventDefault();
      }
    }

    function handleMouseup() {
      isDragging = false;
      window.removeEventListener('mousemove', handleMousemove);
      window.removeEventListener('mouseup', handleMouseup);
      window.removeEventListener('touchmove', handleMousemove);
      window.removeEventListener('touchend', handleMouseup);
    }

    node.addEventListener('mousedown', handleMousedown);
    node.addEventListener('touchstart', handleMousedown, { passive: false });

    return {
      destroy() {
        node.removeEventListener('mousedown', handleMousedown);
        node.removeEventListener('touchstart', handleMousedown);
      }
    };
  }

  onMount(() => {
    pulseInterval = setInterval(() => {}, 4000);
    return () => clearInterval(pulseInterval);
  });
</script>

<div use:draggable class="fixed bottom-24 right-6 z-[100] flex flex-col-reverse items-end gap-3 pointer-events-none" style="position: fixed !important;">
  {#each buttons as btn, i}
    <div
      class="flex items-center gap-2 transition-all duration-300 origin-bottom-right pointer-events-auto cursor-pointer no-drag"
      style="
        opacity: {iconsVisible ? 1 : 0};
        transform: {iconsVisible ? 'scale(1) translateY(0)' : 'scale(0.7) translateY(10px)'};
        pointer-events: {iconsVisible ? 'auto' : 'none'};
        transition-delay: {iconsVisible ? i * 60 : (2 - i) * 40}ms;
      "
    >
      <span class="bg-gray-800 text-white text-xs font-semibold px-2 py-1 rounded-lg shadow whitespace-nowrap">
        {btn.label}
      </span>
      <button
        on:click|stopPropagation={btn.action}
        class="w-10 h-10 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center text-gray-600 hover:text-white hover:bg-brand-blue hover:border-brand-blue hover:scale-110 transition-all duration-200"
        title={btn.label}
        aria-label={btn.label}
      >
        <i class={btn.icon}></i>
      </button>
    </div>
  {/each}

  <button
    on:click={handleToggle}
    class="w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white transition-all duration-300 hover:scale-110 active:scale-95 animate-pulse-slow pointer-events-auto cursor-grab active:cursor-grabbing"
    style="background-color: #3359A4;"
    aria-label="Menú de acciones"
    aria-expanded={iconsVisible}
  >
    <i class="fas {iconsVisible ? 'fa-times' : 'fa-bars'} text-xl transition-all duration-200 pointer-events-none"></i>
  </button>
</div>

<style>
  @keyframes pulse-slow {
    0%, 100% { box-shadow: 0 0 0 0 rgba(51,89,164,0.4); }
    50% { box-shadow: 0 0 0 12px rgba(51,89,164,0); }
  }
  .animate-pulse-slow {
    animation: pulse-slow 4s ease-in-out infinite;
  }
</style>
