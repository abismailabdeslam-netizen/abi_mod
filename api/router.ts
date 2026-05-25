import { createRouter, publicQuery } from "./middleware";
import { productRouter } from "./routers/product";
import { categoryRouter } from "./routers/category";
import { communeRouter } from "./routers/commune";
import { deliveryCompanyRouter } from "./routers/delivery-company";
import { shippingProfileRouter } from "./routers/shipping-profile";
import { orderRouter } from "./routers/order";
import { settingsRouter } from "./routers/settings";
import { reviewRouter } from "./routers/review";
import { analyticsRouter } from "./routers/analytics";
import { bundleRouter } from "./routers/bundle";
import { notificationRouter } from "./routers/notification";
import { discountRouter } from "./routers/discount";
import { createRouter as trpcRouter } from "./middleware";
import { authedQuery } from "./middleware";

const authRouter = trpcRouter({
  me: authedQuery.query((opts) => opts.ctx.user),
  logout: authedQuery.mutation(async () => ({ success: true })),
});

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  product: productRouter,
  category: categoryRouter,
  commune: communeRouter,
  deliveryCompany: deliveryCompanyRouter,
  shippingProfile: shippingProfileRouter,
  order: orderRouter,
  settings: settingsRouter,
  review: reviewRouter,
  analytics: analyticsRouter,
  bundle: bundleRouter,
  notification: notificationRouter,
  discount: discountRouter,
});

export type AppRouter = typeof appRouter;
