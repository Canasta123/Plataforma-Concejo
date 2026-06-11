import { writable } from 'svelte/store';
import type { Ticket, EstadoTicket, Prioridad, Categoria } from '../lib/supabase';

export const currentTicket = writable<Ticket | null>(null);

export const ticketFilters = writable<{
  estado:    EstadoTicket | 'todos';
  prioridad: Prioridad    | 'todas';
  categoria: Categoria    | 'todas';
}>({
  estado:    'todos',
  prioridad: 'todas',
  categoria: 'todas',
});

export const isTicketFormOpen = writable(false);
