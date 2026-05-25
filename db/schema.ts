import {
  pgTable,
  pgEnum,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  decimal,
  bigint,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ============ ENUMS ============
export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const deliveryTypeEnum = pgEnum("delivery_type", ["home", "office"]);
export const orderStatusEnum = pgEnum("order_status", ["pending", "confirmed", "shipped", "delivered", "cancelled", "not_reached"]);
export const notificationTypeEnum = pgEnum("notification_type", ["new_order", "low_stock", "review"]);
export const discountTypeEnum = pgEnum("discount_type", ["percentage", "fixed_amount", "free_shipping", "bundle"]);

// ============ USERS ============
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("union_id", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: userRoleEnum("role").default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastSignInAt: timestamp("last_sign_in_at").defaultNow().notNull(),
});
export type User = typeof users.$inferSelect;

// ============ CATEGORIES ============
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  nameEn: varchar("name_en", { length: 255 }).notNull(),
  nameFr: varchar("name_fr", { length: 255 }),
  nameAr: varchar("name_ar", { length: 255 }),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  descriptionEn: text("description_en"),
  descriptionFr: text("description_fr"),
  descriptionAr: text("description_ar"),
  image: text("image"),
  parentId: integer("parent_id"),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
export type Category = typeof categories.$inferSelect;

// ============ COMMUNES ============
export const communes = pgTable("communes", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  wilaya: varchar("wilaya", { length: 100 }).notNull(),
  isActive: boolean("is_active").default(true),
});
export type Commune = typeof communes.$inferSelect;

// ============ DELIVERY COMPANIES ============
export const deliveryCompanies = pgTable("delivery_companies", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});
export type DeliveryCompany = typeof deliveryCompanies.$inferSelect;

// ============ SHIPPING PROFILES ============
export const shippingProfiles = pgTable("shipping_profiles", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  originWilaya: varchar("origin_wilaya", { length: 100 }).notNull(),
  companyId: integer("company_id"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});
export type ShippingProfile = typeof shippingProfiles.$inferSelect;

// ============ SHIPPING PROFILE PRICES ============
export const shippingProfilePrices = pgTable("shipping_profile_prices", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id").notNull(),
  destinationWilaya: varchar("destination_wilaya", { length: 100 }).notNull(),
  homePrice: decimal("home_price", { precision: 10, scale: 2 }).notNull(),
  officePrice: decimal("office_price", { precision: 10, scale: 2 }).notNull(),
});
export type ShippingProfilePrice = typeof shippingProfilePrices.$inferSelect;

// ============ PRODUCTS ============
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  nameEn: varchar("name_en", { length: 255 }).notNull(),
  nameFr: varchar("name_fr", { length: 255 }),
  nameAr: varchar("name_ar", { length: 255 }),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  descriptionEn: text("description_en"),
  descriptionFr: text("description_fr"),
  descriptionAr: text("description_ar"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  oldPrice: decimal("old_price", { precision: 10, scale: 2 }),
  costPrice: decimal("cost_price", { precision: 10, scale: 2 }),
  sku: varchar("sku", { length: 100 }),
  stockQuantity: integer("stock_quantity").default(0),
  stockLocation: varchar("stock_location", { length: 255 }),
  categoryId: integer("category_id"),
  shippingProfileId: integer("shipping_profile_id"),
  images: text("images").default("[]"),
  colors: text("colors").default("[]"),
  sizes: text("sizes").default("[]"),
  isActive: boolean("is_active").default(true),
  isFeatured: boolean("is_featured").default(false),
  isBestseller: boolean("is_bestseller").default(false),
  isNewArrival: boolean("is_new_arrival").default(true),
  viewCount: integer("view_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
export type Product = typeof products.$inferSelect;

// ============ BUNDLES ============
export const bundles = pgTable("bundles", {
  id: serial("id").primaryKey(),
  nameEn: varchar("name_en", { length: 255 }).notNull(),
  nameFr: varchar("name_fr", { length: 255 }),
  nameAr: varchar("name_ar", { length: 255 }),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  descriptionEn: text("description_en"),
  descriptionFr: text("description_fr"),
  descriptionAr: text("description_ar"),
  image: text("image"),
  bundlePrice: decimal("bundle_price", { precision: 10, scale: 2 }).notNull(),
  originalTotalPrice: decimal("original_total_price", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});
export type Bundle = typeof bundles.$inferSelect;

export const bundleItems = pgTable("bundle_items", {
  id: serial("id").primaryKey(),
  bundleId: integer("bundle_id").notNull(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").default(1),
});
export type BundleItem = typeof bundleItems.$inferSelect;

// ============ DISCOUNT RULES ============
export const discountRules = pgTable("discount_rules", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: discountTypeEnum("type").notNull(),
  value: decimal("value", { precision: 10, scale: 2 }),
  minOrderValue: decimal("min_order_value", { precision: 10, scale: 2 }),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});
export type DiscountRule = typeof discountRules.$inferSelect;

// ============ ORDERS ============
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: varchar("order_number", { length: 50 }).notNull().unique(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  wilaya: varchar("wilaya", { length: 100 }).notNull(),
  commune: varchar("commune", { length: 100 }).notNull(),
  deliveryType: deliveryTypeEnum("delivery_type").notNull(),
  deliveryCompany: varchar("delivery_company", { length: 100 }),
  shippingPrice: decimal("shipping_price", { precision: 10, scale: 2 }).notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  status: orderStatusEnum("status").default("pending").notNull(),
  notes: text("notes"),
  ipAddress: varchar("ip_address", { length: 45 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
export type Order = typeof orders.$inferSelect;

// ============ ORDER ITEMS ============
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  productId: integer("product_id"),
  bundleId: integer("bundle_id"),
  productName: varchar("product_name", { length: 255 }).notNull(),
  productImage: text("product_image"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull(),
  color: varchar("color", { length: 100 }),
  size: varchar("size", { length: 50 }),
});
export type OrderItem = typeof orderItems.$inferSelect;

// ============ REVIEWS ============
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  isApproved: boolean("is_approved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});
export type Review = typeof reviews.$inferSelect;

// ============ NOTIFICATIONS ============
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  type: notificationTypeEnum("type").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  entityId: integer("entity_id"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});
export type Notification = typeof notifications.$inferSelect;

// ============ SETTINGS ============
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value"),
  updatedAt: timestamp("updated_at").defaultNow(),
});
export type Setting = typeof settings.$inferSelect;

// ============ ACTIVITY LOGS ============
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entity_type", { length: 50 }),
  entityId: integer("entity_id"),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow(),
});
