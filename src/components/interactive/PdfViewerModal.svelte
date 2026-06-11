<script lang="ts">
  import { onMount } from 'svelte';
  import { isPdfViewerOpen, pdfViewerUrl } from '../../store/modals';

  function close() {
    $isPdfViewerOpen = false;
  }

  function handleOverlayClick(e: MouseEvent) {
    if (e.target === e.currentTarget) close();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') close();
  }

  function getPdfTitle(url: string): string {
    if (!url) return 'Documento PDF';
    const filename = url.split('/').pop() ?? 'documento.pdf';
    return decodeURIComponent(filename.replace(/\.pdf$/i, '').replace(/[-_]/g, ' '));
  }

  onMount(() => {
    function handleOpenPdf(e: Event) {
      const detail = (e as CustomEvent<{ url: string }>).detail;
      $pdfViewerUrl = encodeURI(decodeURI(detail.url));
      $isPdfViewerOpen = true;
    }

    window.addEventListener('open-pdf-viewer', handleOpenPdf);
    return () => window.removeEventListener('open-pdf-viewer', handleOpenPdf);
  });
</script>

<svelte:window on:keydown={handleKeydown} />

{#if $isPdfViewerOpen}
  <!-- Overlay -->
  <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
  <div
    class="fixed inset-0 z-[200] flex flex-col items-center justify-end bg-black/60 backdrop-blur-sm"
    on:click={handleOverlayClick}
    role="dialog"
    aria-modal="true"
    aria-label="Visor de PDF"
  >
    <!-- Modal panel -->
    <div
      class="pdf-modal-panel flex flex-col w-full bg-white rounded-t-2xl shadow-2xl"
      style="height: 92vh;"
    >
      <!-- Header -->
      <div class="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-200 shrink-0">
        <div class="flex items-center gap-2 min-w-0">
          <i class="fas fa-file-pdf text-red-500 text-lg shrink-0"></i>
          <span class="font-semibold font-heading text-gray-800 text-sm truncate capitalize">
            {getPdfTitle($pdfViewerUrl)}
          </span>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <a
            href={$pdfViewerUrl}
            download
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-blue text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
            title="Descargar PDF"
          >
            <i class="fas fa-download text-xs"></i>
            Descargar
          </a>
          <button
            on:click={close}
            class="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
            aria-label="Cerrar visor"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>

      <!-- PDF iframe -->
      <iframe
        src={$pdfViewerUrl}
        class="w-full flex-1 border-0"
        title="Visor PDF"
      ></iframe>
    </div>
  </div>
{/if}

<style>
  .pdf-modal-panel {
    animation: slideUp 0.28s cubic-bezier(0.34, 1.1, 0.64, 1) both;
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(40px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
