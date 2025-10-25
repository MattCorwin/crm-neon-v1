import { ApiGatewayEvent, ApiResponse } from "./types";
import { getTenantId, parseBody, createErrorResponse } from "./utils";
import { handleGet, handlePost, handlePut, handleDeleteRequest, handleOptions } from "./handlers";

export const handler = async (event: ApiGatewayEvent): Promise<ApiResponse> => {
  console.log('Event:', JSON.stringify(event, null, 2));

  // Handle OPTIONS for CORS
  if (event.httpMethod === 'OPTIONS') {
    return await handleOptions();
  }

  // Extract tenant ID from JWT
  const tenantId = getTenantId(event);
  console.log('Tenant ID:', tenantId);
  if (!tenantId) {
    return createErrorResponse(401, 'Unauthorized', { message: 'Missing or invalid tenant_id in JWT' });
  }

  // Parse path: /api/{entity} or /api/{entity}/{id}
  // const pathParts = event.path.split('/').filter(p => p);
  const entity = event.pathParameters?.entity;
  const idParam = event.pathParameters?.id;

  if (!entity) {
    return createErrorResponse(400, 'Bad Request', { message: 'Entity parameter is required' });
  }

  const method = event.requestContext.http.method;
  const body = parseBody(event.body);

  try {
    switch (method) {
      case 'GET':
        return await handleGet(entity, idParam, tenantId, event.queryStringParameters);

      case 'POST':
        return await handlePost(entity, body, tenantId);

      case 'PUT':
      case 'PATCH':
        if (!idParam) {
          return createErrorResponse(400, 'ID parameter is required for update');
        }
        return await handlePut(entity, idParam, body, tenantId);

      case 'DELETE':
        if (!idParam) {
          return createErrorResponse(400, 'ID parameter is required for delete');
        }
        return await handleDeleteRequest(entity, idParam, tenantId);

      default:
        return createErrorResponse(405, 'Method not allowed', { method });
    }
  } catch (error: any) {
    console.error('Unhandled error:', error);
    return createErrorResponse(500, 'Internal server error', { message: error.message });
  }
};