/// <reference path="./.sst/platform/config.d.ts" />

const awsRegion = 'us-east-2';
const jwtPublicKeyPrefix = 'crm-jwt-public-key';
const jwtPrivateKeyPrefix = 'crm-jwt-private-key';
const apiKeyPrefix = 'crm-api-key';

export default $config({
  app(input) {
    return {
      name: 'crm-neon-v1',
      removal: input?.stage === 'production' ? 'retain' : 'remove',
      protect: ['production'].includes(input?.stage),
      home: 'aws',
      providers: {
        neon: true,
        aws: {
          region: awsRegion,
        },
      },
    };
  },
  async run() {
    const neonOrgId = 'org-super-brook-32920885';
    const stagePostfix = $app.stage === 'prod' ? '-prod' : '-dev';
    // const project = new neon.Project('CrmProject', {
    //   orgId: neonOrgId,
    //   historyRetentionSeconds: 21600,
    //   name: `crm-${$app.stage}`,
    // });
    const project = new neon.Project(
      'MyAppProject',
      {
        orgId: neonOrgId,
        historyRetentionSeconds: 21600,
      },
      {
        import: 'quiet-mud-15209532',
      }
    );

    const branch = new neon.Branch('CrmBranch', {
      projectId: project.id,
      name: $app.stage,
    });

    const endpoint = new neon.Endpoint(
      'CrmEndpoint',
      {
        projectId: project.id,
        branchId: branch.id,
      },
      { dependsOn: [branch] }
    );

    const appRole = new neon.Role(
      'CrmAppRole',
      {
        branchId: branch.id,
        name: 'crm-app-user',
        projectId: project.id,
      },
      { dependsOn: [branch] }
    );

    const migrationRole = new neon.Role(
      'CrmMigrationRole',
      {
        branchId: branch.id,
        name: 'crm-migration-user',
        projectId: project.id,
      },
      { dependsOn: [branch] }
    );

    const database = new neon.Database(
      'CrmDatabase',
      {
        branchId: branch.id,
        name: 'crm',
        ownerName: migrationRole.name, // Role will be created by Drizzle
        projectId: project.id,
      },
      { dependsOn: [branch, migrationRole] }
    );

    const migrationConnectionString = $interpolate`postgres://${migrationRole.name}:${migrationRole.password}@${endpoint.host}/${database.name}?sslmode=require`;
    const appConnectionString = $interpolate`postgres://${appRole.name}:${appRole.password}@${endpoint.host}/${database.name}?sslmode=require`;

    const jwksApi = new sst.aws.ApiGatewayV2('JwksApi');

    // JWKS endpoint for JWT validation
    jwksApi.route('GET /.well-known/jwks.json', {
      handler: 'src/routes/auth/jwks.handler',
      timeout: '30 seconds',
      memory: '512 MB',
      architecture: 'arm64',
      runtime: 'nodejs22.x',
      environment: {
        JWT_PUBLIC_KEY_NAME: `${jwtPublicKeyPrefix}${stagePostfix}`,
      },
      permissions: [
        {
          actions: ['ssm:GetParameter'],
          resources: [
            `arn:aws:ssm:${awsRegion}:*:parameter/${jwtPublicKeyPrefix}${stagePostfix}`,
          ],
        },
      ],
    });

    jwksApi.route('GET /.well-known/openid-configuration', {
      handler: 'src/routes/auth/openidConfiguration.handler',
      timeout: '30 seconds',
      memory: '512 MB',
      architecture: 'arm64',
      runtime: 'nodejs22.x',
      environment: {
        JWT_ISSUER: jwksApi.url,
      },
    });

    let publicApi: sst.aws.ApiGatewayV2 | undefined;
    if (!process.env.INITIAL_DEPLOY) {
      const publicApi = new sst.aws.ApiGatewayV2(
        'PublicApi',
        { link: [jwksApi] },
        { dependsOn: [jwksApi] }
      );

      // TODO: ADD API KEY CUSTOM AUTHORIZER
      publicApi.route('POST /auth/token', {
        handler: 'src/routes/auth/issueToken.handler',
        timeout: '30 seconds',
        memory: '512 MB',
        architecture: 'arm64',
        runtime: 'nodejs22.x',
        environment: {
          API_KEY_NAME: `${apiKeyPrefix}${stagePostfix}`,
          JWT_ISSUER: jwksApi.url,
          JWT_AUDIENCE: 'crm-neon-api',
          JWT_PUBLIC_KEY_NAME: `${jwtPublicKeyPrefix}${stagePostfix}`,
          JWT_PRIVATE_KEY_NAME: `${jwtPrivateKeyPrefix}${stagePostfix}`,
        },
        permissions: [
          {
            actions: ['ssm:GetParameter'],
            resources: [
              `arn:aws:ssm:${awsRegion}:*:parameter/${jwtPublicKeyPrefix}${stagePostfix}`,
              `arn:aws:ssm:${awsRegion}:*:parameter/${jwtPrivateKeyPrefix}${stagePostfix}`,
              `arn:aws:ssm:${awsRegion}:*:parameter/${apiKeyPrefix}${stagePostfix}`,
            ],
          },
        ],
      });

      const authorizer = publicApi.addAuthorizer({
        name: 'myAuthorizer2',
        jwt: {
          issuer: jwksApi.url,
          audiences: ['crm-neon-api'],
          identitySource: '$request.header.authorization',
        },
      });

      (publicApi.route(
        'ANY /crm/{entity}',
        {
          handler: 'src/routes/crm/index.handler',
          timeout: '30 seconds',
          memory: '512 MB',
          architecture: 'arm64',
          runtime: 'nodejs22.x',
          environment: {
            // Use app role for CRUD operations in protected endpoints
            APP_CONNECTION_STRING: appConnectionString,
            NEON_APP_ROLE_NAME: 'crm-app-user',
            NEON_MIGRATION_ROLE_NAME: 'crm-migration-user',
          },
        },
        {
          auth: {
            jwt: {
              authorizer: authorizer.id,
            },
          },
        }
      ),
        { dependsOn: [jwksApi] });
    }

    new sst.x.DevCommand('RunMigrations', {
      dev: {
        autostart: true,
        command: 'npm run migrate',
      },
      environment: {
        // Use migration role for running migrations
        // NEON_POOL_CONNECTION_STRING: project.connectionUriPooler,
        MIGRATION_CONNECTION_STRING: migrationConnectionString,
        NEON_APP_ROLE_NAME: 'crm-app-user',
        NEON_MIGRATION_ROLE_NAME: 'crm-migration-user',
      },
    });
    return {
      PoolConnectionString: project.connectionUriPooler,
      PublicApiUrl: publicApi?.url,
      MigrationRoleName: 'crm-migration-user',
      AppRoleName: 'crm-app-user',
      BranchUrn: branch.urn,
      EndpointHost: endpoint.host,
      MigrationConnectionString: migrationConnectionString,
      jwksApiUrl: jwksApi.url,
    };
  },
});
// TODO: REMOVE MIGRATION USER CONFIG
// AND USE .EXISTING FOR THE APP ROLE
// PASS THE APP USER NAME AND PW TO THE DB CONTROLLER
// EITHER DIRECTLY OR BY CREATING A SECRET

// RECREATE CUSTOM MIGRATION TO GIVE APP USER CRUD ACCESS TO ALL TABLES
