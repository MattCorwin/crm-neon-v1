import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { z } from 'zod';
import { tenantsTable } from './tenants';
import { projectsTable } from './projects';
import { usersTable } from './users';
import { applyRlsPolicies } from '../rls-helpers';

const tableName = 'jobs';

export const jobsTable = pgTable(tableName, {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenantsTable.id),
  projectId: integer('project_id').notNull().references(() => projectsTable.id),
  name: text('name').notNull(),
  description: text('description'),
  status: text('status').notNull().default('pending'), // pending, in_progress, completed, cancelled
  scheduledStart: timestamp('scheduled_start'),
  scheduledEnd: timestamp('scheduled_end'),
  assignedTo: integer('assigned_to').references(() => usersTable.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, applyRlsPolicies(tableName));

const timestampSchema = z.string().datetime().or(z.date()).optional();

const jobInsertSchema = z.object({
  tenantId: z.number(),
  projectId: z.number(),
  name: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).default('pending'),
  scheduledStart: timestampSchema,
  scheduledEnd: timestampSchema,
  assignedTo: z.number().optional(),
});

const jobSelectSchema = jobInsertSchema.extend({
  id: z.number(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export { jobInsertSchema, jobSelectSchema };
export type InsertJob = typeof jobsTable.$inferInsert;
export type SelectJob = typeof jobsTable.$inferSelect;
