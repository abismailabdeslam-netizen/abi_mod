import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { publicQuery, adminQuery, createRouter } from "../middleware";
import { getDb } from "../queries/connection";
import { shippingProfiles, shippingProfilePrices, deliveryCompanies } from "@db/schema";

export const shippingProfileRouter = createRouter({
  // Public: List active profiles with company name
  list: publicQuery.query(async () => {
    const db = getDb();
    return db.select({
      id: shippingProfiles.id,
      name: shippingProfiles.name,
      originWilaya: shippingProfiles.originWilaya,
      companyId: shippingProfiles.companyId,
      companyName: deliveryCompanies.name,
      isActive: shippingProfiles.isActive,
    }).from(shippingProfiles)
      .leftJoin(deliveryCompanies, eq(shippingProfiles.companyId, deliveryCompanies.id))
      .where(eq(shippingProfiles.isActive, true))
      .orderBy(shippingProfiles.name);
  }),

  // Public: Calculate shipping for a profile to a destination
  calculate: publicQuery
    .input(z.object({
      profileId: z.number(),
      destinationWilaya: z.string(),
      deliveryType: z.enum(["home", "office"]),
    }))
    .query(async ({ input }) => {
      const db = getDb();
      
      const profile = await db.select({
        id: shippingProfiles.id,
        name: shippingProfiles.name,
        originWilaya: shippingProfiles.originWilaya,
        companyId: shippingProfiles.companyId,
      }).from(shippingProfiles)
        .where(eq(shippingProfiles.id, input.profileId))
        .limit(1);

      if (!profile[0]) return { shippingPrice: 0, originWilaya: "" };

      const price = await db.select()
        .from(shippingProfilePrices)
        .where(and(
          eq(shippingProfilePrices.profileId, input.profileId),
          eq(shippingProfilePrices.destinationWilaya, input.destinationWilaya)
        ))
        .limit(1);

      if (!price[0]) return { shippingPrice: 0, originWilaya: profile[0].originWilaya };

      return {
        shippingPrice: input.deliveryType === "home" 
          ? Number(price[0].homePrice) 
          : Number(price[0].officePrice),
        originWilaya: profile[0].originWilaya,
      };
    }),

  // Admin: List all profiles
  adminList: adminQuery.query(async () => {
    const db = getDb();
    return db.select({
      id: shippingProfiles.id,
      name: shippingProfiles.name,
      originWilaya: shippingProfiles.originWilaya,
      companyId: shippingProfiles.companyId,
      companyName: deliveryCompanies.name,
      isActive: shippingProfiles.isActive,
    }).from(shippingProfiles)
      .leftJoin(deliveryCompanies, eq(shippingProfiles.companyId, deliveryCompanies.id))
      .orderBy(shippingProfiles.name);
  }),

  // Admin: Create profile with all prices (NEW - batch create)
  createWithPrices: adminQuery
    .input(z.object({
      name: z.string().min(1),
      originWilaya: z.string(),
      companyId: z.number().optional().default(0),
      prices: z.array(z.object({
        destinationWilaya: z.string(),
        homePrice: z.string(),
        officePrice: z.string(),
      })),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      
      // Create profile
      const [profileResult] = await db.insert(shippingProfiles).values({
        name: input.name,
        originWilaya: input.originWilaya,
        companyId: input.companyId,
      }).returning({ id: shippingProfiles.id });
      
      const profileId = profileResult.id;

      // Insert all prices
      if (input.prices.length > 0) {
        for (const price of input.prices) {
          await db.insert(shippingProfilePrices).values({
            profileId,
            destinationWilaya: price.destinationWilaya,
            homePrice: price.homePrice,
            officePrice: price.officePrice,
          });
        }
      }

      return { id: profileId, name: input.name, pricesCount: input.prices.length };
    }),

  // Admin: Update profile + replace all prices
  updateWithPrices: adminQuery
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      originWilaya: z.string().optional(),
      companyId: z.number().optional(),
      prices: z.array(z.object({
        destinationWilaya: z.string(),
        homePrice: z.string(),
        officePrice: z.string(),
      })),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, prices, ...profileData } = input;

      // Update profile
      const updateData: Record<string, unknown> = {};
      if (profileData.name) updateData.name = profileData.name;
      if (profileData.originWilaya) updateData.originWilaya = profileData.originWilaya;
      if (profileData.companyId) updateData.companyId = profileData.companyId;
      
      if (Object.keys(updateData).length > 0) {
        await db.update(shippingProfiles).set(updateData).where(eq(shippingProfiles.id, id));
      }

      // Delete old prices and insert new ones
      await db.delete(shippingProfilePrices).where(eq(shippingProfilePrices.profileId, id));
      
      for (const price of prices) {
        await db.insert(shippingProfilePrices).values({
          profileId: id,
          destinationWilaya: price.destinationWilaya,
          homePrice: price.homePrice,
          officePrice: price.officePrice,
        });
      }

      return { success: true, pricesCount: prices.length };
    }),

  // Admin: Delete profile
  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(shippingProfilePrices).where(eq(shippingProfilePrices.profileId, input.id));
      await db.delete(shippingProfiles).where(eq(shippingProfiles.id, input.id));
      return { success: true };
    }),

  // ============ PRICES ============
  
  // Admin: Get prices for a profile
  getPrices: adminQuery
    .input(z.object({ profileId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db.select()
        .from(shippingProfilePrices)
        .where(eq(shippingProfilePrices.profileId, input.profileId))
        .orderBy(shippingProfilePrices.destinationWilaya);
    }),

  // Admin: Set price for a destination (legacy - single)
  setPrice: adminQuery
    .input(z.object({
      profileId: z.number(),
      destinationWilaya: z.string(),
      homePrice: z.string(),
      officePrice: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const existing = await db.select()
        .from(shippingProfilePrices)
        .where(and(
          eq(shippingProfilePrices.profileId, input.profileId),
          eq(shippingProfilePrices.destinationWilaya, input.destinationWilaya)
        ))
        .limit(1);

      if (existing[0]) {
        await db.update(shippingProfilePrices)
          .set({ homePrice: input.homePrice, officePrice: input.officePrice })
          .where(eq(shippingProfilePrices.id, existing[0].id));
        return { id: existing[0].id, updated: true };
      } else {
        const [result] = await db.insert(shippingProfilePrices).values(input).returning({ id: shippingProfilePrices.id });
        return { id: result.id, updated: false };
      }
    }),

  // Admin: Delete price
  deletePrice: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(shippingProfilePrices).where(eq(shippingProfilePrices.id, input.id));
      return { success: true };
    }),
});
