CREATE TABLE "accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"name" text NOT NULL,
	"type" text DEFAULT 'prospect' NOT NULL,
	"industry" text,
	"website" text,
	"phone" text,
	"address_line_1" text,
	"address_line_2" text,
	"city" text,
	"state" text,
	"zip_code" text,
	"country" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"type" text NOT NULL,
	"subject" text NOT NULL,
	"description" text,
	"related_to_type" text,
	"related_to_id" integer,
	"created_by" integer,
	"activity_date" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activities" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"account_id" integer,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text,
	"phone" text,
	"title" text,
	"role" text,
	"is_primary" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contacts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "estimates" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"opportunity_id" integer,
	"account_id" integer NOT NULL,
	"estimate_number" text NOT NULL,
	"description" text,
	"line_items" jsonb,
	"subtotal" numeric(12, 2) NOT NULL,
	"tax" numeric(12, 2),
	"total" numeric(12, 2) NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"valid_until" timestamp,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "estimates_estimate_number_unique" UNIQUE("estimate_number")
);
--> statement-breakpoint
ALTER TABLE "estimates" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"project_id" integer,
	"account_id" integer NOT NULL,
	"invoice_number" text NOT NULL,
	"line_items" jsonb,
	"subtotal" numeric(12, 2) NOT NULL,
	"tax" numeric(12, 2),
	"total" numeric(12, 2) NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"due_date" timestamp,
	"paid_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
ALTER TABLE "invoices" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"project_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"scheduled_start" timestamp,
	"scheduled_end" timestamp,
	"assigned_to" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "jobs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"account_id" integer,
	"contact_id" integer,
	"title" text NOT NULL,
	"source" text,
	"status" text DEFAULT 'new' NOT NULL,
	"value" numeric(12, 2),
	"assigned_to" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "leads" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "opportunities" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"lead_id" integer,
	"account_id" integer,
	"contact_id" integer,
	"title" text NOT NULL,
	"description" text,
	"stage" text DEFAULT 'qualification' NOT NULL,
	"value" numeric(12, 2),
	"probability" integer,
	"expected_close_date" timestamp,
	"assigned_to" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"closed_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "opportunities" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"opportunity_id" integer,
	"account_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'planning' NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp,
	"budget" numeric(12, 2),
	"actual_cost" numeric(12, 2),
	"project_manager_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "projects" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'todo' NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"due_date" timestamp,
	"assigned_to" integer,
	"created_by" integer,
	"related_to_type" text,
	"related_to_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "tasks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tenants_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "tenants" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"role" text DEFAULT 'user' NOT NULL,
	"age" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_project_manager_id_users_id_fk" FOREIGN KEY ("project_manager_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "accounts_app_policy" ON "accounts" AS RESTRICTIVE FOR ALL TO "crm-app-user" USING ("accounts"."tenant_id" = current_setting('app.current_tenant_id')::integer);--> statement-breakpoint
CREATE POLICY "accounts_migration_policy" ON "accounts" AS RESTRICTIVE FOR ALL TO "crm-migration-user" USING (current_user = 'crm-migration-user');--> statement-breakpoint
CREATE POLICY "activities_app_policy" ON "activities" AS RESTRICTIVE FOR ALL TO "crm-app-user" USING ("activities"."tenant_id" = current_setting('app.current_tenant_id')::integer);--> statement-breakpoint
CREATE POLICY "activities_migration_policy" ON "activities" AS RESTRICTIVE FOR ALL TO "crm-migration-user" USING (current_user = 'crm-migration-user');--> statement-breakpoint
CREATE POLICY "contacts_app_policy" ON "contacts" AS RESTRICTIVE FOR ALL TO "crm-app-user" USING ("contacts"."tenant_id" = current_setting('app.current_tenant_id')::integer);--> statement-breakpoint
CREATE POLICY "contacts_migration_policy" ON "contacts" AS RESTRICTIVE FOR ALL TO "crm-migration-user" USING (current_user = 'crm-migration-user');--> statement-breakpoint
CREATE POLICY "estimates_app_policy" ON "estimates" AS RESTRICTIVE FOR ALL TO "crm-app-user" USING ("estimates"."tenant_id" = current_setting('app.current_tenant_id')::integer);--> statement-breakpoint
CREATE POLICY "estimates_migration_policy" ON "estimates" AS RESTRICTIVE FOR ALL TO "crm-migration-user" USING (current_user = 'crm-migration-user');--> statement-breakpoint
CREATE POLICY "invoices_app_policy" ON "invoices" AS RESTRICTIVE FOR ALL TO "crm-app-user" USING ("invoices"."tenant_id" = current_setting('app.current_tenant_id')::integer);--> statement-breakpoint
CREATE POLICY "invoices_migration_policy" ON "invoices" AS RESTRICTIVE FOR ALL TO "crm-migration-user" USING (current_user = 'crm-migration-user');--> statement-breakpoint
CREATE POLICY "jobs_app_policy" ON "jobs" AS RESTRICTIVE FOR ALL TO "crm-app-user" USING ("jobs"."tenant_id" = current_setting('app.current_tenant_id')::integer);--> statement-breakpoint
CREATE POLICY "jobs_migration_policy" ON "jobs" AS RESTRICTIVE FOR ALL TO "crm-migration-user" USING (current_user = 'crm-migration-user');--> statement-breakpoint
CREATE POLICY "leads_app_policy" ON "leads" AS RESTRICTIVE FOR ALL TO "crm-app-user" USING ("leads"."tenant_id" = current_setting('app.current_tenant_id')::integer);--> statement-breakpoint
CREATE POLICY "leads_migration_policy" ON "leads" AS RESTRICTIVE FOR ALL TO "crm-migration-user" USING (current_user = 'crm-migration-user');--> statement-breakpoint
CREATE POLICY "opportunities_app_policy" ON "opportunities" AS RESTRICTIVE FOR ALL TO "crm-app-user" USING ("opportunities"."tenant_id" = current_setting('app.current_tenant_id')::integer);--> statement-breakpoint
CREATE POLICY "opportunities_migration_policy" ON "opportunities" AS RESTRICTIVE FOR ALL TO "crm-migration-user" USING (current_user = 'crm-migration-user');--> statement-breakpoint
CREATE POLICY "projects_app_policy" ON "projects" AS RESTRICTIVE FOR ALL TO "crm-app-user" USING ("projects"."tenant_id" = current_setting('app.current_tenant_id')::integer);--> statement-breakpoint
CREATE POLICY "projects_migration_policy" ON "projects" AS RESTRICTIVE FOR ALL TO "crm-migration-user" USING (current_user = 'crm-migration-user');--> statement-breakpoint
CREATE POLICY "tasks_app_policy" ON "tasks" AS RESTRICTIVE FOR ALL TO "crm-app-user" USING ("tasks"."tenant_id" = current_setting('app.current_tenant_id')::integer);--> statement-breakpoint
CREATE POLICY "tasks_migration_policy" ON "tasks" AS RESTRICTIVE FOR ALL TO "crm-migration-user" USING (current_user = 'crm-migration-user');--> statement-breakpoint
CREATE POLICY "tenants_app_policy" ON "tenants" AS RESTRICTIVE FOR ALL TO "crm-app-user" USING (true);--> statement-breakpoint
CREATE POLICY "tenants_migration_policy" ON "tenants" AS RESTRICTIVE FOR ALL TO "crm-migration-user" USING (current_user = 'crm-migration-user');--> statement-breakpoint
CREATE POLICY "users_app_policy" ON "users" AS RESTRICTIVE FOR ALL TO "crm-app-user" USING ("users"."tenant_id" = current_setting('app.current_tenant_id')::integer);--> statement-breakpoint
CREATE POLICY "users_migration_policy" ON "users" AS RESTRICTIVE FOR ALL TO "crm-migration-user" USING (current_user = 'crm-migration-user');