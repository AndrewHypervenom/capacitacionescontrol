// Control de acceso: quién puede usar la Mesa de Control.
//
// La lista blanca se define con la variable de entorno ALLOWED_EMAILS del
// deployment de Convex (correos separados por coma). Ejemplo:
//
//   npx convex env set ALLOWED_EMAILS "pachonandres721@gmail.com,isa@correo.com"
//
// Reglas:
//  - Si ALLOWED_EMAILS está vacío => el sitio queda ABIERTO a cualquiera con
//    cuenta de GitHub (comportamiento anterior; así no te bloqueas sin querer).
//  - Si tiene correos => solo esas personas entran.
//  - Los admins (ADMIN_EMAILS) siempre tienen acceso, aunque no estén en la lista.

import { isAdminEmail } from "./admins";

export function allowedEmails(): string[] {
  return (process.env.ALLOWED_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowedEmail(email: string | undefined | null): boolean {
  const list = allowedEmails();
  if (list.length === 0) return true; // sin lista => abierto a todos
  if (!email) return false;
  return list.includes(email.toLowerCase()) || isAdminEmail(email);
}
