import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { isAdminEmail } from "./admins";
import { isAllowedEmail } from "./access";

const NOT_ALLOWED = "No tienes acceso a esta Mesa de Control. Pídele a un admin que te agregue.";

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

    return await ctx.db.insert("fileLocks", {
      filePath: trimmedPath,
      branch,
      userId,
      userName,
      color,
      note: cleanNote,
    });
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
  },
});
