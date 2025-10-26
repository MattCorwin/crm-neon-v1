import { dbConfig } from "../../db/config";
import {
  deleteRecord,
  EntityNotFoundError,
  RecordNotFoundError,
} from "../../db/controller";
import { createResponse } from "../crm/utils";
import { ApiResponse } from "../crm/types";
import { NotFoundError, BadRequestError, InternalServerError } from "../../common/utils/errors";

async function deleteItem(entity: string, id: number, tenantId: number): Promise<ApiResponse> {
  try {
    const result = await deleteRecord(entity, id, tenantId);
    const config = dbConfig[entity];
    return createResponse(200, result, `${config.name} deleted successfully`);
  } catch (error: any) {
    console.error(`Error deleting ${entity}:`, error);
    
    if (error instanceof EntityNotFoundError) {
      throw new NotFoundError('Entity not found');
    }
    
    if (error instanceof RecordNotFoundError) {
      throw new NotFoundError(`${entity} not found or unauthorized`);
    }
    
    throw new InternalServerError(`Failed to delete record: ${error.message}`);
  }
}

export async function handleDelete(
  entity: string,
  idParam: string,
  tenantId: number
): Promise<ApiResponse> {
  if (!idParam) {
    throw new BadRequestError('ID parameter is required for delete');
  }
  
  const id = parseInt(idParam, 10);
  if (isNaN(id)) {
    throw new BadRequestError('Invalid ID parameter');
  }
  
  return deleteItem(entity, id, tenantId);
}
