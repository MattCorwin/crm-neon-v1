export const config = {
  // AWS Configuration
  awsRegion: process.env.AWS_REGION || 'us-east-2',
  
  // JWT Configuration
  jwtPublicKeyPrefix: process.env.JWT_PUBLIC_KEY_PREFIX || 'crm-jwt-public-key',
  jwtPrivateKeyPrefix: process.env.JWT_PRIVATE_KEY_PREFIX || 'crm-jwt-private-key',
  
  // API Configuration
  apiKeyPrefix: process.env.API_KEY_PREFIX || 'crm-api-key',
  
  // JWT Token Configuration
  jwtAudience: process.env.JWT_AUDIENCE || 'crm-neon-api',
  jwtIssuer: process.env.JWT_ISSUER || 'crm-neon',
  
  // Neon Configuration
  neonOrgId: process.env.NEON_ORG_ID || 'org-super-brook-32920885',
  neonProjectImport: process.env.NEON_PROJECT_IMPORT || 'quiet-mud-15209532',
  
  // Database Configuration
  databaseName: process.env.DATABASE_NAME || 'crm',
  appRoleName: process.env.APP_ROLE_NAME || 'crm-app-user',
  migrationRoleName: process.env.MIGRATION_ROLE_NAME || 'crm-migration-user',
  
  // Application Configuration
  appName: process.env.APP_NAME || 'crm-neon-v1',
  historyRetentionSeconds: parseInt(process.env.HISTORY_RETENTION_SECONDS || '21600'),
};