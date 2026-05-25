import { z } from "zod";
import { eq } from "drizzle-orm";
import { publicQuery, adminQuery, createRouter } from "../middleware";
import { getDb } from "../queries/connection";
import { settings } from "@db/schema";

export const settingsRouter = createRouter({
  getAll: publicQuery.query(async () => {
    const db = getDb();
    const result = await db.select().from(settings);
    const map: Record<string, string | null> = {};
    for (const row of result) {
      map[row.key] = row.value;
    }
    return {
      storeName: map.storeName ?? "ABI MOD",
      storeEmail: map.storeEmail ?? "abi-mod@outlook.com",
      storePhone: map.storePhone ?? "0798 43 65 28",
      whatsappNumber: map.whatsappNumber ?? "213798436528",
      whatsappMessage: map.whatsappMessage ?? "Hello ABI MOD!",
      facebookUrl: map.facebookUrl ?? "",
      instagramUrl: map.instagramUrl ?? "",
      tiktokUrl: map.tiktokUrl ?? "",
      currency: map.currency ?? "DZD",
      darkMode: map.darkMode ?? "false",
    };
  }),

  get: publicQuery
    .input(z.object({ key: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const result = await db
        .select()
        .from(settings)
        .where(eq(settings.key, input.key))
        .limit(1);
      return result[0]?.value ?? null;
    }),

  // Admin
  update: adminQuery
    .input(z.record(z.string(), z.string().nullable()))
    .mutation(async ({ input }) => {
      const db = getDb();
      for (const [key, value] of Object.entries(input)) {
        const existing = await db
          .select()
          .from(settings)
          .where(eq(settings.key, key))
          .limit(1);

        if (existing[0]) {
          await db
            .update(settings)
            .set({ value })
            .where(eq(settings.key, key));
        } else {
          await db.insert(settings).values({ key, value });
        }
      }
      return { success: true };
    }),
});
