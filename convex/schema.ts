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
});
