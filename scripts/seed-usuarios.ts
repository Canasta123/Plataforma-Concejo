import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL         = process.env.SUPABASE_URL         ?? '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY ?? '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Define SUPABASE_URL y SUPABASE_SERVICE_KEY en el entorno');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const usuarios = [
  {
    nombre:   'Solicitante Demo',
    correo:   'solicitante@demo.com',
    password: 'Demo1234',
    rol:      'solicitante',
    cargo:    'Funcionario',
  },
  {
    nombre:   'Agente Demo',
    correo:   'agente@demo.com',
    password: 'Demo1234',
    rol:      'agente',
    cargo:    'Soporte TI',
  },
  {
    nombre:   'Auditor Demo',
    correo:   'auditor@demo.com',
    password: 'Demo1234',
    rol:      'auditor',
    cargo:    'Control Interno',
  },
];

async function seed() {
  console.log('Insertando usuarios de prueba...\n');

  for (const u of usuarios) {
    const hash = await bcrypt.hash(u.password, 12);
    const { error } = await supabase.from('usuarios').upsert(
      { nombre: u.nombre, correo: u.correo, password_hash: hash, rol: u.rol, cargo: u.cargo, activo: true },
      { onConflict: 'correo' }
    );

    if (error) {
      console.error(`✗ ${u.correo}:`, error.message);
    } else {
      console.log(`✓ ${u.rol.padEnd(12)} | ${u.correo.padEnd(25)} | pass: ${u.password}`);
    }
  }

  console.log('\nSeed completado.');
}

seed();
