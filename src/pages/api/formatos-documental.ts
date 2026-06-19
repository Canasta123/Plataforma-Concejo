import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';

export const GET: APIRoute = async () => {
    // Resolve the files base directory (handles both development and production environments)
    const baseDir = process.env.UPLOAD_DIR
      ? path.resolve(process.env.UPLOAD_DIR)
      : process.env.FILES_BASE_DIR
        ? path.resolve(process.env.FILES_BASE_DIR, 'archivos')
        : process.env.NODE_ENV === 'production'
          ? path.join(process.cwd(), 'dist', 'client', 'archivos')
          : path.join(process.cwd(), 'public', 'archivos');

    const targetPath = path.join(baseDir, 'Formatos', '7. Gestión Documental y Tecnologías de la Información', 'Gestión Documental');

    if (!fs.existsSync(targetPath)) {
        return new Response(JSON.stringify([]), { status: 200 });
    }

    try {
        const categoryMap = [
          {
            folderName: "Organizacion y Archivo de Gestion",
            displayName: "Organización y Archivo de Gestión",
            icon: "fas fa-folder-tree"
          },
          {
            folderName: "Prestamo y Consulta de Documentos",
            displayName: "Préstamo y Consulta de Documentos",
            icon: "fas fa-hand-holding-hand"
          },
          {
            folderName: "Correspondencia y Radicacion (VUAR)",
            displayName: "Correspondencia y Radicación (VUAR)",
            icon: "fas fa-envelope-open-text"
          },
          {
            folderName: "Control e Instrumentos Archivisticos",
            displayName: "Control e Instrumentos Archivísticos",
            icon: "fas fa-shield-halved"
          }
        ];

        const result = [];

        for (const cat of categoryMap) {
            const catPath = path.join(targetPath, cat.folderName);
            if (!fs.existsSync(catPath) || !fs.statSync(catPath).isDirectory()) {
                continue;
            }

            const files = fs.readdirSync(catPath);
            const formats = [];

            for (const file of files) {
                if (file.startsWith('.') || file === 'Thumbs.db' || file === 'desktop.ini' || file.startsWith('~$')) {
                    continue;
                }
                const filePath = path.join(catPath, file);
                const stat = fs.statSync(filePath);
                if (stat.isDirectory()) continue;

                const ext = path.extname(file).toLowerCase();
                let type = 'other';
                if (ext === '.xlsx' || ext === '.xls') type = 'excel';
                else if (ext === '.docx' || ext === '.doc') type = 'word';
                else if (ext === '.pdf') type = 'pdf';

                let displayName = file.substring(0, file.lastIndexOf('.'));
                
                // Clean up prefixes if any
                if (displayName.includes('-')) {
                    displayName = displayName.split('-').slice(1).join('-').trim();
                }

                const relativeUrl = `/archivos/Formatos/7. Gestión Documental y Tecnologías de la Información/Gestión Documental/${cat.folderName}/${encodeURIComponent(file)}`;

                formats.push({
                    name: displayName,
                    file: file,
                    path: relativeUrl,
                    type: type
                });
            }

            if (formats.length > 0) {
                // Sort files alphabetically inside each category
                formats.sort((a, b) => a.name.localeCompare(b.name));
                result.push({
                    category: cat.displayName,
                    icon: cat.icon,
                    formats: formats
                });
            }
        }

        return new Response(JSON.stringify(result), {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: 'Error al explorar formatos' }), { status: 500 });
    }
}
