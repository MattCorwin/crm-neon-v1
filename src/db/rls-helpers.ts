import { sql } from 'drizzle-orm';
import { AnyPgColumn } from 'drizzle-orm/pg-core';
import { pgPolicy } from 'drizzle-orm/pg-core';
import { appRole, migrationRole } from './entities/roles';


export const hasTenantAccess = (tenantIdColumn: AnyPgColumn) => 
  sql`${tenantIdColumn} = current_setting('app.current_tenant_id')::integer`;

export const isAuthenticated = () => 
  sql`current_setting('app.current_tenant_id', true) IS NOT NULL`;

export const isMigrationRole = () => 
  sql`current_user = '${migrationRole.name}'`;

export const applyRlsPolicies = (tableName: string) => (table: any) => ([
  // App role policy - restrictive tenant access
  pgPolicy(`${tableName}_app_policy`, {
    for: 'all',
    as: 'restrictive',
    to: appRole,
    using: hasTenantAccess(table.tenantId),
  }),
  // Migration role policy - bypass RLS
  pgPolicy(`${tableName}_migration_policy`, {
    for: 'all',
    as: 'restrictive',
    to: migrationRole,
    using: isMigrationRole(),
  }),
]);
