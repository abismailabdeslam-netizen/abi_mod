import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { publicQuery, adminQuery, createRouter } from "../middleware";
import { getDb } from "../queries/connection";
import { categories, products } from "@db/schema";
import { generateSlug } from "../lib/slug";

export const categoryRouter = createRouter({
  list: publicQuery.query(async () => {
    const db = getDb();
    const cats = await db
      .select()
      .from(categories)
      .where(eq(categories.isActive, true))
      .orderBy(categories.sortOrder);

    // Get product counts
    const result = await Promise.all(
      cats.map(async (cat) => {
        const countResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(products)
          .where(eq(products.categoryId, cat.id));
        return { ...cat, productCount: Number(countResult[0]?.count ?? 0) };
      })
    );

    return result;
  }),

  getBySlug: publicQuery
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const result = await db
        .select()
        .from(categories)
        .where(eq(categories.slug, input.slug))
        .limit(1);
      return result[0] ?? null;
    }),

  // Admin
  create: adminQuery
    .input(
      z.object({
        nameEn: z.string(),
        nameFr: z.string().optional(),
        nameAr: z.string().optional(),
        descriptionEn: z.string().optional(),
        descriptionFr: z.string().optional(),
        descriptionAr: z.string().optional(),
        parentId: z.number().optional(),
        image: z.string().optional(),
        sortOrder: z.number().default(0),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const baseSlug = generateSlug(input.nameEn);
      const finalSlug = `${baseSlug}-${Date.now()}`;

      const [result] = await db.insert(categories).values({ ...input, slug: finalSlug }).returning({ id: categories.id });
      return { id: result.id, slug: finalSlug, ...input };
    }),

  update: adminQuery
    .input(
      z.object({
        id: z.number(),
        nameEn: z.string().optional(),
        nameFr: z.string().optional(),
        nameAr: z.string().optional(),
        descriptionEn: z.string().optional(),
        descriptionFr: z.string().optional(),
        descriptionAr: z.string().optional(),
        parentId: z.number().optional(),
        image: z.string().optional(),
        sortOrder: z.number().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      
      // If nameEn is updated, regenerate slug with timestamp to guarantee uniqueness
      if (data.nameEn) {
        const baseSlug = generateSlug(data.nameEn);
        (data as any).slug = `${baseSlug}-${Date.now()}`;
      }

      await db.update(categories).set(data).where(eq(categories.id, id));
      return { success: true, id };
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(categories).where(eq(categories.id, input.id));
      return { success: true };
    }),
});
