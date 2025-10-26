import { integer, jsonb, numeric, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { z } from 'zod';
import { tenantsTable } from './tenants';
import { opportunitiesTable } from './opportunities';
import { accountsTable } from './accounts';
import { usersTable } from './users';
import { applyRlsPolicies } from '../rls-helpers';

const tableName = 'estimates';

export const estimatesTable = pgTable(tableName, {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenantsTable.id),
  opportunityId: integer('opportunity_id').references(() => opportunitiesTable.id),
  accountId: integer('account_id').notNull().references(() => accountsTable.id),
  estimateNumber: text('estimate_number').notNull().unique(),
  description: text('description'),
  lineItems: jsonb('line_items'), // Array of {description, quantity, unitPrice, total}
  subtotal: numeric('subtotal', { precision: 12, scale: 2 }).notNull(),
  tax: numeric('tax', { precision: 12, scale: 2 }),
  total: numeric('total', { precision: 12, scale: 2 }).notNull(),
  status: text('status').notNull().default('draft'), // draft, sent, accepted, rejected
  validUntil: timestamp('valid_until'),
  createdBy: integer('created_by').references(() => usersTable.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, applyRlsPolicies(tableName));

const timestampSchema = z.string().datetime().or(z.date()).optional();
const numericSchema = z.string().or(z.number()).transform(val => String(val)).optional();

const lineItemSchema = z.object({
  description: z.string(),
  quantity: z.number(),
  unitPrice: z.number(),
  total: z.number(),
});

const estimateInsertSchema = z.object({
  tenantId: z.number(),
  opportunityId: z.number().optional(),
  accountId: z.number(),
  estimateNumber: z.string().min(1),
  description: z.string().optional(),
  lineItems: z.array(lineItemSchema).optional(),
  subtotal: numericSchema.refine((val) => val !== undefined, { message: "Subtotal is required" }),
  tax: numericSchema,
  total: numericSchema.refine((val) => val !== undefined, { message: "Total is required" }),
  status: z.enum(['draft', 'sent', 'accepted', 'rejected']).default('draft'),
  validUntil: timestampSchema,
  createdBy: z.number().optional(),
});

const estimateSelectSchema = estimateInsertSchema.extend({
  id: z.number(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export { estimateInsertSchema, estimateSelectSchema };
export type InsertEstimate = typeof estimatesTable.$inferInsert;
export type SelectEstimate = typeof estimatesTable.$inferSelect;
