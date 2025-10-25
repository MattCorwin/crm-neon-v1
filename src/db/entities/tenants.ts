import { pgTable, pgPolicy, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { z } from 'zod';
import { appRole, migrationRole } from './roles';
import { isMigrationRole } from '../rls-helpers';

export const tenantsTable = pgTable('tenants', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  // App role policy - allow access to all tenants (tenants table is special)
  pgPolicy('tenants_app_policy', {
    for: 'all',
    as: 'restrictive',
    to: appRole,
    using: sql`true`, // App role can access all tenants
  }),
  // Migration role policy - bypass RLS
  pgPolicy('tenants_migration_policy', {
    for: 'all',
    as: 'restrictive',
    to: migrationRole,
    using: isMigrationRole(),
  }),
]);

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
