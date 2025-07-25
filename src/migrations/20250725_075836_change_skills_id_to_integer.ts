import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Drop dependent tables first
    DROP TABLE IF EXISTS "skills_skills" CASCADE;

    -- Drop skills table
    DROP TABLE IF EXISTS "skills" CASCADE;

    -- Recreate skills table with integer ID
    CREATE TABLE "skills" (
      "id" serial PRIMARY KEY NOT NULL,
      "category" varchar NOT NULL,
      "sort_order" numeric DEFAULT 0,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    -- Recreate skills_skills table with integer _parent_id
    CREATE TABLE "skills_skills" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "skill" varchar
    );

    -- Update payload_locked_documents_rels to change skills_id to integer and re-add FK
    -- First, drop the existing foreign key constraint if it exists
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_skills_fk') THEN
        ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_skills_fk";
      END IF;
    END $$;

    -- Alter skills_id column to integer
    ALTER TABLE "payload_locked_documents_rels" ALTER COLUMN "skills_id" TYPE integer USING "skills_id"::integer;

    -- Re-add foreign key constraints for skills_skills and payload_locked_documents_rels
    ALTER TABLE "skills_skills" ADD CONSTRAINT "skills_skills_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_skills_fk" FOREIGN KEY ("skills_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;

    -- Recreate indexes for the recreated tables
    CREATE INDEX IF NOT EXISTS "skills_skills_order_idx" ON "skills_skills" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "skills_skills_parent_id_idx" ON "skills_skills" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "skills_updated_at_idx" ON "skills" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "skills_created_at_idx" ON "skills" USING btree ("created_at");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_skills_id_idx" ON "payload_locked_documents_rels" USING btree ("skills_id");
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- Revert changes (this will be complex and might require manual data handling if data was inserted after 'up')
    -- For simplicity, this 'down' migration will drop and recreate tables with original types (assuming numeric for skills.id)

    -- Drop dependent tables first
    DROP TABLE IF EXISTS "skills_skills" CASCADE;

    -- Drop skills table
    DROP TABLE IF EXISTS "skills" CASCADE;

    -- Recreate skills table with numeric ID (assuming original was numeric, not uuid)
    CREATE TABLE "skills" (
      "id" numeric PRIMARY KEY NOT NULL,
      "category" varchar NOT NULL,
      "sort_order" numeric DEFAULT 0,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    -- Recreate skills_skills table with numeric _parent_id
    CREATE TABLE "skills_skills" (
      "_order" integer NOT NULL,
      "_parent_id" numeric NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "skill" varchar
    );

    -- Update payload_locked_documents_rels to change skills_id back to numeric and re-add FK
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_skills_fk') THEN
        ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_skills_fk";
      END IF;
    END $$;

    ALTER TABLE "payload_locked_documents_rels" ALTER COLUMN "skills_id" TYPE numeric USING "skills_id"::numeric;

    -- Re-add foreign key constraints
    ALTER TABLE "skills_skills" ADD CONSTRAINT "skills_skills_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_skills_fk" FOREIGN KEY ("skills_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;

    -- Recreate indexes for the recreated tables
    CREATE INDEX IF NOT EXISTS "skills_skills_order_idx" ON "skills_skills" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "skills_skills_parent_id_idx" ON "skills_skills" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "skills_updated_at_idx" ON "skills" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "skills_created_at_idx" ON "skills" USING btree ("created_at");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_skills_id_idx" ON "payload_locked_documents_rels" USING btree ("skills_id");
  `)
}
