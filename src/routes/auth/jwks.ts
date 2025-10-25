import { ErrorResponse, InternalServerError } from "../../common/utils/errors";
import { exportJWK, importSPKI } from 'jose';
import { getSecret } from '../../common/utils/getSecret';

const [publicKeyPem] = await Promise.all([
  getSecret(process.env.JWT_PUBLIC_KEY_NAME || 'crm-jwt-public-key-dev'),
]);

if (!publicKeyPem) {
  throw new Error('Public key not found');
}

const publicKey = await importSPKI(publicKeyPem, 'RS256');

let jwks: any = null;
const initKeys = async () => {
  if (jwks) {
    return;
  }
  // Export public key as JWK for JWKS endpoint
  const jwk = await exportJWK(publicKey);
  jwks = {
    keys: [
      {
        ...jwk,
        kid: 'default-key-1',
        alg: 'RS256',
        use: 'sig',
      },
    ],
  };
};
export const handler = async (event: any): Promise<any> => {
  try {
    // Initialize keys if not already done
    await initKeys();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
      },
      body: JSON.stringify(jwks),
    };
  } catch (error) {
    console.error('Error serving JWKS:', error);
    if (error instanceof ErrorResponse) {
      return error.toResponse();
    }
    const errorResponse = new InternalServerError();
    return errorResponse.toResponse();
  }
};