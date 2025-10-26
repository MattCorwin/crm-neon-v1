import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { isAdminOnlyRoute } from '../../db/config';
import {
  ErrorResponse,
  InternalServerError,
  BadRequestError,
  MethodNotAllowedError,
  NotFoundError,
} from '../../common/utils/errors';
import { handleOptions } from '../handlerFunctions/options';
import { parseBody } from '../crm/utils';
import { handlePost } from '../handlerFunctions';
import { handleDelete } from '../handlerFunctions';

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    console.log('Received event:', JSON.stringify(event));
    const method = event.requestContext?.http?.method;
    const entity = event.pathParameters?.entity;

    if (method === 'OPTIONS') {
      return await handleOptions();
    }

    if (!isAdminOnlyRoute(entity)) {
      throw new NotFoundError('Entity not found');
    }

    const body = parseBody(event.body);

    switch (method) {
      case 'POST':
        return await handlePost(entity, body, body.tenantId);
      case 'DELETE':
        return await handleDelete(entity, event.pathParameters?.id, body.tenantId);
      default:
        throw new MethodNotAllowedError();
    }
  } catch (error) {
    if (error instanceof ErrorResponse) {
      return error.toResponse();
    }
    const errorResponse = new InternalServerError();
    return errorResponse.toResponse();
  }
};
