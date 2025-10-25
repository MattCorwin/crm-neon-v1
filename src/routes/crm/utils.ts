import { ApiGatewayEvent, ApiResponse } from "./types";

export function createResponse(statusCode: number, data: any, message?: string): ApiResponse {
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

export function createErrorResponse(statusCode: number, error: string, details?: any): ApiResponse {
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

export function getTenantId(event: ApiGatewayEvent): number | null {
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
