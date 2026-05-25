import { sql } from "drizzle-orm";
import { getDb } from "../api/queries/connection";

async function updateSchema() {
  const db = getDb();

  // Drop old shipping_configs table
  try {
    await db.execute(sql`DROP TABLE IF EXISTS shipping_configs`);
    console.log("Dropped old shipping_configs");
  } catch (e) {
    // ignore
  }

  // Create delivery_companies
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS delivery_companies (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(50),
        website VARCHAR(255),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("Created delivery_companies");
  } catch (e: any) {
    console.log("delivery_companies:", e.message);
  }

  // Create shipping_matrix
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS shipping_matrix (
        id SERIAL PRIMARY KEY,
        company_id BIGINT UNSIGNED NOT NULL,
        origin_wilaya VARCHAR(100) NOT NULL,
        destination_wilaya VARCHAR(100) NOT NULL,
        home_price DECIMAL(10,2) NOT NULL,
        office_price DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("Created shipping_matrix");
  } catch (e: any) {
    console.log("shipping_matrix:", e.message);
  }

  // Add warehouse_wilaya to products
  try {
    await db.execute(sql`ALTER TABLE products ADD COLUMN warehouse_wilaya VARCHAR(100)`);
    console.log("Added warehouse_wilaya to products");
  } catch (e: any) {
    console.log("warehouse_wilaya:", e.message);
  }

  // Seed default delivery company
  try {
    await db.execute(sql`
      INSERT INTO delivery_companies (name, phone, is_active) 
      VALUES ('Yalidine', '023 23 23 23', true)
    `);
    console.log("Seeded Yalidine");
  } catch (e: any) {
    console.log("Seed:", e.message);
  }

  console.log("Schema update complete!");
}

updateSchema().catch(console.error);
