#!/usr/bin/env bash
set -euo pipefail

# Extract connection string from SST outputs (uses migration role)
export MIGRATION_CONNECTION_STRING=$(jq -r '.MigrationConnectionString' .sst/outputs.json)

echo "Running Drizzle migrations with migration role (crm-migration-user)"
echo "This role has full database privileges for schema changes"
npm run migrate
