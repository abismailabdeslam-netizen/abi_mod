import { z } from "zod";
import { eq, desc, sql, and, like } from "drizzle-orm";
import { publicQuery, adminQuery, createRouter } from "../middleware";
import { getDb } from "../queries/connection";
import { orders, orderItems, products, notifications } from "@db/schema";

function generateOrderNumber() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.floor(Math.random() * 999)
    .toString()
    .padStart(3, "0");
  return `ORD-${date}-${random}`;
}

export const orderRouter = createRouter({
  create: publicQuery
    .input(
      z.object({
        fullName: z.string().min(2),
        phone: z.string().min(9),
        wilaya: z.string(),
        commune: z.string(),
        deliveryType: z.enum(["home", "office"]),
        deliveryCompany: z.string().optional(),
        shippingPrice: z.number(),
        items: z.array(
          z.object({
            productId: z.number(),
            name: z.string(),
            image: z.string(),
            price: z.number(),
            quantity: z.number().min(1),
            color: z.string().optional(),
            size: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const orderNumber = generateOrderNumber();
      const subtotal = input.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      const total = subtotal + input.shippingPrice;

      const [orderResult] = await db.insert(orders).values({
        orderNumber,
        fullName: input.fullName,
        phone: input.phone,
        wilaya: input.wilaya,
        commune: input.commune,
        deliveryType: input.deliveryType,
        deliveryCompany: input.deliveryCompany,
        shippingPrice: String(input.shippingPrice),
        subtotal: String(subtotal),
        total: String(total),
        status: "pending",
      }).returning({ id: orders.id });

      const orderId = orderResult.id;

      for (const item of input.items) {
        await db.insert(orderItems).values({
          orderId,
          productId: item.productId,
          productName: item.name,
          productImage: item.image,
          price: String(item.price),
          quantity: item.quantity,
          color: item.color ?? null,
          size: item.size ?? null,
        });

        // Decrement stock
        await db
          .update(products)
          .set({
            stockQuantity: sql`stock_quantity - ${item.quantity}`,
          })
          .where(eq(products.id, item.productId));
      }

      // Create notification for new order
      await db.insert(notifications).values({
        type: "new_order",
        title: `New Order: ${orderNumber}`,
        message: `${input.fullName} - ${input.wilaya} - ${Number(total).toLocaleString()} DZD`,
        entityId: orderId,
      });

      return { id: orderId, orderNumber, total };
    }),

  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const orderResult = await db
        .select()
        .from(orders)
        .where(eq(orders.id, input.id))
        .limit(1);

      if (!orderResult[0]) return null;

      const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, input.id));

      return { ...orderResult[0], items };
    }),

  // Admin
  adminList: adminQuery
    .input(
      z
        .object({
          page: z.number().default(1),
          limit: z.number().default(20),
          status: z
            .enum(["pending", "confirmed", "shipped", "delivered", "cancelled", "not_reached"])
            .optional(),
          search: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const page = input?.page ?? 1;
      const limit = input?.limit ?? 20;
      const offset = (page - 1) * limit;
      const conditions = [];

      if (input?.status) {
        conditions.push(eq(orders.status, input.status));
      }

      if (input?.search) {
        conditions.push(
          like(orders.orderNumber, `%${input.search}%`)
        );
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const items = await db
        .select()
        .from(orders)
        .where(where)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(orders.createdAt));

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(where);

      const total = Number(countResult[0]?.count ?? 0);

      return { orders: items, total, page, totalPages: Math.ceil(total / limit) };
    }),

  getDetail: adminQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const orderResult = await db
        .select()
        .from(orders)
        .where(eq(orders.id, input.id))
        .limit(1);

      if (!orderResult[0]) return null;

      const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, input.id));

      return { ...orderResult[0], items };
    }),

  updateStatus: adminQuery
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["pending", "confirmed", "shipped", "delivered", "cancelled", "not_reached"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .update(orders)
        .set({ status: input.status })
        .where(eq(orders.id, input.id));
      return { success: true };
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(orderItems).where(eq(orderItems.orderId, input.id));
      await db.delete(orders).where(eq(orders.id, input.id));
      return { success: true };
    }),
});
