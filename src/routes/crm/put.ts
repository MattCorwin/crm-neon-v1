import { z } from "zod";
import { dbConfig } from "../../db/config";
import {
  updateRecord,
  EntityNotFoundError,
  RecordNotFoundError,
} from "../../db/controller";
import { createResponse, createErrorResponse } from "./utils";
import { ApiResponse } from "./types";

async function handleUpdate(entity: string, id: number, data: any, tenantId: number): Promise<ApiResponse> {
  try {
    const record = await updateRecord(entity, id, data, tenantId);
    const config = dbConfig[entity];
    return createResponse(200, record, `${config.name} updated successfully`);
  } catch (error: any) {
    console.error(`Error updating ${entity}:`, error);
    
    if (error instanceof EntityNotFoundError) {
      return createErrorResponse(404, 'Entity not found', { entity });
    }
    
    if (error instanceof RecordNotFoundError) {
      return createErrorResponse(404, `${entity} not found or unauthorized`, { id });
    }
    
    if (error instanceof z.ZodError) {
      return createErrorResponse(400, 'Validation error', { errors: error.errors });
    }
    
    return createErrorResponse(500, 'Failed to update record', { message: error.message });
  }
}

export async function handlePut(
  entity: string,
  idParam: string,
  body: any,
  tenantId: number
): Promise<ApiResponse> {
  if (!idParam) {
    return createErrorResponse(400, 'ID parameter is required for update');
  }
  if (!body) {
    return createErrorResponse(400, 'Request body is required');
  }
  
  const id = parseInt(idParam, 10);
  if (isNaN(id)) {
    return createErrorResponse(400, 'Invalid ID parameter');
  }
  
  return await handleUpdate(entity, id, body, tenantId);
}
