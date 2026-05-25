import { z } from "zod";
import { eq, and, like, desc, asc, sql, gte, lte, gt } from "drizzle-orm";
import { publicQuery, adminQuery } from "../middleware";
import { createRouter } from "../middleware";
import { getDb } from "../queries/connection";
import { products, categories } from "@db/schema";
import { generateSlug } from "../lib/slug";

export const productRouter = createRouter({
  list: publicQuery
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(12),
        category: z.string().optional(),
        sort: z
          .enum(["newest", "price_asc", "price_desc", "bestsellers", "name_asc"])
          .default("newest"),
        search: z.string().optional(),
        colors: z.array(z.string()).optional(),
        sizes: z.array(z.string()).optional(),
        minPrice: z.number().optional(),
        maxPrice: z.number().optional(),
        inStock: z.boolean().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const offset = (input.page - 1) * input.limit;
      const conditions = [eq(products.isActive, true)];

      if (input.category) {
        const cat = await db
          .select()
          .from(categories)
          .where(eq(categories.slug, input.category))
          .limit(1);
        if (cat[0]) {
          conditions.push(eq(products.categoryId, cat[0].id));
        }
      }

      if (input.search) {
        conditions.push(like(products.nameEn, `%${input.search}%`));
      }

      if (input.inStock) {
        conditions.push(gt(products.stockQuantity, 0));
      }

      if (input.minPrice) {
        conditions.push(gte(products.price, String(input.minPrice)));
      }

      if (input.maxPrice) {
        conditions.push(lte(products.price, String(input.maxPrice)));
      }

      const where = and(...conditions);

      let orderBy;
      switch (input.sort) {
        case "price_asc":
          orderBy = asc(products.price);
          break;
        case "price_desc":
          orderBy = desc(products.price);
          break;
        case "bestsellers":
          orderBy = desc(products.isBestseller);
          break;
        case "name_asc":
          orderBy = asc(products.nameEn);
          break;
        default:
          orderBy = desc(products.createdAt);
      }

      const items = await db
        .select()
        .from(products)
        .where(where)
        .limit(input.limit)
        .offset(offset)
        .orderBy(orderBy);

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .where(where);

      const total = Number(countResult[0]?.count ?? 0);

      return {
        products: items,
        total,
        page: input.page,
        totalPages: Math.ceil(total / input.limit),
      };
    }),

  getBySlug: publicQuery
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const result = await db
        .select({
          id: products.id,
          nameEn: products.nameEn,
          nameFr: products.nameFr,
          nameAr: products.nameAr,
          slug: products.slug,
          descriptionEn: products.descriptionEn,
          descriptionFr: products.descriptionFr,
          descriptionAr: products.descriptionAr,
          price: products.price,
          oldPrice: products.oldPrice,
          costPrice: products.costPrice,
          sku: products.sku,
          stockQuantity: products.stockQuantity,
          stockLocation: products.stockLocation,
          categoryId: products.categoryId,
          images: products.images,
          colors: products.colors,
          sizes: products.sizes,
          isActive: products.isActive,
          isFeatured: products.isFeatured,
          isBestseller: products.isBestseller,
          isNewArrival: products.isNewArrival,
          viewCount: products.viewCount,
          createdAt: products.createdAt,
          updatedAt: products.updatedAt,
          categoryName: categories.nameEn,
        })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(eq(products.slug, input.slug))
        .limit(1);
      return result[0] ?? null;
    }),

  featured: publicQuery
    .input(z.object({ limit: z.number().default(8) }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const limit = input?.limit ?? 8;
      return db
        .select()
        .from(products)
        .where(eq(products.isFeatured, true))
        .limit(limit)
        .orderBy(desc(products.createdAt));
    }),

  related: publicQuery
    .input(
      z.object({
        productId: z.number(),
        limit: z.number().default(8),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const product = await db
        .select()
        .from(products)
        .where(eq(products.id, input.productId))
        .limit(1);
      if (!product[0]) return [];

      return db
        .select()
        .from(products)
        .where(
          and(
            eq(products.categoryId, product[0].categoryId ?? 0),
            sql`${products.id} != ${input.productId}`,
            eq(products.isActive, true)
          )
        )
        .limit(input.limit)
        .orderBy(desc(products.createdAt));
    }),

  newArrivals: publicQuery
    .input(z.object({ limit: z.number().default(8) }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const limit = input?.limit ?? 8;
      return db
        .select()
        .from(products)
        .where(eq(products.isNewArrival, true))
        .limit(limit)
        .orderBy(desc(products.createdAt));
    }),

  bestsellers: publicQuery
    .input(z.object({ limit: z.number().default(8) }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const limit = input?.limit ?? 8;
      return db
        .select()
        .from(products)
        .where(eq(products.isBestseller, true))
        .limit(limit)
        .orderBy(desc(products.createdAt));
    }),

  getFilters: publicQuery.query(async () => {
    const db = getDb();
    const allProducts = await db
      .select({
        colors: products.colors,
        sizes: products.sizes,
        minPrice: sql<string>`MIN(${products.price})`,
        maxPrice: sql<string>`MAX(${products.price})`,
      })
      .from(products)
      .where(eq(products.isActive, true));

    const allColors = new Set<string>();
    const allSizes = new Set<string>();

    for (const p of allProducts) {
      (p.colors as string[] | null)?.forEach((c) => allColors.add(c));
      (p.sizes as string[] | null)?.forEach((s) => allSizes.add(s));
    }

    return {
      colors: Array.from(allColors),
      sizes: Array.from(allSizes),
      minPrice: Number(allProducts[0]?.minPrice ?? 0),
      maxPrice: Number(allProducts[0]?.maxPrice ?? 5000),
    };
  }),

  // Admin
  adminList: adminQuery
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(20),
        search: z.string().optional(),
        category: z.string().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const page = input?.page ?? 1;
      const limit = input?.limit ?? 20;
      const offset = (page - 1) * limit;
      const conditions = [];

      if (input?.search) {
        conditions.push(like(products.nameEn, `%${input.search}%`));
      }

      if (input?.category) {
        const cat = await db
          .select()
          .from(categories)
          .where(eq(categories.slug, input.category))
          .limit(1);
        if (cat[0]) {
          conditions.push(eq(products.categoryId, cat[0].id));
        }
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const items = await db
        .select()
        .from(products)
        .where(where)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(products.createdAt));

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .where(where);

      const total = Number(countResult[0]?.count ?? 0);

      return { products: items, total, page, totalPages: Math.ceil(total / limit) };
    }),

  create: adminQuery
    .input(
      z.object({
        nameEn: z.string(),
        nameFr: z.string().optional(),
        nameAr: z.string().optional(),
        descriptionEn: z.string().optional(),
        descriptionFr: z.string().optional(),
        descriptionAr: z.string().optional(),
        price: z.string(),
        oldPrice: z.string().optional(),
        costPrice: z.string().optional(),
        sku: z.string().optional(),
        stockQuantity: z.number().default(0),
        stockLocation: z.string().optional(),
        categoryId: z.number().optional(),
        shippingProfileId: z.number().optional(),
        images: z.array(z.string()).default([]),
        colors: z.array(z.string()).default([]),
        sizes: z.array(z.string()).default([]),
        isActive: z.boolean().default(true),
        isFeatured: z.boolean().default(false),
        isBestseller: z.boolean().default(false),
        isNewArrival: z.boolean().default(true),
        warehouseWilaya: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const baseSlug = generateSlug(input.nameEn);
      // Always unique: base slug + timestamp millis suffix
      const finalSlug = `${baseSlug}-${Date.now()}`;

      const data = {
        ...input,
        slug: finalSlug,
        images: input.images ? JSON.stringify(input.images) : "[]",
        colors: input.colors ? JSON.stringify(input.colors) : "[]",
        sizes: input.sizes ? JSON.stringify(input.sizes) : "[]",
      };
      const [result] = await db.insert(products).values(data as any).returning({ id: products.id });
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
        price: z.string().optional(),
        oldPrice: z.string().optional(),
        costPrice: z.string().optional(),
        sku: z.string().optional(),
        stockQuantity: z.number().optional(),
        stockLocation: z.string().optional(),
        warehouseWilaya: z.string().optional(),
        categoryId: z.number().optional(),
        shippingProfileId: z.number().optional(),
        images: z.array(z.string()).optional(),
        colors: z.array(z.string()).optional(),
        sizes: z.array(z.string()).optional(),
        isActive: z.boolean().optional(),
        isFeatured: z.boolean().optional(),
        isBestseller: z.boolean().optional(),
        isNewArrival: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input as any;
      
      // If nameEn is updated, regenerate slug with timestamp to guarantee uniqueness
      if (data.nameEn) {
        const baseSlug = generateSlug(data.nameEn);
        data.slug = `${baseSlug}-${Date.now()}`;
      }
      
      if (data.images) data.images = JSON.stringify(data.images);
      if (data.colors) data.colors = JSON.stringify(data.colors);
      if (data.sizes) data.sizes = JSON.stringify(data.sizes);
      await db.update(products).set(data).where(eq(products.id, id));
      return { success: true, id };
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(products).where(eq(products.id, input.id));
      return { success: true };
    }),
});
