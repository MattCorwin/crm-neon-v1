import { createResponse } from "../../common/utils/response";
import { ApiResponse } from "../crm/types";

export async function handleOptions(): Promise<ApiResponse> {
  return createResponse(200, {});
}
