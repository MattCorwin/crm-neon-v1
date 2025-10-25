export interface ApiGatewayEvent {
  httpMethod: string;
  path: string;
  pathParameters?: { entity?: string; id?: string };
  body?: string;
  queryStringParameters?: Record<string, string>;
  requestContext?: {
    authorizer?: {
      jwt?: {
        claims?: {
          sub?: string;
          tenant_id?: string;
          [key: string]: any;
        };
      };
    };
  };
}

export interface ApiResponse {
  statusCode: number;
  headers?: Record<string, string>;
  body: string;
}
