import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { z } from 'zod';
import { applyRlsPolicies } from '../rls-helpers';

const tableName = 'tenants';

export const tenantsTable = pgTable(tableName, {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, applyRlsPolicies(tableName));

const timestampSchema = z.string().datetime().or(z.date()).optional();

const tenantInsertSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
});

const tenantSelectSchema = tenantInsertSchema.extend({
  id: z.number(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export { tenantInsertSchema, tenantSelectSchema };
export type InsertTenant = typeof tenantsTable.$inferInsert;
export type SelectTenant = typeof tenantsTable.$inferSelect;
