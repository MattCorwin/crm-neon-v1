import { integer, jsonb, numeric, pgTable, pgPolicy, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { z } from 'zod';
import { tenantsTable } from './tenants';
import { projectsTable } from './projects';
import { accountsTable } from './accounts';
import { appRole, migrationRole } from './roles';
import { hasTenantAccess, isMigrationRole } from '../rls-helpers';

export const invoicesTable = pgTable('invoices', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenantsTable.id),
  projectId: integer('project_id').references(() => projectsTable.id),
  accountId: integer('account_id').notNull().references(() => accountsTable.id),
  invoiceNumber: text('invoice_number').notNull().unique(),
  lineItems: jsonb('line_items'), // Array of {description, quantity, unitPrice, total}
  subtotal: numeric('subtotal', { precision: 12, scale: 2 }).notNull(),
  tax: numeric('tax', { precision: 12, scale: 2 }),
  total: numeric('total', { precision: 12, scale: 2 }).notNull(),
  status: text('status').notNull().default('draft'), // draft, sent, paid, overdue, cancelled
  dueDate: timestamp('due_date'),
  paidDate: timestamp('paid_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  // App role policy - restrictive tenant access
  pgPolicy('invoices_app_policy', {
    for: 'all',
    as: 'restrictive',
    to: appRole,
    using: hasTenantAccess(table.tenantId),
  }),
  // Migration role policy - bypass RLS
  pgPolicy('invoices_migration_policy', {
    for: 'all',
    as: 'restrictive',
    to: migrationRole,
    using: isMigrationRole(),
  }),
]);

const timestampSchema = z.string().datetime().or(z.date()).optional();
const numericSchema = z.string().or(z.number()).transform(val => String(val)).optional();

const lineItemSchema = z.object({
  description: z.string(),
  quantity: z.number(),
  unitPrice: z.number(),
  total: z.number(),
});

const invoiceInsertSchema = z.object({
  tenantId: z.number(),
  projectId: z.number().optional(),
  accountId: z.number(),
  invoiceNumber: z.string().min(1),
  lineItems: z.array(lineItemSchema).optional(),
  subtotal: numericSchema.refine((val) => val !== undefined, { message: "Subtotal is required" }),
  tax: numericSchema,
  total: numericSchema.refine((val) => val !== undefined, { message: "Total is required" }),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).default('draft'),
  dueDate: timestampSchema,
  paidDate: timestampSchema,
});

const invoiceSelectSchema = invoiceInsertSchema.extend({
  id: z.number(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export { invoiceInsertSchema, invoiceSelectSchema };
export type InsertInvoice = typeof invoicesTable.$inferInsert;
export type SelectInvoice = typeof invoicesTable.$inferSelect;
