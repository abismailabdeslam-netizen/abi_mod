import { sql, eq, desc, gte } from "drizzle-orm";
import { adminQuery, createRouter } from "../middleware";
import { getDb } from "../queries/connection";
import { orders, orderItems, products, reviews } from "@db/schema";

export const analyticsRouter = createRouter({
  dashboard: adminQuery.query(async () => {
    const db = getDb();

    // Total orders
    const totalOrdersResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders);
    const totalOrders = Number(totalOrdersResult[0]?.count ?? 0);

    // Financial Revenue (المردود المالي) - all orders except cancelled
    const revenueResult = await db
      .select({ total: sql<string>`COALESCE(SUM(total), 0)` })
      .from(orders)
      .where(sql`status != 'cancelled'`);
    const totalRevenue = Number(revenueResult[0]?.total ?? 0);

    // Total products
    const productsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(eq(products.isActive, true));
    const totalProducts = Number(productsResult[0]?.count ?? 0);

    // Pending orders
    const pendingResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(eq(orders.status, "pending"));
    const pendingOrders = Number(pendingResult[0]?.count ?? 0);

    // Reviews - average rating and total reviews
    const reviewsResult = await db
      .select({
        avgRating: sql<string>`COALESCE(AVG(rating), 0)`,
        count: sql<number>`count(*)`,
      })
      .from(reviews)
      .where(eq(reviews.isApproved, true));
    const avgRating = Number(Number(reviewsResult[0]?.avgRating ?? 0).toFixed(1));
    const totalReviews = Number(reviewsResult[0]?.count ?? 0);

    // Recent orders
    const recentOrders = await db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(10);

    // Orders by status
    const statusResult = await db
      .select({
        status: orders.status,
        count: sql<number>`count(*)`,
      })
      .from(orders)
      .groupBy(orders.status);

    // Sales by day (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const salesByDay = await db
      .select({
        date: sql<string>`DATE(created_at)`,
        amount: sql<string>`COALESCE(SUM(total), 0)`,
      })
      .from(orders)
      .where(gte(orders.createdAt, thirtyDaysAgo))
      .groupBy(sql`DATE(created_at)`)
      .orderBy(sql`DATE(created_at)`);

    // Top products by quantity sold
    const topProducts = await db
      .select({
        productName: orderItems.productName,
        sold: sql<number>`SUM(quantity)`,
        revenue: sql<string>`SUM(price * quantity)`,
      })
      .from(orderItems)
      .groupBy(orderItems.productName)
      .orderBy(desc(sql`SUM(quantity)`))
      .limit(10);

    return {
      totalOrders,
      totalRevenue,
      totalProducts,
      pendingOrders,
      avgRating,
      totalReviews,
      recentOrders,
      ordersByStatus: statusResult,
      salesByDay: salesByDay.map((s) => ({
        date: s.date,
        amount: Number(s.amount),
      })),
      topProducts: topProducts.map((p) => ({
        name: p.productName,
        sold: Number(p.sold),
        revenue: Number(p.revenue),
      })),
    };
  }),
});
