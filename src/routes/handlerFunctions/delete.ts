import { dbConfig } from "../../db/config";
import {
  deleteRecord,
  EntityNotFoundError,
  RecordNotFoundError,
} from "../../db/controller";
import { createResponse, createErrorResponse } from "../crm/utils";
import { ApiResponse } from "../crm/types";

async function deleteItem(entity: string, id: number, tenantId: number): Promise<ApiResponse> {
  try {
    const result = await deleteRecord(entity, id, tenantId);
    const config = dbConfig[entity];
    return createResponse(200, result, `${config.name} deleted successfully`);
  } catch (error: any) {
    console.error(`Error deleting ${entity}:`, error);
    
    if (error instanceof EntityNotFoundError) {
      return createErrorResponse(404, 'Entity not found', { entity });
    }
    
    if (error instanceof RecordNotFoundError) {
      return createErrorResponse(404, `${entity} not found or unauthorized`, { id });
    }
    
    return createErrorResponse(500, 'Failed to delete record', { message: error.message });
  }
}

export async function handleDelete(
  entity: string,
  idParam: string,
  tenantId: number
): Promise<ApiResponse> {
  if (!idParam) {
    return createErrorResponse(400, 'ID parameter is required for delete');
  }
  
  const id = parseInt(idParam, 10);
  if (isNaN(id)) {
    return createErrorResponse(400, 'Invalid ID parameter');
  }
  
  return deleteItem(entity, id, tenantId);
}
