import { z } from "zod";
import { eq, desc, sql } from "drizzle-orm";
import { publicQuery, adminQuery, createRouter } from "../middleware";
import { getDb } from "../queries/connection";
import { notifications } from "@db/schema";

export const notificationRouter = createRouter({
  // Admin: List all notifications
  list: adminQuery.query(async () => {
    const db = getDb();
    const items = await db
      .select()
      .from(notifications)
      .orderBy(desc(notifications.createdAt))
      .limit(50);

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(eq(notifications.isRead, false));

    return { items, unreadCount: Number(countResult[0]?.count ?? 0) };
  }),

  // Admin: Create notification (usually called internally)
  create: adminQuery
    .input(
      z.object({
        type: z.enum(["new_order", "low_stock", "review"]),
        title: z.string(),
        message: z.string().optional(),
        entityId: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const [result] = await db.insert(notifications).values(input).returning({ id: notifications.id });
      return { id: result.id, ...input };
    }),

  // Admin: Mark as read
  markAsRead: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.id, input.id));
      return { success: true };
    }),

  // Admin: Mark all as read
  markAllRead: adminQuery.mutation(async () => {
    const db = getDb();
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.isRead, false));
    return { success: true };
  }),

  // Admin: Delete notification
  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(notifications).where(eq(notifications.id, input.id));
      return { success: true };
    }),
});
