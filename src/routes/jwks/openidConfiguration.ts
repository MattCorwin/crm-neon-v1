export const handler = async (_event: any): Promise<any> => {
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      issuer: process.env.JWT_ISSUER,
      jwks_uri: `${process.env.JWT_ISSUER}/.well-known/jwks.json`,
      id_token_signing_alg_values_supported: ["RS256"],
    }),
  };
};
