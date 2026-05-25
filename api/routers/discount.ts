import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { publicQuery, adminQuery, createRouter } from "../middleware";
import { getDb } from "../queries/connection";
import { discountRules } from "@db/schema";

export const discountRouter = createRouter({
  // Public: List active discount rules
  list: publicQuery.query(async () => {
    const db = getDb();
    return db
      .select()
      .from(discountRules)
      .where(eq(discountRules.isActive, true))
      .orderBy(desc(discountRules.createdAt));
  }),

  // Admin: List all discount rules
  adminList: adminQuery.query(async () => {
    const db = getDb();
    return db
      .select()
      .from(discountRules)
      .orderBy(desc(discountRules.createdAt));
  }),

  // Admin: Create discount rule
  create: adminQuery
    .input(
      z.object({
        name: z.string().min(1),
        type: z.enum(["percentage", "fixed_amount", "free_shipping", "bundle"]),
        value: z.string().optional(),
        minOrderValue: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        isActive: z.boolean().default(true),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const [result] = await db.insert(discountRules).values({
        name: input.name,
        type: input.type,
        value: input.value ?? null,
        minOrderValue: input.minOrderValue ?? null,
        startDate: input.startDate ? new Date(input.startDate) : null,
        endDate: input.endDate ? new Date(input.endDate) : null,
        isActive: input.isActive,
      } as any).returning({ id: discountRules.id });
      return { id: result.id, ...input };
    }),

  // Admin: Update discount rule
  update: adminQuery
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        type: z.enum(["percentage", "fixed_amount", "free_shipping", "bundle"]).optional(),
        value: z.string().optional(),
        minOrderValue: z.string().optional(),
        startDate: z.string().optional().nullable(),
        endDate: z.string().optional().nullable(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, startDate, endDate, ...rest } = input;
      const data: Record<string, unknown> = { ...rest };
      if (startDate !== undefined) data.startDate = startDate ? new Date(startDate) : null;
      if (endDate !== undefined) data.endDate = endDate ? new Date(endDate) : null;
      await db.update(discountRules).set(data as any).where(eq(discountRules.id, id));
      return { success: true };
    }),

  // Admin: Delete discount rule
  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(discountRules).where(eq(discountRules.id, input.id));
      return { success: true };
    }),
});
