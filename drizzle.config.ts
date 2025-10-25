import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/entities/index.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.MIGRATION_CONNECTION_STRING!,
  },
  verbose: true,
  strict: true,
});
