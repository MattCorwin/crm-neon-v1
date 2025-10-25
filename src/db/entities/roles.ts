import { pgRole } from 'drizzle-orm/pg-core';

export const appRole = pgRole('crm-app-user').existing();
export const migrationRole = pgRole('crm-migration-user').existing();