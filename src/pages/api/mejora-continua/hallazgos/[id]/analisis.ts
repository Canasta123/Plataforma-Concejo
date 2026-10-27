import type { APIRoute } from 'astro';
import { supabase } from '../../../../../lib/supabase';
import { getSession } from '../../../../../lib/auth';
import { esGestorMejora } from '../../../../../lib/mejora-auth';

export const GET: APIRoute = async ({ cookies, params }) => {
  try {
    const session = await getSession(cookies);
    if (!session) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const { id: hallazgo_id } = params;
    
    const { data, error } = await supabase
      .from('analisis_causas')
      .select(`
        *,
        analista:usuarios!analista_id(nombre)
      `)
      .eq('hallazgo_id', hallazgo_id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error('Error GET analisis:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

export const POST: APIRoute = async ({ request, cookies, params }) => {
  try {
    const session = await getSession(cookies);
    if (!session) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const { id: hallazgo_id } = params;
    const body = await request.json();
    let { metodologia, datos_analisis, causa_raiz } = body;

    const isGestor = await esGestorMejora(session);
    const { data: hallazgo } = await supabase
      .from('hallazgos')
      .select('responsable_id, creador_id')
      .eq('id', hallazgo_id)
      .single();

    const isAuthorized = isGestor || hallazgo?.responsable_id === session.id || hallazgo?.creador_id === session.id;
    if (!isAuthorized) {
      return new Response(JSON.stringify({ error: 'Solo la persona asignada o el gestor pueden registrar el análisis de causas' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    // Normalize metodologia key
    const isPorques = metodologia?.toLowerCase().includes('porqu') || metodologia === '5_porques';
    const normalizedMetodologia = isPorques ? '5_porques' : 'ishikawa';

    // Validate 5 Porqués minimum count
    if (isPorques) {
      const { data: config } = await supabase
        .from('config_mejora')
        .select('valor')
        .eq('clave', 'min_porques')
        .single();
        
      const minPorques = config?.valor ? parseInt(config.valor) : 3;
      
      const porquesList = Array.isArray(datos_analisis) 
        ? datos_analisis 
        : (datos_analisis?.porques || []);

      const validPorques = porquesList.filter((p: string) => typeof p === 'string' && p.trim().length > 0);
      
      if (validPorques.length < minPorques) {
        return new Response(JSON.stringify({ error: `Se requieren al menos ${minPorques} porqués completos.` }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }
    }

    if (!causa_raiz || !causa_raiz.trim()) {
      return new Response(JSON.stringify({ error: 'La Causa Raíz final es obligatoria.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Check if an analysis record already exists for this hallazgo
    const { data: existing } = await supabase
      .from('analisis_causas')
      .select('id')
      .eq('hallazgo_id', hallazgo_id)
      .maybeSingle();

    let resultData;

    if (existing) {
      // Update existing record
      const { data: updated, error: updateError } = await supabase
        .from('analisis_causas')
        .update({
          metodologia: normalizedMetodologia,
          datos_analisis,
          causa_raiz,
          analista_id: session.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (updateError) throw updateError;
      resultData = updated;
    } else {
      // Insert new record
      const { data: inserted, error: insertError } = await supabase
        .from('analisis_causas')
        .insert({
          hallazgo_id,
          metodologia: normalizedMetodologia,
          datos_analisis,
          causa_raiz,
          analista_id: session.id,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      resultData = inserted;
    }

    // Record in trazabilidad
    await supabase.from('hallazgo_trazabilidad').insert({
      hallazgo_id,
      autor_id: session.id,
      tipo: 'analisis',
      contenido: `Análisis de causas registrado usando ${isPorques ? 'Metodología 5 Porqués' : 'Análisis por Categorías'}. Causa raíz: "${causa_raiz.slice(0, 100)}..."`,
      metadata: { metodologia: normalizedMetodologia }
    });

    return new Response(JSON.stringify({ success: true, analisis: resultData }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error('Error POST analisis:', error);
    return new Response(JSON.stringify({ error: error.message || 'Error al guardar el análisis de causas' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
