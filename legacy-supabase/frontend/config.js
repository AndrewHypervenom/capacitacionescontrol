// ============================================================
//  CONFIGURACIÓN  —  Edita SOLO este archivo
// ============================================================
//
//  1) Crea un proyecto gratis en https://supabase.com
//  2) Ve a:  Project Settings  ->  API
//  3) Copia "Project URL" y la clave "anon public" abajo.
//  4) Ejecuta el SQL de  backend/supabase_setup.sql  en el
//     editor SQL de Supabase (menú "SQL Editor").
//
//  La clave "anon" es PÚBLICA por diseño (va en el navegador).
//  No pongas aquí la clave "service_role".
// ============================================================

window.APP_CONFIG = {
  // ---- Supabase ----
  SUPABASE_URL: "https://TU-PROYECTO.supabase.co",
  SUPABASE_ANON_KEY: "TU_CLAVE_ANON_PUBLICA",

  // ---- Repositorio a vigilar ----
  GITHUB_OWNER: "AndrewHypervenom",
  GITHUB_REPO: "capacitaciones",

  // Ramas que se van a unir (en orden de prioridad de merge).
  // "pao" en tu repo se llama realmente "paola".
  BRANCHES: ["main", "isa", "paola"],
};
