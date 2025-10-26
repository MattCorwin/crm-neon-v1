import { APIGatewayProxyEventV2 } from 'aws-lambda';

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
