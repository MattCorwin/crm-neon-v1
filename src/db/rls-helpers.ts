import { sql } from 'drizzle-orm';
import { AnyPgColumn } from 'drizzle-orm/pg-core';

// Helper function to check if current user has access to a tenant
export const hasTenantAccess = (tenantIdColumn: AnyPgColumn) => 
  sql`${tenantIdColumn} = current_setting('app.current_tenant_id')::integer`;

// Helper function to check if current user is authenticated
export const isAuthenticated = () => 
  sql`current_setting('app.current_tenant_id', true) IS NOT NULL`;

// Helper function to check if current user is the migration role
export const isMigrationRole = () => 
  sql`current_user = 'crm-migration-user'`;
