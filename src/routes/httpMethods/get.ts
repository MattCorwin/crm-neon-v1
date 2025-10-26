import { z } from "zod";
import { dbConfig } from "../../db/config";
import {
  listRecords,
  getRecordById,
  EntityNotFoundError,
  RecordNotFoundError,
} from "../../db/controller";
import { createResponse } from "../crm/utils";
import { ApiResponse } from "../crm/types";
import { NotFoundError, BadRequestError, InternalServerError } from "../../common/utils/errors";

async function handleList(entity: string, tenantId: number, queryParams?: Record<string, string>): Promise<ApiResponse> {
  try {
    const records = await listRecords(entity, tenantId);
    const config = dbConfig[entity];
    return createResponse(200, records, 'retrieved successfully');
  } catch (error: any) {
    console.error(`Error listing ${entity}:`, error);
    
    if (error instanceof EntityNotFoundError) {
      throw new NotFoundError('Entity not found');
    }
    
    throw new InternalServerError(`Failed to retrieve records: ${error.message}`);
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
      throw new NotFoundError('Entity not found');
    }
    
    if (error instanceof RecordNotFoundError) {
      throw new NotFoundError(`${entity} not found`);
    }
    
    throw new InternalServerError(`Failed to retrieve record: ${error.message}`);
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
      throw new BadRequestError('Invalid ID parameter');
    }
    return await handleGetById(entity, id, tenantId);
  }
  return await handleList(entity, tenantId, queryStringParameters);
}
