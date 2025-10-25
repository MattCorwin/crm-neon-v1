import {
  APIGatewayRequestAuthorizerEvent,
  APIGatewayAuthorizerResult,
} from 'aws-lambda';
import { getSecret } from '../../common/utils/getSecret';
import { timingSafeEqual } from 'crypto';

const ssmApiKey = await getSecret(process.env.API_KEY_NAME as string);

const authResponse = (isAuthorized: boolean): APIGatewayAuthorizerResult => {
  return {
    isAuthorized: isAuthorized,
  };
};

export const handler = async (
  event: APIGatewayRequestAuthorizerEvent
): Promise<APIGatewayAuthorizerResult> => {
  try {
    const headers = event.headers || {};
    const apiKey = headers['x-api-key'] || headers['X-Api-Key'];

    if (!apiKey || !ssmApiKey) {
      console.warn('Missing x-api-key header');
      return authResponse(false);
    }

    try {
      const equal = timingSafeEqual(
        Buffer.from(apiKey),
        Buffer.from(ssmApiKey)
      );
      if (!equal) {
        return authResponse(false);
      }
    } catch (error) {
      return authResponse(false);
    }

    console.log('API key valid');

    return authResponse(true);
  } catch (error) {
    console.error('Error in authorizer:', error);
    return authResponse(false);
  }
};
