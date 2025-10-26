import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';

export function createResponse(statusCode: number, data: any, message?: string): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
    body: JSON.stringify({
      success: statusCode >= 200 && statusCode < 300,
      message,
      data,
    }),
  };
}

export function createErrorResponse(statusCode: number, error: string, details?: any): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      success: false,
      error,
      details,
    }),
  };
}

export function getTenantId(event: APIGatewayProxyEventV2): number | null {
  const tenantId = event.requestContext?.authorizer?.jwt?.claims?.tenantId;
  if (!tenantId) return null;
  const parsed = parseInt(tenantId, 10);
  return isNaN(parsed) ? null : parsed;
}

export function parseBody(body: string | undefined): any {
  if (!body) return null;
  try {
    return JSON.parse(body);
  } catch (error) {
    return null;
  }
}
