import { z } from "zod";
import { eq } from "drizzle-orm";
import { publicQuery, adminQuery, createRouter } from "../middleware";
import { getDb } from "../queries/connection";
import { communes } from "@db/schema";

export const communeRouter = createRouter({
  // Public: List communes (optionally filter by wilaya)
  list: publicQuery
    .input(z.object({ wilaya: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      if (input?.wilaya) {
        return db.select().from(communes)
          .where(eq(communes.wilaya, input.wilaya))
          .orderBy(communes.name);
      }
      return db.select().from(communes).orderBy(communes.wilaya, communes.name);
    }),

  // Admin: Create
  create: adminQuery
    .input(z.object({ name: z.string(), wilaya: z.string() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const [result] = await db.insert(communes).values(input).returning({ id: communes.id });
      return { id: result.id, ...input };
    }),

  // Admin: Create multiple
  bulkCreate: adminQuery
    .input(z.array(z.object({ name: z.string(), wilaya: z.string() })))
    .mutation(async ({ input }) => {
      const db = getDb();
      const results = [];
      for (const row of input) {
        const [result] = await db.insert(communes).values(row).returning({ id: communes.id });
        results.push({ id: result.id, ...row });
      }
      return results;
    }),

  // Admin: Delete
  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(communes).where(eq(communes.id, input.id));
      return { success: true };
    }),
});
