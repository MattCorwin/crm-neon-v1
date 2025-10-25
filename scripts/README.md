# Initial Setup Script

This script generates and stores all necessary API keys and secrets for the CRM Neon v1 application in AWS SSM Parameter Store.

## Prerequisites

- AWS CLI configured with appropriate permissions
- Node.js and npm installed
- Access to AWS SSM Parameter Store

## Required AWS Permissions

The script requires the following AWS permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ssm:GetParameter",
        "ssm:PutParameter"
      ],
      "Resource": "arn:aws:ssm:us-east-2:*:parameter/crm-*"
    }
  ]
}
```

## Usage

### Basic Usage

```bash
# Setup for development stage
npm run setup:dev

# Setup for production stage
npm run setup:prod

# Setup with custom stage
npm run setup -- --stage dev
```

### Advanced Options

```bash
# Force overwrite existing secrets
npm run setup -- --stage dev --force

# Output generated keys to files (for verification)
npm run setup -- --stage dev --output-keys

# Show help
npm run setup -- --help
```

### Command Line Options

- `--stage, -s <stage>`: Deployment stage (dev|prod) [default: dev]
- `--force, -f`: Force overwrite existing secrets
- `--output-keys, -o`: Output generated keys to files (for verification)
- `--help, -h`: Show help message

## Generated Secrets

The script creates the following secrets in AWS SSM Parameter Store using configuration from `src/common/config.ts`:

### Development Stage
- `{JWT_PUBLIC_KEY_PREFIX}-dev`: JWT public key (RSA 2048-bit, PEM format)
- `{JWT_PRIVATE_KEY_PREFIX}-dev`: JWT private key (RSA 2048-bit, PKCS#8 format)
- `{API_KEY_PREFIX}-dev`: API key (32-byte random, base64 encoded)

### Production Stage
- `{JWT_PUBLIC_KEY_PREFIX}-prod`: JWT public key (RSA 2048-bit, PEM format)
- `{JWT_PRIVATE_KEY_PREFIX}-prod`: JWT private key (RSA 2048-bit, PKCS#8 format)
- `{API_KEY_PREFIX}-prod`: API key (32-byte random, base64 encoded)

### Default Values
By default, the prefixes are:
- `JWT_PUBLIC_KEY_PREFIX`: `crm-jwt-public-key`
- `JWT_PRIVATE_KEY_PREFIX`: `crm-jwt-private-key`
- `API_KEY_PREFIX`: `crm-api-key`

These can be overridden by setting environment variables or modifying `src/common/config.ts`.

## Security Features

- All secrets are stored as `SecureString` type in SSM
- Secrets are tagged with environment and application metadata
- RSA 2048-bit key pairs for JWT signing
- Cryptographically secure random API keys
- Protection against overwriting existing secrets (unless `--force` is used)

## Next Steps

After running the setup script:

1. Deploy your application:
   ```bash
   npm run deploy:feat  # for dev stage
   npm run deploy:prod  # for prod stage
   ```

2. Test the authentication endpoints

3. If you used `--output-keys`, delete the `generated-keys` directory after verification

## Troubleshooting

### Common Issues

1. **Permission Denied**: Ensure your AWS credentials have the required SSM permissions
2. **Parameter Already Exists**: Use `--force` flag to overwrite existing secrets
3. **Invalid Stage**: Only 'dev' and 'prod' stages are supported

### Verification

To verify the setup was successful, you can check the AWS SSM Parameter Store console or use the AWS CLI:

```bash
aws ssm get-parameter --name "crm-jwt-public-key-dev" --with-decryption
aws ssm get-parameter --name "crm-jwt-private-key-dev" --with-decryption
aws ssm get-parameter --name "crm-api-key-dev" --with-decryption
```

## Configuration

The setup script uses configuration from `src/common/config.ts` which supports environment variables with sensible defaults:

### Environment Variables
- `AWS_REGION`: AWS region (default: `us-east-2`)
- `JWT_PUBLIC_KEY_PREFIX`: JWT public key prefix (default: `crm-jwt-public-key`)
- `JWT_PRIVATE_KEY_PREFIX`: JWT private key prefix (default: `crm-jwt-private-key`)
- `API_KEY_PREFIX`: API key prefix (default: `crm-api-key`)
- `JWT_AUDIENCE`: JWT audience (default: `crm-neon-api`)
- `JWT_ISSUER`: JWT issuer (default: `crm-neon`)
- `NEON_ORG_ID`: Neon organization ID
- `NEON_PROJECT_IMPORT`: Neon project import ID
- `DATABASE_NAME`: Database name (default: `crm`)
- `APP_ROLE_NAME`: Application role name (default: `crm-app-user`)
- `MIGRATION_ROLE_NAME`: Migration role name (default: `crm-migration-user`)
- `APP_NAME`: Application name (default: `crm-neon-v1`)
- `HISTORY_RETENTION_SECONDS`: History retention in seconds (default: `21600`)

## File Structure

```
scripts/
├── initialSetup.ts    # Main setup script
└── run-migrations.sh  # Database migration script
```
