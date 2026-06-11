import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';

// Base de archivos: NAS en producción/dev con NAS montado, local como fallback
const FILES_BASE = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : process.env.FILES_BASE_DIR
    ? path.resolve(process.env.FILES_BASE_DIR, 'archivos')
    : process.env.NODE_ENV === 'production'
      ? path.join(process.cwd(), 'dist', 'client', 'archivos')
      : path.join(process.cwd(), 'public', 'archivos');

export const GET: APIRoute = async ({ params, request }) => {
    // Para rutas dinámicas con rest parameter [...carpeta]
    // O si se pasa como searchParam
    const url = new URL(request.url);
    let carpeta = params.carpeta || url.searchParams.get('carpeta') || '';

    // Decodificar si viene de URL
    carpeta = decodeURIComponent(carpeta);

    const dirPath = path.join(FILES_BASE, carpeta);

    if (!fs.existsSync(dirPath)) {
        return new Response(JSON.stringify([]));
    }

    try {
        const entries = fs.readdirSync(dirPath);
        const result = [];
        for (const entry of entries) {
            if (entry.startsWith('.') || entry === 'Thumbs.db' || entry === 'desktop.ini') {
                continue;
            }
            const fullPath = path.join(dirPath, entry);
            let stat;
            try {
                stat = fs.statSync(fullPath);
            } catch (e) {
                continue;
            }
            
            // Normalize path separators to forward slashes for URLs
            const folderUrlPath = carpeta.replace(/\\/g, '/');
            
            if (stat.isDirectory()) {
                result.push({
                    name: entry,
                    isDirectory: true,
                    path: folderUrlPath ? `${folderUrlPath}/${entry}` : entry,
                    folder: carpeta
                });
            } else {
                result.push({
                    name: entry,
                    isDirectory: false,
                    extension: path.extname(entry).toLowerCase(),
                    folder: carpeta,
                    rutaDescarga: '/archivos/' + (folderUrlPath ? folderUrlPath + '/' : '') + encodeURIComponent(entry)
                });
            }
        }
        result.sort((a, b) => {
            if (a.isDirectory && !b.isDirectory) return -1;
            if (!a.isDirectory && b.isDirectory) return 1;
            return a.name.localeCompare(b.name);
        });
        
        return new Response(JSON.stringify(result));
    } catch (err) {
        return new Response(JSON.stringify({ error: 'Error al leer la carpeta.' }), { status: 500 });
    }
}
