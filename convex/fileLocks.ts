import { v } from "convex/values";
import { query, mutation, type MutationCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { isAdminEmail } from "./admins";
import { isAllowedEmail } from "./access";

const NOT_ALLOWED = "No tienes acceso a esta Mesa de Control. Pídele a un admin que te agregue.";

// Guarda un evento en la bitácora (auditoría/historial). Se llama al marcar y al
// liberar. `reason` explica cómo se liberó (manual, limpieza, o por rama).
async function logEvent(
  ctx: MutationCtx,
  action: "claim" | "release",
  lock: Pick<Doc<"fileLocks">, "filePath" | "branch" | "userId" | "userName" | "note">,
  reason?: "manual" | "stale" | "branch",
) {
  await ctx.db.insert("lockEvents", {
    action,
    filePath: lock.filePath,
    branch: lock.branch,
    userId: lock.userId,
    userName: lock.userName,
    note: lock.note,
    reason,
  });
}

// Paleta para asignar un color estable a cada persona.
const PALETTE = [
  "#6366f1", "#db2777", "#0891b2", "#16a34a", "#ea580c",
  "#7c3aed", "#0d9488", "#dc2626", "#2563eb", "#ca8a04",
];
function colorFor(str: string): string {
  let h = 0;
  for (const c of str) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

// Lista todos los locks (el tablero). Reactivo: se actualiza solo en todos
// los navegadores cuando alguien marca o libera un archivo.
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("fileLocks").order("desc").collect();
  },
});

// Marca un archivo. Si la misma persona ya lo tenía marcado en la misma rama,
// solo actualiza la nota (upsert).
export const claim = mutation({
  args: {
    filePath: v.string(),
    branch: v.string(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, { filePath, branch, note }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Tienes que iniciar sesión.");

    const trimmedPath = filePath.trim();
    if (!trimmedPath) throw new Error("Falta la ruta del archivo.");

    const user = await ctx.db.get(userId);
    if (!isAllowedEmail(user?.email)) throw new Error(NOT_ALLOWED);
    const userName = user?.name ?? user?.email ?? "Anónimo";
    const color = colorFor(userName);
    const cleanNote = note?.trim() ? note.trim() : undefined;

    const existing = await ctx.db
      .query("fileLocks")
      .withIndex("by_user_file_branch", (q) =>
        q.eq("userId", userId).eq("filePath", trimmedPath).eq("branch", branch),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { note: cleanNote, userName, color });
      return existing._id;
    }

    const id = await ctx.db.insert("fileLocks", {
      filePath: trimmedPath,
      branch,
      userId,
      userName,
      color,
      note: cleanNote,
    });
    await logEvent(ctx, "claim", {
      filePath: trimmedPath,
      branch,
      userId,
      userName,
      note: cleanNote,
    });
    return id;
  },
});

// Libera un archivo. Puedes liberar tus propios locks; los admins pueden
// liberar cualquiera (para limpiar los huérfanos que alguien olvidó liberar).
export const release = mutation({
  args: { id: v.id("fileLocks") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Tienes que iniciar sesión.");

    const me = await ctx.db.get(userId);
    if (!isAllowedEmail(me?.email)) throw new Error(NOT_ALLOWED);

    const lock = await ctx.db.get(id);
    if (!lock) return;
    if (lock.userId !== userId && !isAdminEmail(me?.email)) {
      throw new Error("Solo puedes liberar los archivos que tú marcaste.");
    }
    await ctx.db.delete(id);
    await logEvent(ctx, "release", lock, "manual");
  },
});

// Libera de golpe todos los locks de una rama. Cualquiera puede soltar los
// suyos; un admin puede vaciar la rama entera (útil cuando ya se hizo el merge).
export const releaseBranch = mutation({
  args: { branch: v.string() },
  handler: async (ctx, { branch }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Tienes que iniciar sesión.");

    const me = await ctx.db.get(userId);
    if (!isAllowedEmail(me?.email)) throw new Error(NOT_ALLOWED);
    const admin = isAdminEmail(me?.email);

    const locks = await ctx.db
      .query("fileLocks")
      .collect();
    let n = 0;
    for (const lock of locks) {
      if (lock.branch !== branch) continue;
      if (lock.userId !== userId && !admin) continue;
      await ctx.db.delete(lock._id);
      await logEvent(ctx, "release", lock, "branch");
      n++;
    }
    return n;
  },
});

// Solo admins: limpia los locks "huérfanos" (más viejos que `olderThanHours`).
// Es la versión de un clic de lo que antes había que soltar uno por uno.
export const releaseStale = mutation({
  args: { olderThanHours: v.number() },
  handler: async (ctx, { olderThanHours }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Tienes que iniciar sesión.");

    const me = await ctx.db.get(userId);
    if (!isAdminEmail(me?.email)) {
      throw new Error("Solo un admin puede limpiar huérfanos.");
    }

    const cutoff = Date.now() - olderThanHours * 60 * 60 * 1000;
    const locks = await ctx.db.query("fileLocks").collect();
    let n = 0;
    for (const lock of locks) {
      if (lock._creationTime >= cutoff) continue;
      await ctx.db.delete(lock._id);
      await logEvent(ctx, "release", lock, "stale");
      n++;
    }
    return n;
  },
});

// Historial reciente para el panel de actividad. Acotado a 30 eventos.
export const recentEvents = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const me = await ctx.db.get(userId);
    if (!isAllowedEmail(me?.email)) return [];
    return await ctx.db.query("lockEvents").order("desc").take(30);
  },
});
