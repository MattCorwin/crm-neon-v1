import { sql } from 'drizzle-orm';
import { AnyPgColumn } from 'drizzle-orm/pg-core';

export const hasTenantAccess = (tenantIdColumn: AnyPgColumn) => 
  sql`${tenantIdColumn} = current_setting('app.current_tenant_id')::integer`;

export const isAuthenticated = () => 
  sql`current_setting('app.current_tenant_id', true) IS NOT NULL`;

export const isMigrationRole = () => 
  sql`current_user = 'crm-migration-user'`;
