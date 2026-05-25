import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { publicQuery, adminQuery, createRouter } from "../middleware";
import { getDb } from "../queries/connection";
import { shippingProfilePrices, shippingProfiles, deliveryCompanies } from "@db/schema";

export const shippingRouter = createRouter({
  // Public: Calculate shipping using profiles
  calculate: publicQuery
    .input(
      z.object({
        originWilaya: z.string(),
        destinationWilaya: z.string(),
        deliveryType: z.enum(["home", "office"]),
        companyId: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();

      // Find matching profile
      let profileQuery;
      if (input.companyId) {
        profileQuery = and(
          eq(shippingProfiles.originWilaya, input.originWilaya),
          eq(shippingProfiles.companyId, input.companyId)
        );
      } else {
        profileQuery = eq(shippingProfiles.originWilaya, input.originWilaya);
      }

      const profile = await db
        .select({ id: shippingProfiles.id })
        .from(shippingProfiles)
        .where(profileQuery)
        .limit(1);

      if (!profile[0]) {
        return { shippingPrice: 0, companyName: "" };
      }

      const price = await db
        .select()
        .from(shippingProfilePrices)
        .where(
          and(
            eq(shippingProfilePrices.profileId, profile[0].id),
            eq(shippingProfilePrices.destinationWilaya, input.destinationWilaya)
          )
        )
        .limit(1);

      if (!price[0]) {
        return { shippingPrice: 0, companyName: "" };
      }

      return {
        shippingPrice:
          input.deliveryType === "home"
            ? Number(price[0].homePrice)
            : Number(price[0].officePrice),
        companyName: "",
      };
    }),

  // Public: List all available wilayas
  listWilayas: publicQuery.query(async () => {
    const db = getDb();
    const origins = await db
      .select({ originWilaya: shippingProfiles.originWilaya })
      .from(shippingProfiles)
      .where(eq(shippingProfiles.isActive, true));

    const destinations = await db
      .select({ destinationWilaya: shippingProfilePrices.destinationWilaya })
      .from(shippingProfilePrices);

    return {
      origins: [...new Set(origins.map((r) => r.originWilaya))].sort(),
      destinations: [...new Set(destinations.map((r) => r.destinationWilaya))].sort(),
    };
  }),

  // Admin: List all shipping configs
  list: adminQuery.query(async () => {
    const db = getDb();
    return db
      .select({
        id: shippingProfilePrices.id,
        profileId: shippingProfilePrices.profileId,
        originWilaya: shippingProfiles.originWilaya,
        destinationWilaya: shippingProfilePrices.destinationWilaya,
        homeDeliveryPrice: shippingProfilePrices.homePrice,
        officeDeliveryPrice: shippingProfilePrices.officePrice,
        companyName: deliveryCompanies.name,
      })
      .from(shippingProfilePrices)
      .leftJoin(shippingProfiles, eq(shippingProfilePrices.profileId, shippingProfiles.id))
      .leftJoin(deliveryCompanies, eq(shippingProfiles.companyId, deliveryCompanies.id))
      .orderBy(shippingProfiles.originWilaya, shippingProfilePrices.destinationWilaya);
  }),
});
