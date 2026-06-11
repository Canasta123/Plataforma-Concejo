import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';

type DocResult = { nombre: string; ruta: string; carpeta: string; extension: string };

function cleanFilename(raw: string): string {
  // Decode any URL encoding first
  let name = decodeURIComponent(raw);
  // Remove file extension for display
  const ext = path.extname(name);
  const base = name.slice(0, name.length - ext.length);
  // Remove leading number(s) followed by dot or space (e.g. "1. " or "2.")
  const cleaned = base.replace(/^\d+[\.\s]+/, '').trim();
  return cleaned || base;
}

const DIRS: { folder: string; publicBase: string }[] = [
  { folder: 'C-Procedimientos', publicBase: '/C-Procedimientos' },
  { folder: 'C-Procesos',       publicBase: '/C-Procesos' },
];

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const query = (url.searchParams.get('q') ?? '').toLowerCase().trim();

  const results: DocResult[] = [];

  const PUBLIC_BASE = process.env.FILES_BASE_DIR
    ? path.resolve(process.env.FILES_BASE_DIR)
    : process.env.NODE_ENV === 'production'
      ? path.join(process.cwd(), 'dist', 'client')
      : path.join(process.cwd(), 'public');

  // 1. Search flat directories (C-Procedimientos, C-Procesos) for PDFs
  for (const { folder, publicBase } of DIRS) {
    const dirPath = path.join(PUBLIC_BASE, folder);

    if (!fs.existsSync(dirPath)) continue;

    let files: string[];
    try {
      files = fs.readdirSync(dirPath);
    } catch {
      continue;
    }

    for (const file of files) {
      const filePath = path.join(dirPath, file);

      // Skip directories and non-PDF files
      try {
        if (fs.statSync(filePath).isDirectory()) continue;
      } catch {
        continue;
      }
      const ext = path.extname(file).toLowerCase();
      if (ext !== '.pdf') continue;

      // Filter by query (match against raw filename)
      if (query && !file.toLowerCase().includes(query)) continue;

      results.push({
        nombre: cleanFilename(file),
        ruta: `${publicBase}/${encodeURIComponent(file)}`,
        carpeta: folder,
        extension: ext,
      });
    }
  }

  // 2. Search recursively in 'archivos/Formatos' for all formats (PDF + Office documents)
  const formatosDir = path.join(PUBLIC_BASE, 'archivos', 'Formatos');
  const allowedExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'];

  const scanDirRecursive = (dir: string, relativeBase: string) => {
    if (!fs.existsSync(dir)) return;
    try {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        if (item.startsWith('.') || item === 'Thumbs.db' || item === 'desktop.ini') continue;
        const fullPath = path.join(dir, item);
        let stat;
        try {
          stat = fs.statSync(fullPath);
        } catch {
          continue;
        }

        if (stat.isDirectory()) {
          scanDirRecursive(fullPath, path.join(relativeBase, item));
        } else {
          const ext = path.extname(item).toLowerCase();
          if (allowedExtensions.includes(ext)) {
            if (query && !item.toLowerCase().includes(query)) continue;

            const displayFolder = relativeBase.replace(/\\/g, ' / ');
            const urlPath = `/archivos/${relativeBase.replace(/\\/g, '/')}/${encodeURIComponent(item)}`;

            results.push({
              nombre: cleanFilename(item),
              ruta: urlPath,
              carpeta: displayFolder,
              extension: ext,
            });
          }
        }
      }
    } catch (e) {
      console.error('Error scanning folder recursive:', dir, e);
    }
  };

  scanDirRecursive(formatosDir, 'Formatos');

  return new Response(JSON.stringify(results), {
    headers: { 'Content-Type': 'application/json' },
  });
};
