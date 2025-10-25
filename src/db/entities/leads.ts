import { integer, numeric, pgTable, pgPolicy, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { z } from 'zod';
import { tenantsTable } from './tenants';
import { accountsTable } from './accounts';
import { contactsTable } from './contacts';
import { usersTable } from './users';
import { appRole, migrationRole } from './roles';
import { hasTenantAccess, isMigrationRole } from '../rls-helpers';

export const leadsTable = pgTable('leads', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenantsTable.id),
  accountId: integer('account_id').references(() => accountsTable.id),
  contactId: integer('contact_id').references(() => contactsTable.id),
  title: text('title').notNull(),
  source: text('source'), // website, referral, cold_call, etc
  status: text('status').notNull().default('new'), // new, contacted, qualified, unqualified, converted
  value: numeric('value', { precision: 12, scale: 2 }),
  assignedTo: integer('assigned_to').references(() => usersTable.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  // App role policy - restrictive tenant access
  pgPolicy('leads_app_policy', {
    for: 'all',
    as: 'restrictive',
    to: appRole,
    using: hasTenantAccess(table.tenantId),
  }),
  // Migration role policy - bypass RLS
  pgPolicy('leads_migration_policy', {
    for: 'all',
    as: 'restrictive',
    to: migrationRole,
    using: isMigrationRole(),
  }),
]);

const timestampSchema = z.string().datetime().or(z.date()).optional();
const numericSchema = z.string().or(z.number()).transform(val => String(val)).optional();

const leadInsertSchema = z.object({
  tenantId: z.number(),
  accountId: z.number().optional(),
  contactId: z.number().optional(),
  title: z.string().min(1),
  source: z.string().optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'unqualified', 'converted']).default('new'),
  value: numericSchema,
  assignedTo: z.number().optional(),
});

const leadSelectSchema = leadInsertSchema.extend({
  id: z.number(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export { leadInsertSchema, leadSelectSchema };
export type InsertLead = typeof leadsTable.$inferInsert;
export type SelectLead = typeof leadsTable.$inferSelect;
