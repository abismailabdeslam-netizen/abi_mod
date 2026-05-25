import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { publicQuery, adminQuery, createRouter } from "../middleware";
import { getDb } from "../queries/connection";
import { bundles, bundleItems, products } from "@db/schema";

export const bundleRouter = createRouter({
  // Public: List active bundles
  list: publicQuery.query(async () => {
    const db = getDb();
    const allBundles = await db
      .select()
      .from(bundles)
      .where(eq(bundles.isActive, true))
      .orderBy(desc(bundles.createdAt));

    const result = await Promise.all(
      allBundles.map(async (bundle) => {
        const items = await db
          .select({
            id: bundleItems.id,
            productId: bundleItems.productId,
            quantity: bundleItems.quantity,
            productName: products.nameEn,
            productImage: products.images,
            productPrice: products.price,
          })
          .from(bundleItems)
          .leftJoin(products, eq(bundleItems.productId, products.id))
          .where(eq(bundleItems.bundleId, bundle.id));

        return {
          ...bundle,
          items: items.map((item) => ({
            ...item,
            productImage: (item.productImage as string | null)?.[0] ?? "",
          })),
        };
      })
    );

    return result;
  }),

  // Public: Get single bundle by slug
  getBySlug: publicQuery
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const bundle = await db
        .select()
        .from(bundles)
        .where(eq(bundles.slug, input.slug))
        .limit(1);

      if (!bundle[0]) return null;

      const items = await db
        .select({
          id: bundleItems.id,
          productId: bundleItems.productId,
          quantity: bundleItems.quantity,
          productName: products.nameEn,
          productImage: products.images,
          productPrice: products.price,
        })
        .from(bundleItems)
        .leftJoin(products, eq(bundleItems.productId, products.id))
        .where(eq(bundleItems.bundleId, bundle[0].id));

      return {
        ...bundle[0],
        items: items.map((item) => ({
          ...item,
          productImage: (item.productImage as string | null)?.[0] ?? "",
        })),
      };
    }),

  // Admin: List all bundles
  adminList: adminQuery.query(async () => {
    const db = getDb();
    const allBundles = await db
      .select()
      .from(bundles)
      .orderBy(desc(bundles.createdAt));

    const result = await Promise.all(
      allBundles.map(async (bundle) => {
        const items = await db
          .select({
            id: bundleItems.id,
            productId: bundleItems.productId,
            quantity: bundleItems.quantity,
            productName: products.nameEn,
            productImage: products.images,
          })
          .from(bundleItems)
          .leftJoin(products, eq(bundleItems.productId, products.id))
          .where(eq(bundleItems.bundleId, bundle.id));

        return { ...bundle, items };
      })
    );

    return result;
  }),

  // Admin: Create bundle
  create: adminQuery
    .input(
      z.object({
        nameEn: z.string(),
        nameFr: z.string().optional(),
        nameAr: z.string().optional(),
        slug: z.string(),
        descriptionEn: z.string().optional(),
        descriptionFr: z.string().optional(),
        descriptionAr: z.string().optional(),
        image: z.string().optional(),
        bundlePrice: z.string(),
        originalTotalPrice: z.string().optional(),
        productIds: z.array(z.number()),
        isActive: z.boolean().default(true),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { productIds, ...bundleData } = input;

      const [result] = await db.insert(bundles).values(bundleData).returning({ id: bundles.id });
      const bundleId = result.id;

      // Add bundle items
      for (const productId of productIds) {
        await db.insert(bundleItems).values({
          bundleId,
          productId,
          quantity: 1,
        });
      }

      return { id: bundleId, ...bundleData };
    }),

  // Admin: Update bundle
  update: adminQuery
    .input(
      z.object({
        id: z.number(),
        nameEn: z.string().optional(),
        nameFr: z.string().optional(),
        nameAr: z.string().optional(),
        slug: z.string().optional(),
        descriptionEn: z.string().optional(),
        descriptionFr: z.string().optional(),
        descriptionAr: z.string().optional(),
        image: z.string().optional(),
        bundlePrice: z.string().optional(),
        originalTotalPrice: z.string().optional(),
        productIds: z.array(z.number()).optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, productIds, ...data } = input;

      await db.update(bundles).set(data).where(eq(bundles.id, id));

      // If productIds provided, replace items
      if (productIds) {
        await db.delete(bundleItems).where(eq(bundleItems.bundleId, id));
        for (const productId of productIds) {
          await db.insert(bundleItems).values({ bundleId: id, productId, quantity: 1 });
        }
      }

      return { success: true, id };
    }),

  // Admin: Delete bundle
  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(bundleItems).where(eq(bundleItems.bundleId, input.id));
      await db.delete(bundles).where(eq(bundles.id, input.id));
      return { success: true };
    }),
});
