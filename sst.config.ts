/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  async app(input) {
    const { config } = await import('./src/common/config.ts');
    return {
      name: config.appName,
      removal: input?.stage === 'production' ? 'retain' : 'remove',
      protect: ['production'].includes(input?.stage),
      home: 'aws',
      providers: {
        neon: true,
        aws: {
          region: config.awsRegion as any,
        },
      },
    };
  },
  async run() {
    const { config } = await import('./src/common/config.ts');
    const stagePostfix = $app.stage === 'prod' ? '-prod' : '-dev';
    const domainRoot = config.domainRoot;
    const customDomain =
      $app.stage === 'production' ? domainRoot : `${$app.stage}.${domainRoot}`;

    const project = new neon.Project(
      'MyAppProject',
      {
        orgId: config.neonOrgId,
        historyRetentionSeconds: config.historyRetentionSeconds,
      },
      {
        import: config.neonProjectImport,
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
        name: config.appRoleName,
        projectId: project.id,
      },
      { dependsOn: [branch] }
    );

    const migrationRole = new neon.Role(
      'CrmMigrationRole',
      {
        branchId: branch.id,
        name: config.migrationRoleName,
        projectId: project.id,
      },
      { dependsOn: [branch] }
    );

    const database = new neon.Database(
      'CrmDatabase',
      {
        branchId: branch.id,
        name: config.databaseName,
        ownerName: migrationRole.name,
        projectId: project.id,
      },
      { dependsOn: [branch, migrationRole] }
    );

    const migrationConnectionString = $interpolate`postgres://${migrationRole.name}:${migrationRole.password}@${endpoint.host}/${database.name}?sslmode=require`;
    const appConnectionString = $interpolate`postgres://${appRole.name}:${appRole.password}@${endpoint.host}/${database.name}?sslmode=require`;

    const jwksApi = new sst.aws.ApiGatewayV2('JwksApi', {
      domain: domainRoot ? `jwks.${customDomain}` : undefined,
    });

    // JWKS endpoint for JWT validation
    jwksApi.route('GET /.well-known/jwks.json', {
      handler: 'src/routes/jwks/jwks.handler',
      timeout: '30 seconds',
      memory: '512 MB',
      architecture: 'arm64',
      runtime: 'nodejs22.x',
      environment: {
        JWT_PUBLIC_KEY_NAME: `${config.jwtPublicKeyPrefix}${stagePostfix}`,
      },
      permissions: [
        {
          actions: ['ssm:GetParameter'],
          resources: [
            `arn:aws:ssm:${config.awsRegion}:*:parameter/${config.jwtPublicKeyPrefix}${stagePostfix}`,
          ],
        },
      ],
    });

    jwksApi.route('GET /.well-known/openid-configuration', {
      handler: 'src/routes/jwks/openidConfiguration.handler',
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
        {
          link: [jwksApi],
          domain: domainRoot ? `api.${customDomain}` : undefined,
        },
        { dependsOn: [jwksApi] }
      );

      const authorizer = publicApi.addAuthorizer({
        name: 'JwtAuthorizer',
        jwt: {
          issuer: jwksApi.url,
          audiences: [config.jwtAudience],
          identitySource: '$request.header.authorization',
        },
      });

      const lambdaAuthorizer = publicApi.addAuthorizer({
        name: 'LambdaAuthorizer',
        lambda: {
          function: {
            handler: 'src/routes/admin/lambdaAuthorizer.handler',
            runtime: 'nodejs22.x',
            architecture: 'arm64',
            environment: {
              API_KEY_NAME: `${config.apiKeyPrefix}${stagePostfix}`,
            },
            permissions: [
              {
                actions: ['ssm:GetParameter'],
                resources: [
                  `arn:aws:ssm:${config.awsRegion}:*:parameter/${config.apiKeyPrefix}${stagePostfix}`,
                ],
              },
            ],
          },
          identitySources: ['$request.header.x-api-key'],
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
            NEON_APP_ROLE_NAME: config.appRoleName,
            NEON_MIGRATION_ROLE_NAME: config.migrationRoleName,
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

      publicApi.route(
        'POST /admin/token',
        {
          handler: 'src/routes/admin/issueToken.handler',
          timeout: '30 seconds',
          memory: '512 MB',
          architecture: 'arm64',
          runtime: 'nodejs22.x',
          environment: {
            // API_KEY_NAME: `${config.apiKeyPrefix}${stagePostfix}`,
            JWT_ISSUER: jwksApi.url,
            JWT_AUDIENCE: config.jwtAudience,
            JWT_PUBLIC_KEY_NAME: `${config.jwtPublicKeyPrefix}${stagePostfix}`,
            JWT_PRIVATE_KEY_NAME: `${config.jwtPrivateKeyPrefix}${stagePostfix}`,
          },
          permissions: [
            {
              actions: ['ssm:GetParameter'],
              resources: [
                `arn:aws:ssm:${config.awsRegion}:*:parameter/${config.jwtPublicKeyPrefix}${stagePostfix}`,
                `arn:aws:ssm:${config.awsRegion}:*:parameter/${config.jwtPrivateKeyPrefix}${stagePostfix}`,
                // `arn:aws:ssm:${config.awsRegion}:*:parameter/${config.apiKeyPrefix}${stagePostfix}`,
              ],
            },
          ],
        },
        {
          auth: {
            lambda: lambdaAuthorizer.id,
          },
        }
      );

      publicApi.route(
        'POST /admin/{entity}',
        {
          handler: 'src/routes/admin/index.handler',
          timeout: '30 seconds',
          memory: '512 MB',
          architecture: 'arm64',
          runtime: 'nodejs22.x',
          environment: {
            APP_CONNECTION_STRING: appConnectionString,
            NEON_APP_ROLE_NAME: config.appRoleName,
          },
        },
        {
          auth: {
            lambda: lambdaAuthorizer.id,
          },
        }
      );
    }

    new sst.x.DevCommand('RunMigrations', {
      dev: {
        autostart: true,
        command: 'npm run migrate',
      },
      environment: {
        MIGRATION_CONNECTION_STRING: migrationConnectionString,
        NEON_APP_ROLE_NAME: config.appRoleName,
        NEON_MIGRATION_ROLE_NAME: config.migrationRoleName,
      },
    });
    return {
      PoolConnectionString: project.connectionUriPooler,
      PublicApiUrl: publicApi?.url,
      MigrationRoleName: config.migrationRoleName,
      AppRoleName: config.appRoleName,
      BranchUrn: branch.urn,
      EndpointHost: endpoint.host,
      MigrationConnectionString: migrationConnectionString,
      jwksApiUrl: jwksApi.url,
    };
  },
});
