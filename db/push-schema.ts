import "dotenv/config";
import { createConnection } from "mysql2/promise";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function pushSchema() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error("DATABASE_URL not set");

  // Parse connection URL
  const url = new URL(dbUrl);
  const connection = await createConnection({
    host: url.hostname,
    port: Number(url.port) || 4000,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1),
    ssl: { rejectUnauthorized: false },
  });

  console.log("Connected to database");

  // Create bundles table
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS bundles (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      name_en VARCHAR(255) NOT NULL,
      name_fr VARCHAR(255),
      name_ar VARCHAR(255),
      slug VARCHAR(255) NOT NULL UNIQUE,
      description_en TEXT,
      description_fr TEXT,
      description_ar TEXT,
      image VARCHAR(500),
      bundle_price DECIMAL(10,2) NOT NULL,
      original_total_price DECIMAL(10,2),
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log("bundles table created");

  // Create bundle_items table
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS bundle_items (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      bundle_id BIGINT UNSIGNED NOT NULL REFERENCES bundles(id),
      product_id BIGINT UNSIGNED NOT NULL REFERENCES products(id),
      quantity INT DEFAULT 1
    )
  `);
  console.log("bundle_items table created");

  // Create discount_rules table
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS discount_rules (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      type ENUM('percentage', 'fixed_amount', 'free_shipping', 'bundle') NOT NULL,
      value DECIMAL(10,2),
      min_order_value DECIMAL(10,2),
      start_date TIMESTAMP,
      end_date TIMESTAMP,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log("discount_rules table created");

  // Create notifications table
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS notifications (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      type ENUM('new_order', 'low_stock', 'review') NOT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT,
      entity_id BIGINT UNSIGNED,
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log("notifications table created");

  // Check orders table status enum - add not_reached if needed
  try {
    await connection.execute(`
      ALTER TABLE orders MODIFY COLUMN status 
      ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'not_reached') 
      NOT NULL DEFAULT 'pending'
    `);
    console.log("orders.status updated with not_reached");
  } catch (e) {
    console.log("orders.status may already have not_reached:", (e as Error).message);
  }

  // Check if products table has cost_price column
  const [productCols] = await connection.execute(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'products' AND COLUMN_NAME = 'cost_price'`
  );
  if ((productCols as any[]).length === 0) {
    await connection.execute(`ALTER TABLE products ADD COLUMN cost_price DECIMAL(10,2)`);
    console.log("Added cost_price to products");
  }

  // Check if products table has shipping_profile_id column
  const [shipCols] = await connection.execute(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'products' AND COLUMN_NAME = 'shipping_profile_id'`
  );
  if ((shipCols as any[]).length === 0) {
    await connection.execute(`ALTER TABLE products ADD COLUMN shipping_profile_id BIGINT UNSIGNED`);
    console.log("Added shipping_profile_id to products");
  }

  // Check if order_items has bundle_id
  const [bundleCols] = await connection.execute(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'order_items' AND COLUMN_NAME = 'bundle_id'`
  );
  if ((bundleCols as any[]).length === 0) {
    await connection.execute(`ALTER TABLE order_items ADD COLUMN bundle_id BIGINT UNSIGNED`);
    console.log("Added bundle_id to order_items");
  }

  await connection.end();
  console.log("Schema push complete!");
}

pushSchema().catch(console.error);
