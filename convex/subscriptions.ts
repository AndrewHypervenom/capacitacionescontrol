import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { isAllowedEmail } from "./access";

const NOT_ALLOWED =
  "No tienes acceso a esta Mesa de Control. Pídele a un admin que te agregue.";

// Los archivos que YO estoy vigilando (para pintar el botón "🔔 Vigilando").
export const mine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const subs = await ctx.db
      .query("fileSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return subs.map((s) => s.filePath);
  },
});

// Pide que te avisen cuando `filePath` quede libre. Idempotente.
export const subscribe = mutation({
  args: { filePath: v.string() },
  handler: async (ctx, { filePath }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Tienes que iniciar sesión.");
    const me = await ctx.db.get(userId);
    if (!isAllowedEmail(me?.email)) throw new Error(NOT_ALLOWED);

    const path = filePath.trim();
    if (!path) throw new Error("Falta la ruta del archivo.");

    const existing = await ctx.db
      .query("fileSubscriptions")
      .withIndex("by_user_file", (q) =>
        q.eq("userId", userId).eq("filePath", path),
      )
      .unique();
    if (existing) return existing._id;

    return await ctx.db.insert("fileSubscriptions", {
      filePath: path,
      userId,
      userName: me?.name ?? me?.email ?? "Anónimo",
    });
  },
});

// Deja de vigilar un archivo.
export const unsubscribe = mutation({
  args: { filePath: v.string() },
  handler: async (ctx, { filePath }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Tienes que iniciar sesión.");
    const existing = await ctx.db
      .query("fileSubscriptions")
      .withIndex("by_user_file", (q) =>
        q.eq("userId", userId).eq("filePath", filePath.trim()),
      )
      .unique();
    if (existing) await ctx.db.delete(existing._id);
  },
});

// Avisos de "se liberó" aún no vistos, para mostrarlos dentro de la app.
export const myNotices = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("releaseNotices")
      .withIndex("by_user_seen", (q) =>
        q.eq("userId", userId).eq("seen", false),
      )
      .collect();
  },
});

// Marca avisos como vistos (tras mostrarlos). Se borran para no acumular.
export const dismissNotices = mutation({
  args: { ids: v.array(v.id("releaseNotices")) },
  handler: async (ctx, { ids }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return;
    for (const id of ids) {
      const n = await ctx.db.get(id);
      if (n && n.userId === userId) await ctx.db.delete(id);
    }
  },
});
