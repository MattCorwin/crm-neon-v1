import { integer, pgTable, pgPolicy, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { z } from 'zod';
import { tenantsTable } from './tenants';
import { usersTable } from './users';
import { appRole, migrationRole } from './roles';
import { hasTenantAccess, isMigrationRole } from '../rls-helpers';

export const activitiesTable = pgTable('activities', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenantsTable.id),
  type: text('type').notNull(), // note, call, email, meeting
  subject: text('subject').notNull(),
  description: text('description'),
  // Polymorphic relationship to any entity
  relatedToType: text('related_to_type'), // lead, opportunity, project, account, contact, job
  relatedToId: integer('related_to_id'),
  createdBy: integer('created_by').references(() => usersTable.id),
  activityDate: timestamp('activity_date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  // App role policy - restrictive tenant access
  pgPolicy('activities_app_policy', {
    for: 'all',
    as: 'restrictive',
    to: appRole,
    using: hasTenantAccess(table.tenantId),
  }),
  // Migration role policy - bypass RLS
  pgPolicy('activities_migration_policy', {
    for: 'all',
    as: 'restrictive',
    to: migrationRole,
    using: isMigrationRole(),
  }),
]);

const timestampSchema = z.string().datetime().or(z.date()).optional();

const activityInsertSchema = z.object({
  tenantId: z.number(),
  type: z.enum(['note', 'call', 'email', 'meeting']),
  subject: z.string().min(1),
  description: z.string().optional(),
  relatedToType: z.enum(['lead', 'opportunity', 'project', 'account', 'contact', 'job']).optional(),
  relatedToId: z.number().optional(),
  createdBy: z.number().optional(),
  activityDate: z.string().datetime().or(z.date()),
});

const activitySelectSchema = activityInsertSchema.extend({
  id: z.number(),
  createdAt: timestampSchema,
});

export { activityInsertSchema, activitySelectSchema };
export type InsertActivity = typeof activitiesTable.$inferInsert;
export type SelectActivity = typeof activitiesTable.$inferSelect;
