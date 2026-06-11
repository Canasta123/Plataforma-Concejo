<script lang="ts">
  import UserManager from '../UserManager.svelte';
  import ImportUsers from './ImportUsers.svelte';
  import CategoryManager from './CategoryManager.svelte';
  import GlobalConfig from './GlobalConfig.svelte';
  import KbManager from './KbManager.svelte';
  import AuditLog from './AuditLog.svelte';
  import RecursosManager from './RecursosManager.svelte';

  export let usuarios: any[] = [];
  export let adminId: string = '';

  let activeTab = 'usuarios';

  const tabs = [
    { id: 'usuarios', label: 'Usuarios', icon: 'fa-users' },
    { id: 'importar', label: 'Importar', icon: 'fa-file-upload' },
    { id: 'categorias', label: 'Categorías y SLA', icon: 'fa-tags' },
    { id: 'recursos', label: 'Recursos Reservas', icon: 'fa-boxes' },
    { id: 'kb', label: 'Base Conocimiento', icon: 'fa-book' },
    { id: 'config', label: 'Mensaje Global', icon: 'fa-bullhorn' },
    { id: 'audit', label: 'Auditoría', icon: 'fa-list-alt' }
  ];
</script>

<div class="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 flex overflow-x-auto">
  {#each tabs as tab}
    <button
      on:click={() => activeTab = tab.id}
      class={`flex-1 min-w-[140px] px-4 py-3 text-sm font-bold border-b-2 transition-colors flex flex-col items-center gap-1 ${
        activeTab === tab.id 
          ? 'border-blue-600 text-blue-700 bg-blue-50/50' 
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
      }`}
    >
      <i class={`fas ${tab.icon} text-lg mb-1`}></i>
      {tab.label}
    </button>
  {/each}
</div>

<div class="mt-6">
  {#if activeTab === 'usuarios'}
    <UserManager {usuarios} {adminId} />
  {:else if activeTab === 'importar'}
    <ImportUsers />
  {:else if activeTab === 'categorias'}
    <CategoryManager />
  {:else if activeTab === 'recursos'}
    <RecursosManager />
  {:else if activeTab === 'kb'}
    <KbManager />
  {:else if activeTab === 'config'}
    <GlobalConfig />
  {:else if activeTab === 'audit'}
    <AuditLog />
  {/if}
</div>
