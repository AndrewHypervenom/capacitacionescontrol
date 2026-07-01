import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";

// Mantenimiento periódico: borra eventos de bitácora viejos (>30 días) y filas
// de presencia rancias (>1 día). Mantiene las tablas pequeñas sin intervención.
export const cleanup = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const eventCutoff = now - 30 * 24 * 60 * 60 * 1000;
    const presenceCutoff = now - 24 * 60 * 60 * 1000;

    // Eventos: los más viejos salen primero (orden ascendente por creación).
    const oldEvents = await ctx.db.query("lockEvents").order("asc").take(200);
    for (const e of oldEvents) {
      if (e._creationTime < eventCutoff) await ctx.db.delete(e._id);
    }

    // Presencia: a lo sumo una fila por persona, así que un take amplio basta.
    const presence = await ctx.db.query("presence").take(500);
    for (const p of presence) {
      if (p.lastSeen < presenceCutoff) await ctx.db.delete(p._id);
    }
  },
});

const crons = cronJobs();
crons.interval(
  "cleanup events and presence",
  { hours: 6 },
  internal.crons.cleanup,
  {},
);

export default crons;
