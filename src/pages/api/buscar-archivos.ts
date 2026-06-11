import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';

const FILES_BASE = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : process.env.FILES_BASE_DIR
    ? path.resolve(process.env.FILES_BASE_DIR, 'archivos')
    : process.env.NODE_ENV === 'production'
      ? path.join(process.cwd(), 'dist', 'client', 'archivos')
      : path.join(process.cwd(), 'public', 'archivos');

export const GET: APIRoute = async ({ request }) => {
    const url = new URL(request.url);
    const query = (url.searchParams.get('q') || '').toLowerCase();

    const baseDir = FILES_BASE;
    let results: any[] = [];

    if (!fs.existsSync(baseDir)) return new Response(JSON.stringify([]));

    const readDir = (dir: string, folderName: string) => {
        try {
            const items = fs.readdirSync(dir);
            for (let item of items) {
                const itemPath = path.join(dir, item);
                if (fs.statSync(itemPath).isDirectory()) {
                    readDir(itemPath, item);
                } else {
                    if (!query || item.toLowerCase().includes(query)) {
                        results.push({
                            name: item,
                            extension: path.extname(item).toLowerCase(),
                            folder: folderName || 'Raíz',
                            rutaDescarga: '/archivos/' + (folderName ? folderName + '/' : '') + encodeURIComponent(item)
                        });
                    }
                }
            }
        } catch (e) { }
    };

    try {
        readDir(baseDir, '');
        return new Response(JSON.stringify(results));
    } catch (err) {
        return new Response(JSON.stringify({ error: 'Error al buscar archivos.' }), { status: 500 });
    }
}
