// Administradores de la Mesa de Control.
//
// Un admin puede LIBERAR cualquier lock (no solo los suyos), para limpiar los
// "huérfanos": archivos que alguien marcó y olvidó liberar.
//
// La lista se define con la variable de entorno ADMIN_EMAILS del deployment de
// Convex (correos separados por coma). No se guarda en el código para no exponer
// correos en el repo. Ejemplo:
//
//   npx convex env set ADMIN_EMAILS "tu@correo.com,isa@correo.com"
//
// Si no se define, no hay admins (todos solo pueden liberar lo suyo).

export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  return adminEmails().includes(email.toLowerCase());
}
