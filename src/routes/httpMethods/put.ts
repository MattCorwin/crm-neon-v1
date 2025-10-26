import { z } from "zod";
import { dbConfig } from "../../db/config";
import {
  updateRecord,
  EntityNotFoundError,
  RecordNotFoundError,
} from "../../db/controller";
import { createResponse } from "../../common/utils/response";
import { ApiResponse } from "../crm/types";
import { NotFoundError, BadRequestError, InternalServerError } from "../../common/utils/errors";

async function handleUpdate(entity: string, id: number, data: any, tenantId: number): Promise<ApiResponse> {
  try {
    const record = await updateRecord(entity, id, data, tenantId);
    const config = dbConfig[entity];
    return createResponse(200, record);
  } catch (error: any) {
    console.error(`Error updating ${entity}:`, error);
    
    if (error instanceof EntityNotFoundError) {
      throw new NotFoundError('Entity not found');
    }
    
    if (error instanceof RecordNotFoundError) {
      throw new NotFoundError(`${entity} not found or unauthorized`);
    }
    
    if (error instanceof z.ZodError) {
      throw new BadRequestError('Validation error');
    }
    
    throw new InternalServerError(`Failed to update record: ${error.message}`);
  }
}

export async function handlePut(
  entity: string,
  idParam: string,
  body: any,
  tenantId: number
): Promise<ApiResponse> {
  if (!idParam) {
    throw new BadRequestError('ID parameter is required for update');
  }
  if (!body) {
    throw new BadRequestError('Request body is required');
  }
  
  const id = parseInt(idParam, 10);
  if (isNaN(id)) {
    throw new BadRequestError('Invalid ID parameter');
  }
  
  return await handleUpdate(entity, id, body, tenantId);
}
