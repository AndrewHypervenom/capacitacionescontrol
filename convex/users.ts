import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { isAdminEmail } from "./admins";
import { isAllowedEmail } from "./access";

// Devuelve el usuario que tiene la sesión iniciada (o null si no hay).
// - `isAdmin`: puede liberar locks ajenos y ver la lista de usuarios.
// - `allowed`: está en la lista blanca (o el sitio está abierto).
export const viewer = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    if (!user) return null;
    return {
      ...user,
      isAdmin: isAdminEmail(user.email),
      allowed: isAllowedEmail(user.email),
    };
  },
});

// Lista de todas las personas que han iniciado sesión alguna vez.
// Solo para admins: sirve para conseguir los correos y armar la lista blanca
// o la lista de admins. Devuelve [] si no eres admin.
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const me = await ctx.db.get(userId);
    if (!isAdminEmail(me?.email)) return [];

    const users = await ctx.db.query("users").collect();
    return users.map((u) => ({
      _id: u._id,
      name: u.name ?? null,
      email: u.email ?? null,
      isAdmin: isAdminEmail(u.email),
      allowed: isAllowedEmail(u.email),
    }));
  },
});
