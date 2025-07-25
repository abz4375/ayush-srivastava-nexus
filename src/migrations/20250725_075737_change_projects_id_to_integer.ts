import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Drop dependent tables first
    DROP TABLE IF EXISTS "projects_technologies" CASCADE;

    -- Drop projects table
    DROP TABLE IF EXISTS "projects" CASCADE;

    -- Recreate projects table with integer ID
    CREATE TABLE "projects" (
      "id" serial PRIMARY KEY NOT NULL,
      "title" varchar NOT NULL,
      "description" varchar NOT NULL,
      "duration" varchar,
      "github_url" varchar,
      "demo_url" varchar,
      "image_url" varchar,
      "sort_order" numeric DEFAULT 0,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    -- Recreate projects_technologies table with integer _parent_id
    CREATE TABLE "projects_technologies" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "technology" varchar
    );

    -- Update payload_locked_documents_rels to change projects_id to integer and re-add FK
    -- First, drop the existing foreign key constraint if it exists
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_projects_fk') THEN
        ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_projects_fk";
      END IF;
    END $$;

    -- Alter projects_id column to integer
    ALTER TABLE "payload_locked_documents_rels" ALTER COLUMN "projects_id" TYPE integer USING "projects_id"::integer;

    -- Re-add foreign key constraints for projects_technologies and payload_locked_documents_rels
    ALTER TABLE "projects_technologies" ADD CONSTRAINT "projects_technologies_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;

    -- Recreate indexes for the recreated tables
    CREATE INDEX IF NOT EXISTS "projects_technologies_order_idx" ON "projects_technologies" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "projects_technologies_parent_id_idx" ON "projects_technologies" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "projects_updated_at_idx" ON "projects" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "projects_created_at_idx" ON "projects" USING btree ("created_at");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_projects_id_idx" ON "payload_locked_documents_rels" USING btree ("projects_id");
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- Revert changes (this will be complex and might require manual data handling if data was inserted after 'up')
    -- For simplicity, this 'down' migration will drop and recreate tables with original types (assuming numeric for projects.id)

    -- Drop dependent tables first
    DROP TABLE IF EXISTS "projects_technologies" CASCADE;

    -- Drop projects table
    DROP TABLE IF EXISTS "projects" CASCADE;

    -- Recreate projects table with numeric ID (assuming original was numeric, not uuid)
    CREATE TABLE "projects" (
      "id" numeric PRIMARY KEY NOT NULL,
      "title" varchar NOT NULL,
      "description" varchar NOT NULL,
      "duration" varchar,
      "github_url" varchar,
      "demo_url" varchar,
      "image_url" varchar,
      "sort_order" numeric DEFAULT 0,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    -- Recreate projects_technologies table with numeric _parent_id
    CREATE TABLE "projects_technologies" (
      "_order" integer NOT NULL,
      "_parent_id" numeric NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "technology" varchar
    );

    -- Update payload_locked_documents_rels to change projects_id back to numeric and re-add FK
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_projects_fk') THEN
        ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_projects_fk";
      END IF;
    END $$;

    ALTER TABLE "payload_locked_documents_rels" ALTER COLUMN "projects_id" TYPE numeric USING "projects_id"::numeric;

    -- Re-add foreign key constraints
    ALTER TABLE "projects_technologies" ADD CONSTRAINT "projects_technologies_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;

    -- Recreate indexes for the recreated tables
    CREATE INDEX IF NOT EXISTS "projects_technologies_order_idx" ON "projects_technologies" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "projects_technologies_parent_id_idx" ON "projects_technologies" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "projects_updated_at_idx" ON "projects" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "projects_created_at_idx" ON "projects" USING btree ("created_at");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_projects_id_idx" ON "payload_locked_documents_rels" USING btree ("projects_id");
  `)
}
