import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { z } from 'zod';
import { tenantsTable } from './tenants';
import { usersTable } from './users';
import { applyRlsPolicies } from '../rls-helpers';

const tableName = 'tasks';

export const tasksTable = pgTable(tableName, {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenantsTable.id),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').notNull().default('todo'), // todo, in_progress, done
  priority: text('priority').notNull().default('medium'), // low, medium, high, urgent
  dueDate: timestamp('due_date'),
  assignedTo: integer('assigned_to').references(() => usersTable.id),
  createdBy: integer('created_by').references(() => usersTable.id),
  // Polymorphic relationship to any entity
  relatedToType: text('related_to_type'), // lead, opportunity, project, account, contact, job
  relatedToId: integer('related_to_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
}, applyRlsPolicies(tableName));

const timestampSchema = z.string().datetime().or(z.date()).optional();

const taskInsertSchema = z.object({
  tenantId: z.number(),
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'done']).default('todo'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  dueDate: timestampSchema,
  assignedTo: z.number().optional(),
  createdBy: z.number().optional(),
  relatedToType: z.enum(['lead', 'opportunity', 'project', 'account', 'contact', 'job']).optional(),
  relatedToId: z.number().optional(),
  completedAt: timestampSchema,
});

const taskSelectSchema = taskInsertSchema.extend({
  id: z.number(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export { taskInsertSchema, taskSelectSchema };
export type InsertTask = typeof tasksTable.$inferInsert;
export type SelectTask = typeof tasksTable.$inferSelect;
