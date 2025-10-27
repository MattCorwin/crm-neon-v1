# CRM Neon v1 - Headless Multi-Tenant CRM System

A headless CRM system built with SST (Serverless Stack), Neon database, Drizzle ORM, and comprehensive Row Level Security (RLS) for tenant isolation. Designed to be bolted onto existing projects as a complete backend API.

## 🎯 Overview

This repository provides a full-featured, multi-tenant CRM backend that can be integrated into existing applications. Please note the admin routes are intended to be called from your existing backend (keep that api key secret), while the crm routes can be called from your frontend with a JWT token. It includes:

- **Multi-tenant architecture** with complete data isolation using PostgreSQL RLS
- **RESTful API** for managing CRM entities (accounts, contacts, leads, opportunities, projects, etc.)
- **JWT-based authentication** with secure token issuance
- **Role-based access control** separating admin operations from tenant operations
- **Neon serverless database** with automatic scaling
- **AWS Lambda** functions for serverless compute
- **API Gateway** with custom domain support
- **Automated database and role creation** with Neon and SST

## 🏗️ Architecture

### Components

1. **Authentication Endpoints (JWKS)**
   - `GET /.well-known/jwks.json` - Public keys for JWT validation
   - `GET /.well-known/openid-configuration` - OpenID Connect configuration

2. **CRM Endpoints** (`/crm/{entity}`)
   - Protected by JWT authentication
   - Tenant-isolated using RLS
   - Supports GET, POST, PUT/PATCH, DELETE operations

3. **Admin Endpoints**
   - `POST /admin/token` - Issue JWT tokens (protected by API key)
   - `POST /admin/{entity}` - Create admin-only entities (tenants, users)
   - `DELETE /admin/{entity}/{id}` - Delete admin-only entities

### Entity Types

**Admin-only entities** (require API key authentication):
- `tenants` - Tenant organizations
- `users` - User accounts

**CRM entities** (require JWT authentication):
- `accounts` - Company/client accounts
- `contacts` - Contact persons
- `leads` - Sales leads
- `opportunities` - Sales opportunities
- `projects` - Project management
- `estimates` - Cost estimates
- `jobs` - Job records
- `invoices` - Invoices
- `tasks` - Task tracking
- `activities` - Activity logs

## 📋 Prerequisites

Before you begin, ensure you have the following:

- **Node.js** (v18 or higher)
- **AWS CLI** configured with appropriate credentials
- **Neon account** with API access
- **AWS Account** with proper IAM permissions for SST
- **Domain name** (optional, for custom domain setup)

## 🚀 Installation

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd crm-neon-v1
npm install
```

### 2. Install AWS CLI

If you haven't installed the AWS CLI, follow these steps:

**macOS (Homebrew):**
```bash
brew install awscli
```

**Linux:**
```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

**Windows:**
```bash
# Download installer from AWS website
# https://awscli.amazonaws.com/AWSCLIV2.msi
```

**Verify installation:**
```bash
aws --version
```

Configure AWS CLI with your credentials:
```bash
aws configure
```

You'll need to provide:
- AWS Access Key ID
- AWS Secret Access Key
- Default region (e.g., `us-east-2`)
- Default output format (e.g., `json`)

### 3. Set Up Neon Database

1. **Sign up for Neon** at [neon.tech](https://neon.tech)

2. **Create a new project** in the Neon console

3. **Generate an API key**:
   - Go to your Neon project settings
   - Navigate to the API Keys section
   - Generate a new API key
   - Save the API key securely

4. **Get your Organization ID and Project ID**:
   - Organization ID: Found in the project URL or dashboard
   - Project ID: Found in the project URL or dashboard

5. **Set the Neon API key environment variable**:
   ```bash
   export NEON_API_KEY="your-neon-api-key"
   ```

   To make this permanent, add it to your shell profile:
   ```bash
   echo 'export NEON_API_KEY="your-neon-api-key"' >> ~/.zshrc  # or ~/.bashrc
   source ~/.zshrc
   ```

### 4. Configure SST

SST uses the AWS CLI credentials by default. Ensure your AWS user has the necessary permissions:

**Minimum required IAM permissions for SST:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "sts:GetCallerIdentity",
        "sts:AssumeRole",
        "iam:CreateRole",
        "iam:DeleteRole",
        "iam:AttachRolePolicy",
        "iam:DetachRolePolicy",
        "iam:PutRolePolicy",
        "iam:DeleteRolePolicy",
        "iam:ListRolePolicies",
        "iam:GetRole",
        "iam:PassRole",
        "ssm:PutParameter",
        "ssm:GetParameter",
        "ssm:DeleteParameter",
        "lambda:*",
        "apigateway:*",
        "logs:*",
        "cloudformation:*",
        "s3:*",
        "ec2:*",
        "acm:*",
        "route53:*"
      ],
      "Resource": "*"
    }
  ]
}
```

> **Note:** For production, follow the principle of least privilege and grant only the permissions actually needed.

### 5. Configure Application Settings

Edit `src/common/config.ts` to set your configuration:

```typescript
export const config = {
  // AWS Configuration
  awsRegion: process.env.AWS_REGION || 'us-east-2',  // Your AWS region
  
  // Neon Configuration (REQUIRED)
  neonOrgId: process.env.NEON_ORG_ID || 'your-org-id',
  neonProjectImport: process.env.NEON_PROJECT_IMPORT || 'your-project-id',
  
  // Custom Domain (optional)
  domainRoot: process.env.CUSTOM_DOMAIN || 'crm.yourdomain.com',
  
  // ... other settings
};
```

### 6. Initialize Secrets

Run the initial setup script to generate and store JWT keys and API keys:

```bash
# For development environment
npm run setup:dev

# For production environment
npm run setup:prod
```

This script will:
- Generate RSA 2048-bit key pairs for JWT signing
- Generate secure API keys
- Store all secrets in AWS SSM Parameter Store

**View generated secrets** (optional, for verification):
```bash
npm run setup:dev -- --output-keys
```

The setup script will create these AWS SSM parameters:
- `crm-jwt-public-key-dev` / `crm-jwt-public-key-prod`
- `crm-jwt-private-key-dev` / `crm-jwt-private-key-prod`
- `crm-api-key-dev` / `crm-api-key-prod`

### 7. Set Up Custom Domain (Optional)

If you want to use a custom domain:

1. **Buy a domain** on Route53 or any other registrar
2. **Enter your domain** in `src/common/config.ts`:
   ```typescript
   domainRoot: process.env.CUSTOM_DOMAIN || 'crm.yourdomain.com',
   ```
3. **Update your domain's DNS** to point to AWS (this will be configured automatically by SST)

## 🚀 Deployment

### Initial Deployment (JWKS Endpoints)

The first deployment sets up the JWKS endpoints needed for JWT validation:

```bash
npm run init
```

This command will:
- Deploy the Neon infrastructure (project, branch, endpoint, roles, database)
- Create the JWKS API with OpenID Connect endpoints
- Run database migrations

Wait for the deployment to complete and note the JWKS URL from the outputs.

### Production Deployment (Full API)

After the initial deployment, deploy the full API:

```bash
# For feature/staging environment
npm run deploy:feat

# For production environment
npm run deploy:prod
```

This will deploy:
- The full CRM API with JWT authentication
- Admin endpoints with API key authentication
- Database migrations
- All necessary Lambda functions

### Verify Deployment

After deployment, SST will output URLs for:
- `jwksApiUrl` - JWKS endpoints for token validation
- `PublicApiUrl` - Main API endpoint

Test the endpoints:

```bash
# Test JWKS endpoint
curl https://jwks.yourdomain.com/.well-known/jwks.json

# Test OpenID configuration
curl https://jwks.yourdomain.com/.well-known/openid-configuration
```

## 📝 Usage

### Authentication Flow

#### 1. Issue a JWT Token

From your backend service, call the token issuance endpoint:

```bash
curl -X POST https://api.yourdomain.com/admin/token \
  -H "x-api-key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "1",
    "tenantId": "1"
  }'
```

Response:
```json
{
  "token": "eyJhbGc...",
  "expiresIn": 3600
}
```

#### 2. Use the Token to Access CRM Endpoints

```bash
curl https://api.yourdomain.com/crm/accounts \
  -H "Authorization: Bearer eyJhbGc..."
```

### Creating a Tenant and User

First, create a tenant:

```bash
curl -X POST https://api.yourdomain.com/admin/tenants \
  -H "x-api-key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Corp",
    "slug": "acme-corp"
  }'
```

Then, create a user for that tenant:

```bash
curl -X POST https://api.yourdomain.com/admin/users \
  -H "x-api-key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": 1,
    "name": "John Doe",
    "email": "john@acme.com",
    "role": "admin"
  }'
```

### CRM Operations

#### List Records

```bash
curl https://api.yourdomain.com/crm/accounts \
  -H "Authorization: Bearer your-token"
```

#### Get Single Record

```bash
curl https://api.yourdomain.com/crm/accounts/1 \
  -H "Authorization: Bearer your-token"
```

#### Create Record

```bash
curl -X POST https://api.yourdomain.com/crm/accounts \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tech Corp",
    "type": "customer",
    "industry": "Technology"
  }'
```

#### Update Record

```bash
curl -X PUT https://api.yourdomain.com/crm/accounts/1 \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Corp",
    "status": "inactive"
  }'
```

#### Delete Record

```bash
curl -X DELETE https://api.yourdomain.com/crm/accounts/1 \
  -H "Authorization: Bearer your-token"
```

## 🔐 Security

### Tenant Isolation

The system uses PostgreSQL Row Level Security (RLS) to ensure complete tenant data isolation:

- Each tenant's data is completely isolated
- RLS policies enforce `tenant_id` filtering at the database level
- Application roles have restricted access
- Migration roles can bypass RLS for schema changes

### Authentication

- **JWT Tokens**: RS256 algorithm with 2048-bit RSA keys
- **Token Expiration**: 1 hour default
- **API Keys**: Cryptographically secure 32-byte random keys
- **Secrets Storage**: AWS SSM Parameter Store with SecureString encryption

### Roles

The system uses two database roles:

1. **Migration Role** (`crm-migration-user`)
   - Full database access for schema changes
   - Used during migrations
   - Can bypass RLS for administrative operations

2. **App Role** (`crm-app-user`)
   - Restricted access with RLS policies
   - Tenant-scoped queries only
   - Used for all application operations

## 🛠️ Development

### Local Development

```bash
npm run dev
```

This starts the SST development environment with hot reloading.

### Database Migrations

Generate a new migration after schema changes:

```bash
npm run generate
```

Apply migrations:

```bash
npm run migrate
```

### Project Structure

```
src/
├── common/          # Shared configuration and utilities
├── db/              # Database configuration, entities, and controllers
│   ├── entities/    # Drizzle ORM entity definitions
│   └── config.ts    # Entity configuration
├── routes/          # API route handlers
│   ├── admin/       # Admin endpoints (API key auth)
│   ├── crm/         # CRM endpoints (JWT auth)
│   └── jwks/        # JWKS/OpenID endpoints
scripts/             # Setup and migration scripts
migrations/          # Database migration files
```

## 📚 API Documentation

For detailed API documentation, see:
- `scripts/README.md` - Script usage and setup
- Entity schemas in `src/db/entities/`
- Route handlers in `src/routes/`

## 🔧 Configuration Reference

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `AWS_REGION` | AWS region for deployment | `us-east-2` |
| `NEON_ORG_ID` | Neon organization ID | (required) |
| `NEON_PROJECT_IMPORT` | Neon project ID | (required) |
| `CUSTOM_DOMAIN` | Custom domain for API | (optional) |
| `JWT_AUDIENCE` | JWT audience claim | `crm-neon-api` |
| `DATABASE_NAME` | Database name | `crm` |
| `APP_ROLE_NAME` | Application role name | `crm-app-user` |
| `MIGRATION_ROLE_NAME` | Migration role name | `crm-migration-user` |

### AWS SSM Parameters

The system stores secrets in AWS SSM Parameter Store:

- `crm-jwt-public-key-{stage}` - JWT public key (PEM format)
- `crm-jwt-private-key-{stage}` - JWT private key (PKCS#8 format)
- `crm-api-key-{stage}` - API key for admin endpoints

## 🐛 Troubleshooting

### Common Issues

**1. AWS CLI not configured**
```bash
aws configure
```

**2. Neon API key not set**
```bash
export NEON_API_KEY="your-key"
```

**3. SST deployment fails**
- Check AWS credentials: `aws sts get-caller-identity`
- Verify IAM permissions
- Check CloudFormation console for detailed errors

**4. Database connection issues**
- Verify Neon endpoint is accessible
- Check network connectivity
- Verify SSL mode is properly configured

**5. JWT validation fails**
- Ensure JWKS endpoint is accessible
- Verify token hasn't expired
- Check JWT audience and issuer claims

## 📄 License

ISC

## 🤝 Contributing

This is a headless CRM designed for integration into existing projects. The authentication flow and admin operations are intended to be called from your existing backend.

## 📞 Support

For issues and questions:
- Check the troubleshooting section
- Review SST and Neon documentation
- Examine CloudWatch logs for Lambda errors