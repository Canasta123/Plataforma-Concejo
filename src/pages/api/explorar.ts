import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';

function formatBytes(bytes: number) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export const GET: APIRoute = async ({ request }) => {
    const url = new URL(request.url);
    const rutaParam = url.searchParams.get('ruta') || '';
    
    const baseDir = process.env.UPLOAD_DIR
      ? path.resolve(process.env.UPLOAD_DIR)
      : process.env.FILES_BASE_DIR
        ? path.resolve(process.env.FILES_BASE_DIR, 'archivos')
        : process.env.NODE_ENV === 'production'
          ? path.join(process.cwd(), 'dist', 'client', 'archivos')
          : path.join(process.cwd(), 'public', 'archivos');
    const targetDir = path.resolve(baseDir, rutaParam);

    if (!targetDir.startsWith(baseDir)) {
        return new Response(JSON.stringify({ error: 'Acceso denegado.' }), { status: 403 });
    }

    if (!fs.existsSync(targetDir)) {
        return new Response(JSON.stringify({ ruta: rutaParam, carpetas: [], archivos: [] }));
    }

    try {
        const items = fs.readdirSync(targetDir);
        const carpetas = [];
        const archivos = [];

        for (const item of items) {
            if (item.startsWith('.') || item === 'Thumbs.db' || item === 'desktop.ini') {
                continue;
            }
            const itemPath = path.join(targetDir, item);
            let stat;
            try {
                stat = fs.statSync(itemPath);
            } catch (e) {
                continue;
            }

            if (stat.isDirectory()) {
                carpetas.push({
                    nombre: item,
                    ruta: rutaParam ? rutaParam + '/' + item : item
                });
            } else {
                archivos.push({
                    nombre: item,
                    extension: path.extname(item).toLowerCase(),
                    tamano: formatBytes(stat.size),
                    rutaDescarga: '/archivos/' + (rutaParam ? rutaParam + '/' : '') + encodeURIComponent(item)
                });
            }
        }

        carpetas.sort((a, b) => a.nombre.localeCompare(b.nombre));
        archivos.sort((a, b) => a.nombre.localeCompare(b.nombre));

        return new Response(JSON.stringify({ ruta: rutaParam, carpetas, archivos }));
    } catch (err) {
        return new Response(JSON.stringify({ error: 'Error al explorar la carpeta.' }), { status: 500 });
    }
}
