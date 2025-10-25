import { createResponse } from "./utils";
import { ApiResponse } from "./types";

export async function handleOptions(): Promise<ApiResponse> {
  return createResponse(200, null, 'OK');
}
