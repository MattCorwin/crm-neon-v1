import { boolean, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { z } from 'zod';
import { tenantsTable } from './tenants';
import { accountsTable } from './accounts';
import { applyRlsPolicies } from '../rls-helpers';

const tableName = 'contacts';

export const contactsTable = pgTable(tableName, {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenantsTable.id),
  accountId: integer('account_id').references(() => accountsTable.id),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email'),
  phone: text('phone'),
  title: text('title'),
  role: text('role'), // decision_maker, influencer, user
  isPrimary: boolean('is_primary').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, applyRlsPolicies(tableName));

const timestampSchema = z.string().datetime().or(z.date()).optional();

const contactInsertSchema = z.object({
  tenantId: z.number(),
  accountId: z.number().optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  title: z.string().optional(),
  role: z.enum(['decision_maker', 'influencer', 'user']).optional(),
  isPrimary: z.boolean().default(false),
});

const contactSelectSchema = contactInsertSchema.extend({
  id: z.number(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export { contactInsertSchema, contactSelectSchema };
export type InsertContact = typeof contactsTable.$inferInsert;
export type SelectContact = typeof contactsTable.$inferSelect;
