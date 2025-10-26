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
  isAdminOnly: boolean;
}

export const dbConfig: Record<string, DbEntityConfig> = {
  tenants: {
    table: tenantsTable,
    insertSchema: tenantInsertSchema,
    updateSchema: tenantInsertSchema.partial(),
    selectSchema: tenantSelectSchema,
    name: 'tenant',
    isAdminOnly: true,
  },
  users: {
    table: usersTable,
    insertSchema: userInsertSchema,
    updateSchema: userInsertSchema.partial(),
    selectSchema: userSelectSchema,
    name: 'user',
    isAdminOnly: true,
  },
  accounts: {
    table: accountsTable,
    insertSchema: accountInsertSchema,
    updateSchema: accountInsertSchema.partial(),
    selectSchema: accountSelectSchema,
    name: 'account',
    isAdminOnly: false,
  },
  contacts: {
    table: contactsTable,
    insertSchema: contactInsertSchema,
    updateSchema: contactInsertSchema.partial(),
    selectSchema: contactSelectSchema,
    name: 'contact',
    isAdminOnly: false,
  },
  leads: {
    table: leadsTable,
    insertSchema: leadInsertSchema,
    updateSchema: leadInsertSchema.partial(),
    selectSchema: leadSelectSchema,
    name: 'lead',
    isAdminOnly: false,
  },
  opportunities: {
    table: opportunitiesTable,
    insertSchema: opportunityInsertSchema,
    updateSchema: opportunityInsertSchema.partial(),
    selectSchema: opportunitySelectSchema,
    name: 'opportunity',
    isAdminOnly: false,
  },
  projects: {
    table: projectsTable,
    insertSchema: projectInsertSchema,
    updateSchema: projectInsertSchema.partial(),
    selectSchema: projectSelectSchema,
    name: 'project',
    isAdminOnly: false,
  },
  estimates: {
    table: estimatesTable,
    insertSchema: estimateInsertSchema,
    updateSchema: estimateInsertSchema.partial(),
    selectSchema: estimateSelectSchema,
    name: 'estimate',
    isAdminOnly: false,
  },
  jobs: {
    table: jobsTable,
    insertSchema: jobInsertSchema,
    updateSchema: jobInsertSchema.partial(),
    selectSchema: jobSelectSchema,
    name: 'job',
    isAdminOnly: false,
  },
  invoices: {
    table: invoicesTable,
    insertSchema: invoiceInsertSchema,
    updateSchema: invoiceInsertSchema.partial(),
    selectSchema: invoiceSelectSchema,
    name: 'invoice',
    isAdminOnly: false,
  },
  tasks: {
    table: tasksTable,
    insertSchema: taskInsertSchema,
    updateSchema: taskInsertSchema.partial(),
    selectSchema: taskSelectSchema,
    name: 'task',
    isAdminOnly: false,
  },
  activities: {
    table: activitiesTable,
    insertSchema: activityInsertSchema,
    updateSchema: activityInsertSchema.partial(),
    selectSchema: activitySelectSchema,
    name: 'activity',
    isAdminOnly: false,
  },
};

export const getEntityConfig = (entityName: string): DbEntityConfig | null => {
  return dbConfig[entityName] || null;
}

export const getValidEntityNames = (): string[] => {
  return Object.keys(dbConfig);
}

export const isAdminOnlyRoute = (entityName: string): boolean => {
  const config = getEntityConfig(entityName);
  return config?.isAdminOnly || false;
}

