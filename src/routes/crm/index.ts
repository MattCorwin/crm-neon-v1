// import { ApiGatewayEvent, ApiResponse } from './types';
import { getTenantId, parseBody } from './utils';
import {
  handleGet,
  handlePost,
  handlePut,
  handleDelete,
  handleOptions,
} from '../httpMethods';
import { isAdminOnlyRoute } from '../../db/config';
import {
  ErrorResponse,
  BadRequestError,
  ForbiddenError,
  InternalServerError,
  UnauthorizedError,
  MethodNotAllowedError,
} from '../../common/utils/errors';
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  console.log('Event:', JSON.stringify(event, null, 2));

  // Handle OPTIONS for CORS
  if (event.requestContext?.http?.method === 'OPTIONS') {
    return await handleOptions();
  }

  try {
    // Extract tenant ID from JWT
    const tenantId = getTenantId(event);
    console.log('Tenant ID:', tenantId);
    if (!tenantId) {
      throw new UnauthorizedError();
    }

    const entity = event.pathParameters?.entity;
    const idParam = event.pathParameters?.id;

    if (!entity) {
      throw new BadRequestError('Entity parameter is required');
    }

    if (isAdminOnlyRoute(entity)) {
      throw new ForbiddenError();
    }

    const method = event.requestContext?.http?.method;
    const body = parseBody(event.body);
    switch (method) {
      case 'GET':
        return await handleGet(
          entity,
          idParam ?? null,
          tenantId,
          event.queryStringParameters
        );

      case 'POST':
        return await handlePost(entity, body, tenantId);

      case 'PUT':
      case 'PATCH':
        if (!idParam) {
          throw new BadRequestError('ID parameter is required for update');
          }
        return await handlePut(entity, idParam, body, tenantId);

      case 'DELETE':
        if (!idParam) {
          throw new BadRequestError('ID parameter is required for delete');
        }
        return await handleDelete(entity, idParam, tenantId);

      default:
        throw new MethodNotAllowedError();
    }
  } catch (error: any) {
    console.error('Unhandled error:', error);
    if (error instanceof ErrorResponse) {
      return error.toResponse();
    }
    const errorResponse = new InternalServerError();
    return errorResponse.toResponse();
  }
};
