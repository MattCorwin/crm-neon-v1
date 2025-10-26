import { SignJWT, importPKCS8 } from 'jose';
import { getSecret } from '../../common/utils/getSecret';
import { ErrorResponse, BadRequestError, InternalServerError } from '../../common/utils/errors';
import { getRecordById } from '../../db/controller';

const [publicKeyPem, privateKeyPem] = await Promise.all([
  getSecret(process.env.JWT_PUBLIC_KEY_NAME || 'crm-jwt-public-key-dev'),
  getSecret(process.env.JWT_PRIVATE_KEY_NAME || 'crm-jwt-private-key-dev'),
]);

if (!publicKeyPem || !privateKeyPem) {
  throw new Error('JWT public, private keys not found');
}

const privateKey = await importPKCS8(privateKeyPem, 'RS256');
export interface TokenRequest {
  userId: string;
  tenantId: string;
}

export interface TokenResponse {
  token: string;
  expiresIn: number;
}


/**
 * Lambda handler for JWT token issuance
 * Validates API key and issues JWT with user and tenant claims
 */
export const handler = async (event: any): Promise<any> => {
  try {
    // Parse request body
    const body: TokenRequest = JSON.parse(event.body || '{}');
    const { userId, tenantId } = body;

    if (!userId || !tenantId) {
      throw new BadRequestError('userId and tenantId are required');
    }

    const user = await getRecordById('users', parseInt(userId), parseInt(tenantId));
    if (!user) {
      throw new BadRequestError('User not found');
    }
    console.log('user', user);

    // Token expiration time (1 hour)
    const expiresIn = 3600; // seconds
    const now = Math.floor(Date.now() / 1000);

    // Create JWT with custom claims
    const token = await new SignJWT({
      userId,
      tenantId,
    })
      .setProtectedHeader({ alg: 'RS256', kid: 'default-key-1' })
      .setIssuedAt(now)
      .setExpirationTime(now + expiresIn)
      .setIssuer(process.env.JWT_ISSUER || 'crm-neon')
      .setAudience(process.env.JWT_AUDIENCE || 'crm-neon-api')
      .setSubject(userId)
      .sign(privateKey);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        expiresIn,
      } as TokenResponse),
    };
  } catch (error) {
    console.error('Error issuing token:', error);
    if (error instanceof ErrorResponse) {
      console.log('returning error response');
      return error.toResponse();
    }
    const errorResponse = new InternalServerError();
    return errorResponse.toResponse();
  }
};


