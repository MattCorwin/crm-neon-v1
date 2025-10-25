#!/usr/bin/env tsx

import { SSMClient, PutParameterCommand, GetParameterCommand } from '@aws-sdk/client-ssm';
import { generateKeyPairSync, randomBytes } from 'crypto';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { config } from '../src/common/config';

interface SetupOptions {
  stage: string;
  force?: boolean;
  outputKeys?: boolean;
}

class InitialSetup {
  private ssmClient: SSMClient;
  private stage: string;
  private stagePostfix: string;
  private force: boolean;
  private outputKeys: boolean;

  constructor(options: SetupOptions) {
    this.stage = options.stage;
    this.stagePostfix = this.stage === 'prod' ? '-prod' : '-dev';
    this.force = options.force || false;
    this.outputKeys = options.outputKeys || false;
    
    this.ssmClient = new SSMClient({
      region: config.awsRegion,
    });
  }

  /**
   * Generate RSA key pair for JWT signing
   */
  private generateJWTKeyPair(): { publicKey: string; privateKey: string } {
    console.log('🔑 Generating RSA key pair for JWT signing...');
    
    const { publicKey, privateKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });

    return { publicKey, privateKey };
  }

  /**
   * Generate a secure API key
   */
  private generateApiKey(): string {
    console.log('🔐 Generating secure API key...');
    
    // Generate 32 random bytes and encode as base64
    const randomData = randomBytes(32);
    return randomData.toString('base64');
  }

  /**
   * Check if a parameter already exists in SSM
   */
  private async parameterExists(parameterName: string): Promise<boolean> {
    try {
      await this.ssmClient.send(new GetParameterCommand({
        Name: parameterName,
        WithDecryption: true,
      }));
      return true;
    } catch (error: any) {
      if (error.name === 'ParameterNotFound') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Store a parameter in SSM Parameter Store
   */
  private async storeParameter(
    parameterName: string, 
    value: string, 
    description: string,
    overwrite: boolean = false
  ): Promise<void> {
    try {
      await this.ssmClient.send(new PutParameterCommand({
        Name: parameterName,
        Value: value,
        Description: description,
        Type: 'SecureString',
        Overwrite: overwrite,
        Tags: [
          {
            Key: 'Environment',
            Value: this.stage,
          },
          {
            Key: 'Application',
            Value: 'crm-neon-v1',
          },
          {
            Key: 'ManagedBy',
            Value: 'initialSetup',
          },
        ],
      }));
      
      console.log(`✅ Stored parameter: ${parameterName}`);
    } catch (error) {
      console.error(`❌ Failed to store parameter ${parameterName}:`, error);
      throw error;
    }
  }

  /**
   * Store JWT keys in SSM
   */
  private async storeJWTKeys(publicKey: string, privateKey: string): Promise<void> {
    const publicKeyName = `${config.jwtPublicKeyPrefix}${this.stagePostfix}`;
    const privateKeyName = `${config.jwtPrivateKeyPrefix}${this.stagePostfix}`;

    // Check if keys already exist
    const publicKeyExists = await this.parameterExists(publicKeyName);
    const privateKeyExists = await this.parameterExists(privateKeyName);

    if ((publicKeyExists || privateKeyExists) && !this.force) {
      console.log(`⚠️  JWT keys already exist for stage '${this.stage}'. Use --force to overwrite.`);
      return;
    }

    await Promise.all([
      this.storeParameter(
        publicKeyName,
        publicKey,
        `JWT public key for CRM application (${this.stage} stage)`,
        this.force
      ),
      this.storeParameter(
        privateKeyName,
        privateKey,
        `JWT private key for CRM application (${this.stage} stage)`,
        this.force
      ),
    ]);
  }

  /**
   * Store API key in SSM
   */
  private async storeApiKey(apiKey: string): Promise<void> {
    const apiKeyName = `${config.apiKeyPrefix}${this.stagePostfix}`;

    const apiKeyExists = await this.parameterExists(apiKeyName);
    if (apiKeyExists && !this.force) {
      console.log(`⚠️  API key already exists for stage '${this.stage}'. Use --force to overwrite.`);
      return;
    }

    await this.storeParameter(
      apiKeyName,
      apiKey,
      `API key for CRM application authentication (${this.stage} stage)`,
      this.force
    );
  }

  /**
   * Output generated keys to files (optional)
   */
  private outputKeysToFiles(publicKey: string, privateKey: string, apiKey: string): void {
    if (!this.outputKeys) return;

    const outputDir = join(process.cwd(), 'generated-keys', this.stage);
    
    try {
      // Create directory if it doesn't exist
      const fs = require('fs');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Write keys to files
      writeFileSync(join(outputDir, 'jwt-public.pem'), publicKey);
      writeFileSync(join(outputDir, 'jwt-private.pem'), privateKey);
      writeFileSync(join(outputDir, 'api-key.txt'), apiKey);

      console.log(`📁 Keys written to: ${outputDir}`);
      console.log('⚠️  IMPORTANT: Delete these files after verifying the setup!');
    } catch (error) {
      console.error('❌ Failed to write keys to files:', error);
    }
  }

  /**
   * Main setup method
   */
  async setup(): Promise<void> {
    console.log(`🚀 Starting initial setup for stage: ${this.stage}`);
    console.log(`📍 AWS Region: ${config.awsRegion}`);
    console.log(`🔄 Force overwrite: ${this.force}`);
    console.log('');

    try {
      // Generate keys
      const { publicKey, privateKey } = this.generateJWTKeyPair();
      const apiKey = this.generateApiKey();

      // Store keys in SSM
      await this.storeJWTKeys(publicKey, privateKey);
      await this.storeApiKey(apiKey);

      // Optionally output to files
      this.outputKeysToFiles(publicKey, privateKey, apiKey);

      console.log('');
      console.log('🎉 Initial setup completed successfully!');
      console.log('');
      console.log('📋 Generated secrets:');
      console.log(`   • JWT Public Key: ${config.jwtPublicKeyPrefix}${this.stagePostfix}`);
      console.log(`   • JWT Private Key: ${config.jwtPrivateKeyPrefix}${this.stagePostfix}`);
      console.log(`   • API Key: ${config.apiKeyPrefix}${this.stagePostfix}`);
      console.log('');
      console.log('🔧 Next steps:');
      console.log('   1. Deploy your application: npm run deploy:feat or npm run deploy:prod');
      console.log('   2. Test the authentication endpoints');
      console.log('   3. If you used --output-keys, delete the generated-keys directory');

    } catch (error) {
      console.error('❌ Setup failed:', error);
      process.exit(1);
    }
  }
}

/**
 * Parse command line arguments
 */
function parseArgs(): SetupOptions {
  const args = process.argv.slice(2);
  const options: SetupOptions = {
    stage: 'dev', // default stage
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--stage':
      case '-s':
        options.stage = args[++i];
        break;
      case '--force':
      case '-f':
        options.force = true;
        break;
      case '--output-keys':
      case '-o':
        options.outputKeys = true;
        break;
      case '--help':
      case '-h':
        console.log(`
CRM Neon v1 - Initial Setup Script

Usage: tsx scripts/initialSetup.ts [options]

Options:
  --stage, -s <stage>     Deployment stage [default: dev]
  --force, -f             Force overwrite existing secrets
  --output-keys, -o       Output generated keys to files (for verification)
  --help, -h              Show this help message

Examples:
  tsx scripts/initialSetup.ts --stage dev
  tsx scripts/initialSetup.ts --stage prod --force
  tsx scripts/initialSetup.ts --stage dev --output-keys

This script generates and stores the following secrets in AWS SSM Parameter Store:
  • JWT Public Key (RSA 2048-bit, PEM format)
  • JWT Private Key (RSA 2048-bit, PKCS#8 format)
  • API Key (32-byte random, base64 encoded)

The secrets are named according to the stage and all non prod stages are prefixed with -dev:
  • Dev stage: {jwtPublicKeyPrefix}-dev, {jwtPrivateKeyPrefix}-dev, {apiKeyPrefix}-dev
  • Prod stage: {jwtPublicKeyPrefix}-prod, {jwtPrivateKeyPrefix}-prod, {apiKeyPrefix}-prod
        `);
        process.exit(0);
        break;
      default:
        if (arg.startsWith('-')) {
          console.error(`Unknown option: ${arg}`);
          console.error('Use --help for usage information');
          process.exit(1);
        }
        break;
    }
  }

  return options;
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  try {
    const options = parseArgs();
    const setup = new InitialSetup(options);
    await setup.setup();
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}

export { InitialSetup, SetupOptions };
