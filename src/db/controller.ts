import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, and } from "drizzle-orm";
import { getEntityConfig } from "./config";
import { NotFoundError } from "../common/utils/errors";

// Create connection for app role (CRUD operations)
const createAppConnection = () => {
  const baseUrl = new URL(process.env.APP_CONNECTION_STRING!);
  return neon(baseUrl.toString());
};

// Connection for CRUD operations using app role
const appSql = createAppConnection();
export const appDb = drizzle({ client: appSql });

// Helper function to set tenant context for RLS
async function setTenantContext(tenantId: number) {
  await appSql.unsafe(`SET LOCAL app.current_tenant_id = ${Number(tenantId)}`);
}

export class EntityNotFoundError extends NotFoundError {
  constructor(public entityName: string) {
    super(`Entity '${entityName}' not found`);
  }
}

export class RecordNotFoundError extends NotFoundError {
  constructor(public entityName: string, public id: number) {
    super(`${entityName} with id ${id} not found`);
  }
}

/**
 * List all records for a given entity and tenant
 */
export async function listRecords(entity: string, tenantId: number): Promise<any[]> {
  const config = getEntityConfig(entity);
  if (!config) {
    throw new EntityNotFoundError(entity);
  }

  // Set tenant context for RLS
  await setTenantContext(tenantId);

  // Build query with tenant filter using app role (RLS will also enforce tenant isolation)
  const results = await appDb
    .select()
    .from(config.table)
    .where(eq(config.table.tenantId, tenantId));

  // Validate results against select schema
  const validated = results.map(result => config.selectSchema.parse(result));

  return validated;
}

/**
 * Get a single record by ID for a given entity and tenant
 */
export async function getRecordById(entity: string, id: number, tenantId: number): Promise<any> {
  const config = getEntityConfig(entity);
  if (!config) {
    throw new EntityNotFoundError(entity);
  }

  // Set tenant context for RLS
  await setTenantContext(tenantId);

  const results = await appDb
    .select()
    .from(config.table)
    .where(and(eq(config.table.id, id), eq(config.table.tenantId, tenantId)))
    .limit(1);

  if (results.length === 0) {
    throw new RecordNotFoundError(config.name, id);
  }

  const validated = config.selectSchema.parse(results[0]);
  return validated;
}

/**
 * Create a new record for a given entity
 */
export async function createRecord(entity: string, data: any, tenantId: number): Promise<any> {
  const config = getEntityConfig(entity);
  if (!config) {
    throw new EntityNotFoundError(entity);
  }
  console.log('setting tenant context for RLS');
  // Set tenant context for RLS
  await setTenantContext(tenantId);
  console.log('tenant context set');
  // Ensure tenant_id is set
  data.tenantId = tenantId;

  // Validate input (will throw ZodError if invalid)
  const validatedInput = config.insertSchema.parse(data);
  console.log('Validated input:', validatedInput);

  // Insert into database using app role (RLS will enforce tenant isolation)
  const result = await appDb.insert(config.table).values(validatedInput).returning();
  const resultArray = Array.isArray(result) ? result : [result];

  if (resultArray.length === 0) {
    throw new Error('Failed to create record');
  }

  const validatedOutput = config.selectSchema.parse(resultArray[0]);
  return validatedOutput;
}

/**
 * Update an existing record for a given entity
 */
export async function updateRecord(entity: string, id: number, data: any, tenantId: number): Promise<any> {
  const config = getEntityConfig(entity);
  if (!config) {
    throw new EntityNotFoundError(entity);
  }

  // Set tenant context for RLS
  await setTenantContext(tenantId);

  // Remove tenant_id and id from update data (shouldn't be updated)
  delete data.tenantId;
  delete data.id;

  // Validate input (will throw ZodError if invalid)
  const validatedInput = config.updateSchema.parse(data);

  // Add updated_at if table has it
  const dataToUpdate: any = { ...validatedInput };
  if ('updatedAt' in config.table) {
    dataToUpdate.updatedAt = new Date();
  }

  // Update in database using app role (RLS will enforce tenant isolation)
  const result = await appDb
    .update(config.table)
    .set(dataToUpdate)
    .where(and(eq(config.table.id, id), eq(config.table.tenantId, tenantId)))
    .returning();

  if (result.length === 0) {
    throw new RecordNotFoundError(config.name, id);
  }

  const validatedOutput = config.selectSchema.parse(result[0]);
  return validatedOutput;
}

/**
 * Delete a record for a given entity
 */
export async function deleteRecord(entity: string, id: number, tenantId: number): Promise<{ id: number }> {
  const config = getEntityConfig(entity);
  if (!config) {
    throw new EntityNotFoundError(entity);
  }

  // Set tenant context for RLS
  await setTenantContext(tenantId);

  const result = await appDb
    .delete(config.table)
    .where(and(eq(config.table.id, id), eq(config.table.tenantId, tenantId)))
    .returning();
  const resultArray = Array.isArray(result) ? result : [result];

  if (resultArray.length === 0) {
    throw new RecordNotFoundError(config.name, id);
  }

  return { id };
}

