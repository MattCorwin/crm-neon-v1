import { createResponse } from "../crm/utils";
import { ApiResponse } from "../crm/types";

export async function handleOptions(): Promise<ApiResponse> {
  return createResponse(200, null, 'OK');
}
