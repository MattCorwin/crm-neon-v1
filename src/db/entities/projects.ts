import { integer, numeric, pgTable, pgPolicy, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { z } from 'zod';
import { tenantsTable } from './tenants';
import { opportunitiesTable } from './opportunities';
import { accountsTable } from './accounts';
import { usersTable } from './users';
import { appRole, migrationRole } from './roles';
import { hasTenantAccess, isMigrationRole } from '../rls-helpers';

export const projectsTable = pgTable('projects', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenantsTable.id),
  opportunityId: integer('opportunity_id').references(() => opportunitiesTable.id),
  accountId: integer('account_id').notNull().references(() => accountsTable.id),
  name: text('name').notNull(),
  description: text('description'),
  status: text('status').notNull().default('planning'), // planning, active, on_hold, completed, cancelled
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  budget: numeric('budget', { precision: 12, scale: 2 }),
  actualCost: numeric('actual_cost', { precision: 12, scale: 2 }),
  projectManagerId: integer('project_manager_id').references(() => usersTable.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  // App role policy - restrictive tenant access
  pgPolicy('projects_app_policy', {
    for: 'all',
    as: 'restrictive',
    to: appRole,
    using: hasTenantAccess(table.tenantId),
  }),
  // Migration role policy - bypass RLS
  pgPolicy('projects_migration_policy', {
    for: 'all',
    as: 'restrictive',
    to: migrationRole,
    using: isMigrationRole(),
  }),
]);

const timestampSchema = z.string().datetime().or(z.date()).optional();
const numericSchema = z.string().or(z.number()).transform(val => String(val)).optional();

const projectInsertSchema = z.object({
  tenantId: z.number(),
  opportunityId: z.number().optional(),
  accountId: z.number(),
  name: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['planning', 'active', 'on_hold', 'completed', 'cancelled']).default('planning'),
  startDate: timestampSchema,
  endDate: timestampSchema,
  budget: numericSchema,
  actualCost: numericSchema,
  projectManagerId: z.number().optional(),
});

const projectSelectSchema = projectInsertSchema.extend({
  id: z.number(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export { projectInsertSchema, projectSelectSchema };
export type InsertProject = typeof projectsTable.$inferInsert;
export type SelectProject = typeof projectsTable.$inferSelect;
