import { defineMiddleware } from 'astro:middleware';
import { startScheduler } from './lib/scheduler';

// Iniciar el scheduler de recordatorios una sola vez al arrancar el servidor
startScheduler();

export const onRequest = defineMiddleware(async (_ctx, next) => {
  const response = await next();
  
  // Evitar que el navegador guarde la página en caché
  // Esto previene el error donde al darle "Atrás" después de cerrar sesión, se vea el dashboard
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');

  return response;
});
