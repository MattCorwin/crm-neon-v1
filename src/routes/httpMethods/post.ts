import { z } from "zod";
import { dbConfig } from "../../db/config";
import {
  createRecord,
  EntityNotFoundError,
} from "../../db/controller";
import { createResponse } from "../crm/utils";
import { ApiResponse } from "../crm/types";
import { NotFoundError, BadRequestError, InternalServerError } from "../../common/utils/errors";

async function handleCreate(entity: string, data: any, tenantId: number): Promise<ApiResponse> {
  try {
    const record = await createRecord(entity, data, tenantId);
    const config = dbConfig[entity];
    return createResponse(201, record, `${config.name} created successfully`);
  } catch (error: any) {
    console.error(`Error creating ${entity}:`, error);
    
    if (error instanceof EntityNotFoundError) {
      throw new NotFoundError('Entity not found');
    }
    
    if (error instanceof z.ZodError) {
      throw new BadRequestError('Validation error');
    }
    
    throw new InternalServerError(`Failed to create record: ${error.message}`);
  }
}

export async function handlePost(
  entity: string,
  body: any,
  tenantId: number
): Promise<ApiResponse> {
  if (!body) {
    throw new BadRequestError('Request body is required');
  }
  return await handleCreate(entity, body, tenantId);
}
