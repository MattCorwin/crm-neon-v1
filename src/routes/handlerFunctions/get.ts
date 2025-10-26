import { z } from "zod";
import { dbConfig } from "../../db/config";
import {
  listRecords,
  getRecordById,
  EntityNotFoundError,
  RecordNotFoundError,
} from "../../db/controller";
import { createResponse, createErrorResponse } from "../crm/utils";
import { ApiResponse } from "../crm/types";

async function handleList(entity: string, tenantId: number, queryParams?: Record<string, string>): Promise<ApiResponse> {
  try {
    const records = await listRecords(entity, tenantId);
    const config = dbConfig[entity];
    return createResponse(200, records, `${config.pluralName} retrieved successfully`);
  } catch (error: any) {
    console.error(`Error listing ${entity}:`, error);
    
    if (error instanceof EntityNotFoundError) {
      return createErrorResponse(404, 'Entity not found', { entity });
    }
    
    return createErrorResponse(500, 'Failed to retrieve records', { message: error.message });
  }
}

async function handleGetById(entity: string, id: number, tenantId: number): Promise<ApiResponse> {
  try {
    const record = await getRecordById(entity, id, tenantId);
    const config = dbConfig[entity];
    return createResponse(200, record, `${config.name} retrieved successfully`);
  } catch (error: any) {
    console.error(`Error getting ${entity} by id:`, error);
    
    if (error instanceof EntityNotFoundError) {
      return createErrorResponse(404, 'Entity not found', { entity });
    }
    
    if (error instanceof RecordNotFoundError) {
      return createErrorResponse(404, `${entity} not found`, { id });
    }
    
    return createErrorResponse(500, 'Failed to retrieve record', { message: error.message });
  }
}

export async function handleGet(
  entity: string,
  idParam: string | null,
  tenantId: number,
  queryStringParameters?: Record<string, string>
): Promise<ApiResponse> {
  if (idParam) {
    const id = parseInt(idParam, 10);
    if (isNaN(id)) {
      return createErrorResponse(400, 'Invalid ID parameter');
    }
    return await handleGetById(entity, id, tenantId);
  }
  return await handleList(entity, tenantId, queryStringParameters);
}
