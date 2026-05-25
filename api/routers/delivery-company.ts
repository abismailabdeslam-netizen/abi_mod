import { z } from "zod";
import { eq } from "drizzle-orm";
import { publicQuery, adminQuery, createRouter } from "../middleware";
import { getDb } from "../queries/connection";
import { deliveryCompanies } from "@db/schema";

export const deliveryCompanyRouter = createRouter({
  // Public: List active delivery companies
  list: publicQuery.query(async () => {
    const db = getDb();
    return db.select().from(deliveryCompanies)
      .where(eq(deliveryCompanies.isActive, true))
      .orderBy(deliveryCompanies.name);
  }),

  // Admin: Create delivery company
  create: adminQuery
    .input(z.object({
      name: z.string().min(1),
      phone: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const [result] = await db.insert(deliveryCompanies).values({
        name: input.name,
        phone: input.phone ?? null,
      }).returning({ id: deliveryCompanies.id });
      return { id: result.id, ...input };
    }),

  // Admin: Update delivery company
  update: adminQuery
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      phone: z.string().optional(),
      website: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(deliveryCompanies).set(data).where(eq(deliveryCompanies.id, id));
      return { success: true };
    }),

  // Admin: Delete delivery company
  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(deliveryCompanies).where(eq(deliveryCompanies.id, input.id));
      return { success: true };
    }),
});
