import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { z } from 'zod';
import { tenantsTable } from './tenants';
import { applyRlsPolicies } from '../rls-helpers';

const tableName = 'accounts';

export const accountsTable = pgTable(tableName, {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenantsTable.id),
  name: text('name').notNull(),
  type: text('type').notNull().default('prospect'), // prospect, customer, vendor, partner
  industry: text('industry'),
  website: text('website'),
  phone: text('phone'),
  addressLine1: text('address_line_1'),
  addressLine2: text('address_line_2'),
  city: text('city'),
  state: text('state'),
  zipCode: text('zip_code'),
  country: text('country'),
  status: text('status').notNull().default('active'), // active, inactive
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, applyRlsPolicies(tableName));


const timestampSchema = z.string().datetime().or(z.date()).optional();

const accountInsertSchema = z.object({
  tenantId: z.number(),
  name: z.string().min(1),
  type: z.enum(['prospect', 'customer', 'vendor', 'partner']).default('prospect'),
  industry: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  phone: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
});

const accountSelectSchema = accountInsertSchema.extend({
  id: z.number(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export { accountInsertSchema, accountSelectSchema };
export type InsertAccount = typeof accountsTable.$inferInsert;
export type SelectAccount = typeof accountsTable.$inferSelect;
