import { integer, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
// import { customers } from "./customers.ts";

export const invoices = pgTable("invoices", {
  id: text().primaryKey(),
  orderId: text().notNull(),
  createdAt: timestamp().notNull().defaultNow(),
});
