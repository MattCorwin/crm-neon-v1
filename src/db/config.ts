import { z } from 'zod';
import {
  tenantsTable,
  tenantInsertSchema,
  tenantSelectSchema,
} from './entities/tenants';
import {
  usersTable,
  userInsertSchema,
  userSelectSchema,
} from './entities/users';
import {
  accountsTable,
  accountInsertSchema,
  accountSelectSchema,
} from './entities/accounts';
import {
  contactsTable,
  contactInsertSchema,
  contactSelectSchema,
} from './entities/contacts';
import {
  leadsTable,
  leadInsertSchema,
  leadSelectSchema,
} from './entities/leads';
import {
  opportunitiesTable,
  opportunityInsertSchema,
  opportunitySelectSchema,
} from './entities/opportunities';
import {
  projectsTable,
  projectInsertSchema,
  projectSelectSchema,
} from './entities/projects';
import {
  estimatesTable,
  estimateInsertSchema,
  estimateSelectSchema,
} from './entities/estimates';
import {
  jobsTable,
  jobInsertSchema,
  jobSelectSchema,
} from './entities/jobs';
import {
  invoicesTable,
  invoiceInsertSchema,
  invoiceSelectSchema,
} from './entities/invoices';
import {
  tasksTable,
  taskInsertSchema,
  taskSelectSchema,
} from './entities/tasks';
import {
  activitiesTable,
  activityInsertSchema,
  activitySelectSchema,
} from './entities/activities';

export interface DbEntityConfig {
  table: any;
  insertSchema: z.ZodSchema;
  updateSchema: z.ZodSchema;
  selectSchema: z.ZodSchema;
  name: string;
  pluralName: string;
}

export const dbConfig: Record<string, DbEntityConfig> = {
  tenants: {
    table: tenantsTable,
    insertSchema: tenantInsertSchema,
    updateSchema: tenantInsertSchema.partial(),
    selectSchema: tenantSelectSchema,
    name: 'tenant',
    pluralName: 'tenants',
  },
  users: {
    table: usersTable,
    insertSchema: userInsertSchema,
    updateSchema: userInsertSchema.partial(),
    selectSchema: userSelectSchema,
    name: 'user',
    pluralName: 'users',
  },
  accounts: {
    table: accountsTable,
    insertSchema: accountInsertSchema,
    updateSchema: accountInsertSchema.partial(),
    selectSchema: accountSelectSchema,
    name: 'account',
    pluralName: 'accounts',
  },
  contacts: {
    table: contactsTable,
    insertSchema: contactInsertSchema,
    updateSchema: contactInsertSchema.partial(),
    selectSchema: contactSelectSchema,
    name: 'contact',
    pluralName: 'contacts',
  },
  leads: {
    table: leadsTable,
    insertSchema: leadInsertSchema,
    updateSchema: leadInsertSchema.partial(),
    selectSchema: leadSelectSchema,
    name: 'lead',
    pluralName: 'leads',
  },
  opportunities: {
    table: opportunitiesTable,
    insertSchema: opportunityInsertSchema,
    updateSchema: opportunityInsertSchema.partial(),
    selectSchema: opportunitySelectSchema,
    name: 'opportunity',
    pluralName: 'opportunities',
  },
  projects: {
    table: projectsTable,
    insertSchema: projectInsertSchema,
    updateSchema: projectInsertSchema.partial(),
    selectSchema: projectSelectSchema,
    name: 'project',
    pluralName: 'projects',
  },
  estimates: {
    table: estimatesTable,
    insertSchema: estimateInsertSchema,
    updateSchema: estimateInsertSchema.partial(),
    selectSchema: estimateSelectSchema,
    name: 'estimate',
    pluralName: 'estimates',
  },
  jobs: {
    table: jobsTable,
    insertSchema: jobInsertSchema,
    updateSchema: jobInsertSchema.partial(),
    selectSchema: jobSelectSchema,
    name: 'job',
    pluralName: 'jobs',
  },
  invoices: {
    table: invoicesTable,
    insertSchema: invoiceInsertSchema,
    updateSchema: invoiceInsertSchema.partial(),
    selectSchema: invoiceSelectSchema,
    name: 'invoice',
    pluralName: 'invoices',
  },
  tasks: {
    table: tasksTable,
    insertSchema: taskInsertSchema,
    updateSchema: taskInsertSchema.partial(),
    selectSchema: taskSelectSchema,
    name: 'task',
    pluralName: 'tasks',
  },
  activities: {
    table: activitiesTable,
    insertSchema: activityInsertSchema,
    updateSchema: activityInsertSchema.partial(),
    selectSchema: activitySelectSchema,
    name: 'activity',
    pluralName: 'activities',
  },
};

// Helper function to validate entity exists
export function getEntityConfig(entityName: string): DbEntityConfig | null {
  return dbConfig[entityName] || null;
}

// Helper function to get all valid entity names
export function getValidEntityNames(): string[] {
  return Object.keys(dbConfig);
}

