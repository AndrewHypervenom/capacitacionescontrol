import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { isAllowedEmail } from "./access";

// Cuánto tiempo sin latir hasta considerar que alguien ya no está "en vivo".
const ONLINE_MS = 60_000;

// El cliente llama a esto cada ~30 s mientras la pestaña está abierta. Actualiza
// (o crea) la fila de presencia de la persona. Es un upsert por usuario.
export const heartbeat = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    if (!isAllowedEmail(user?.email)) return null;

    const userName = user?.name ?? user?.email ?? "Anónimo";
    const now = Date.now();

    const existing = await ctx.db
      .query("presence")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { lastSeen: now, userName });
    } else {
      await ctx.db.insert("presence", { userId, userName, lastSeen: now });
    }
    return null;
  },
});

// Quién está conectado ahora mismo (latido en el último minuto). Reactivo: se
// refresca solo cuando alguien late o deja de latir. La tabla tiene a lo sumo
// una fila por persona del equipo, así que `collect()` es acotado.
export const online = query({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - ONLINE_MS;
    const rows = await ctx.db.query("presence").collect();
    return rows
      .filter((r) => r.lastSeen >= cutoff)
      .sort((a, b) => a.userName.localeCompare(b.userName))
      .map((r) => ({
        userId: r.userId,
        userName: r.userName,
        lastSeen: r.lastSeen,
      }));
  },
});
