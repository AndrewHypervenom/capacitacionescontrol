import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

// `authTables` añade las tablas que necesita Convex Auth (users, sessions, etc.).
export default defineSchema({
  ...authTables,

  // Un "lock" = una persona avisando que está trabajando un archivo en una rama.
  fileLocks: defineTable({
    filePath: v.string(),
    branch: v.string(),
    userId: v.id("users"),
    userName: v.string(), // copia del nombre para mostrar sin re-consultar users
    color: v.string(),
    note: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_file", ["filePath"])
    // Para el "upsert": misma persona + mismo archivo + misma rama = un solo lock.
    .index("by_user_file_branch", ["userId", "filePath", "branch"]),

  // Presencia "en vivo": un latido (heartbeat) por persona con la pestaña
  // abierta. Es dato de alta rotación, por eso vive en su propia tabla y no
  // dentro de `users` (así los latidos no pelean con las lecturas del perfil).
  presence: defineTable({
    userId: v.id("users"),
    userName: v.string(),
    lastSeen: v.number(), // ms epoch del último latido
  }).index("by_user", ["userId"]),

  // Bitácora/auditoría: cada vez que alguien marca o libera un archivo se guarda
  // un evento. Sirve para el historial y para entender "quién tocó qué y cuándo".
  lockEvents: defineTable({
    action: v.union(v.literal("claim"), v.literal("release")),
    filePath: v.string(),
    branch: v.string(),
    userId: v.id("users"),
    userName: v.string(),
    note: v.optional(v.string()),
    // Cómo se disparó la liberación: manual, limpieza de huérfanos o por rama.
    reason: v.optional(
      v.union(
        v.literal("manual"),
        v.literal("stale"),
        v.literal("branch"),
      ),
    ),
  }).index("by_file", ["filePath"]),
});
