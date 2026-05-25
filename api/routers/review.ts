import { z } from "zod";
import { eq, desc, and, sql } from "drizzle-orm";
import { publicQuery, adminQuery, createRouter } from "../middleware";
import { getDb } from "../queries/connection";
import { reviews } from "@db/schema";

export const reviewRouter = createRouter({
  list: publicQuery
    .input(z.object({ productId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db
        .select()
        .from(reviews)
        .where(
          and(
            eq(reviews.productId, input.productId),
            eq(reviews.isApproved, true)
          )
        )
        .orderBy(desc(reviews.createdAt));
    }),

  create: publicQuery
    .input(
      z.object({
        productId: z.number(),
        customerName: z.string(),
        rating: z.number().min(1).max(5),
        comment: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const [result] = await db.insert(reviews).values({
        ...input,
        isApproved: false,
      }).returning({ id: reviews.id });
      return { id: result.id, ...input };
    }),

  // Admin
  adminList: adminQuery
    .input(
      z
        .object({
          page: z.number().default(1),
          limit: z.number().default(20),
          productId: z.number().optional(),
          isApproved: z.boolean().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const page = input?.page ?? 1;
      const limit = input?.limit ?? 20;
      const offset = (page - 1) * limit;
      const conditions = [];

      if (input?.productId) {
        conditions.push(eq(reviews.productId, input.productId));
      }

      if (input?.isApproved !== undefined) {
        conditions.push(eq(reviews.isApproved, input.isApproved));
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const items = await db
        .select()
        .from(reviews)
        .where(where)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(reviews.createdAt));

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(reviews)
        .where(where);

      return {
        reviews: items,
        total: Number(countResult[0]?.count ?? 0),
        page,
        totalPages: Math.ceil(Number(countResult[0]?.count ?? 0) / limit),
      };
    }),

  approve: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .update(reviews)
        .set({ isApproved: true })
        .where(eq(reviews.id, input.id));
      return { success: true };
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(reviews).where(eq(reviews.id, input.id));
      return { success: true };
    }),
});
