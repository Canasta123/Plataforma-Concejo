import { writable } from 'svelte/store';

export const isUploadOpen = writable(false);
export const isDownloadOpen = writable(false);
export const isSearchOpen = writable(false);

export const isPdfViewerOpen = writable(false);
export const pdfViewerUrl = writable('');

export const isSupportOpen = writable(false);
