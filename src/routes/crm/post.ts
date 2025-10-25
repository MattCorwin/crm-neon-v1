import { z } from "zod";
import { dbConfig } from "../../db/config";
import {
  createRecord,
  EntityNotFoundError,
} from "../../db/controller";
import { createResponse, createErrorResponse } from "./utils";
import { ApiResponse } from "./types";

async function handleCreate(entity: string, data: any, tenantId: number): Promise<ApiResponse> {
  try {
    const record = await createRecord(entity, data, tenantId);
    const config = dbConfig[entity];
    return createResponse(201, record, `${config.name} created successfully`);
  } catch (error: any) {
    console.error(`Error creating ${entity}:`, error);
    
    if (error instanceof EntityNotFoundError) {
      return createErrorResponse(404, 'Entity not found', { entity });
    }
    
    if (error instanceof z.ZodError) {
      return createErrorResponse(400, 'Validation error', { errors: error.errors });
    }
    
    return createErrorResponse(500, 'Failed to create record', { message: error.message });
  }
}

export async function handlePost(
  entity: string,
  body: any,
  tenantId: number
): Promise<ApiResponse> {
  if (!body) {
    return createErrorResponse(400, 'Request body is required');
  }
  return await handleCreate(entity, body, tenantId);
}
