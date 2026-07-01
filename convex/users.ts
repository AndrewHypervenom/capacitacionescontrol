import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Devuelve el usuario que tiene la sesión iniciada (o null si no hay).
export const viewer = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db.get(userId);
  },
});
