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
        const folders = fs.readdirSync(targetPath);
        
        // Structure our 4 official categories
        const categories: Record<string, { category: string; icon: string; formats: any[] }> = {
          "Organización y Archivo de Gestión": {
            category: "Organización y Archivo de Gestión",
            icon: "fas fa-folder-tree",
            formats: []
          },
          "Préstamo y Consulta de Documentos": {
            category: "Préstamo y Consulta de Documentos",
            icon: "fas fa-hand-holding-hand",
            formats: []
          },
          "Correspondencia y Radicación (VUAR)": {
            category: "Correspondencia y Radicación (VUAR)",
            icon: "fas fa-envelope-open-text",
            formats: []
          },
          "Control e Instrumentos Archivísticos": {
            category: "Control e Instrumentos Archivísticos",
            icon: "fas fa-shield-halved",
            formats: []
          }
        };

        for (const folder of folders) {
            const folderPath = path.join(targetPath, folder);
            if (!fs.statSync(folderPath).isDirectory()) continue;

            // Map folders to their respective categories based on prefix naming
            let catKey = "Control e Instrumentos Archivísticos";
            if (folder.startsWith('001') || folder.startsWith('002')) {
                catKey = "Préstamo y Consulta de Documentos";
            } else if (/^00[3-9]/.test(folder)) {
                catKey = "Organización y Archivo de Gestión";
            } else if (
                folder.startsWith('010') || 
                folder.startsWith('F011') || 
                folder.startsWith('F012') || 
                folder.startsWith('F015') || 
                folder.startsWith('F16') || 
                folder.startsWith('F016') || 
                folder.startsWith('F017')
            ) {
                catKey = "Correspondencia y Radicación (VUAR)";
            }

            // Scan files inside each folder
            const files = fs.readdirSync(folderPath);
            for (const file of files) {
                if (file.startsWith('.') || file === 'Thumbs.db' || file === 'desktop.ini' || file.startsWith('~$')) {
                    continue;
                }
                const filePath = path.join(folderPath, file);
                const stat = fs.statSync(filePath);
                if (stat.isDirectory()) continue;

                const ext = path.extname(file).toLowerCase();
                let type = 'other';
                if (ext === '.xlsx' || ext === '.xls') type = 'excel';
                else if (ext === '.docx' || ext === '.doc') type = 'word';
                else if (ext === '.pdf') type = 'pdf';

                // Humanize the display name (remove extension and replace underscores/dashes with spaces if needed)
                let displayName = file.substring(0, file.lastIndexOf('.'));
                
                // Clean up prefixes from display names for a cleaner layout if desired
                // (e.g. F009-ROTULO CAJAS -> ROTULO CAJAS)
                if (displayName.includes('-')) {
                    displayName = displayName.split('-').slice(1).join('-').trim();
                }

                // Construct relative URL for static file serving
                const relativeUrl = '/archivos/Formatos/7. Gestión Documental y Tecnologías de la Información/Gestión Documental/' + folder + '/' + encodeURIComponent(file);

                categories[catKey].formats.push({
                    name: displayName,
                    file: file,
                    path: relativeUrl,
                    type: type
                });
            }
        }

        // Convert categorized object to list and filter empty categories
        const result = Object.values(categories).filter(c => c.formats.length > 0);

        // Sort files alphabetically inside each category
        for (const cat of result) {
            cat.formats.sort((a, b) => a.name.localeCompare(b.name));
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
