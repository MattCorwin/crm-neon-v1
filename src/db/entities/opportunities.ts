import { integer, numeric, pgTable, pgPolicy, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { z } from 'zod';
import { tenantsTable } from './tenants';
import { leadsTable } from './leads';
import { accountsTable } from './accounts';
import { contactsTable } from './contacts';
import { usersTable } from './users';
import { appRole, migrationRole } from './roles';
import { hasTenantAccess, isMigrationRole } from '../rls-helpers';

export const opportunitiesTable = pgTable('opportunities', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenantsTable.id),
  leadId: integer('lead_id').references(() => leadsTable.id),
  accountId: integer('account_id').references(() => accountsTable.id),
  contactId: integer('contact_id').references(() => contactsTable.id),
  title: text('title').notNull(),
  description: text('description'),
  stage: text('stage').notNull().default('qualification'), // qualification, proposal, negotiation, closed_won, closed_lost
  value: numeric('value', { precision: 12, scale: 2 }),
  probability: integer('probability'), // 0-100
  expectedCloseDate: timestamp('expected_close_date'),
  assignedTo: integer('assigned_to').references(() => usersTable.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  closedAt: timestamp('closed_at'),
}, (table) => [
  // App role policy - restrictive tenant access
  pgPolicy('opportunities_app_policy', {
    for: 'all',
    as: 'restrictive',
    to: appRole,
    using: hasTenantAccess(table.tenantId),
  }),
  // Migration role policy - bypass RLS
  pgPolicy('opportunities_migration_policy', {
    for: 'all',
    as: 'restrictive',
    to: migrationRole,
    using: isMigrationRole(),
  }),
]);

const timestampSchema = z.string().datetime().or(z.date()).optional();
const numericSchema = z.string().or(z.number()).transform(val => String(val)).optional();

const opportunityInsertSchema = z.object({
  tenantId: z.number(),
  leadId: z.number().optional(),
  accountId: z.number().optional(),
  contactId: z.number().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  stage: z.enum(['qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost']).default('qualification'),
  value: numericSchema,
  probability: z.number().int().min(0).max(100).optional(),
  expectedCloseDate: timestampSchema,
  assignedTo: z.number().optional(),
  closedAt: timestampSchema,
});

const opportunitySelectSchema = opportunityInsertSchema.extend({
  id: z.number(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export { opportunityInsertSchema, opportunitySelectSchema };
export type InsertOpportunity = typeof opportunitiesTable.$inferInsert;
export type SelectOpportunity = typeof opportunitiesTable.$inferSelect;
