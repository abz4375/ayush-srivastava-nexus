import { buildConfig } from 'payload';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
// Removed webpackBundler import as it's causing module resolution issues

// Supabase URL and key are not directly used in this config, but kept for context if needed elsewhere.
// const supabaseUrl = "https://ecjlvseneqrvbxdhlqxc.supabase.co";
// const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export default buildConfig({
    admin: {
        user: 'users',
        // Removed bundler configuration as it's causing module resolution issues
        importMap: {
            baseDir: process.cwd(),
        },
    },
    editor: lexicalEditor({}),
    collections: [
        {
            slug: 'users',
            auth: true,
            admin: {
                // useAsTitle: 'name', // Moved to the 'name' field's admin config
            },
            access: {
                create: () => true,
                read: () => true,
                update: () => true,
                delete: () => true, // Collection level access
            },
            fields: [
                {
                    name: 'name',
                    type: 'text',
                    admin: {
                        useAsTitle: true, // Correct placement for useAsTitle
                    },
                },
                {
                    name: 'email',
                    type: 'email',
                    required: true,
                    unique: true,
                    admin: {
                        readOnly: true,
                    },
                    access: {
                        create: () => true,
                        read: () => true,
                        update: () => true,
                    },
                },
            ],
        },
        {
            slug: 'hero-content',
            access: {
                create: () => true,
                read: () => true,
                update: () => true,
                delete: () => true,
            },
            admin: {
                useAsTitle: 'name', // useAsTitle at collection level points to a field name
            },
            fields: [
                {
                    name: 'name',
                    type: 'text',
                    required: true,
                },
                {
                    name: 'title',
                    type: 'text',
                    required: true,
                },
                {
                    name: 'subtitle',
                    type: 'textarea',
                },
                {
                    name: 'description',
                    type: 'textarea',
                },
                {
                    name: 'github_url',
                    type: 'text',
                    label: 'GitHub URL',
                },
                {
                    name: 'linkedin_url',
                    type: 'text',
                    label: 'LinkedIn URL',
                },
                {
                    name: 'resume_url',
                    type: 'text',
                    label: 'Resume URL',
                },
            ],
        },
        {
            slug: 'experiences',
            access: {
                create: () => true,
                read: () => true,
                update: () => true,
                delete: () => true,
            },
            admin: {
                useAsTitle: 'position',
            },
            fields: [
                {
                    name: 'id',
                    type: 'number', // Changed from 'text' to 'number' to resolve type mismatch with _parent_id
                    admin: { hidden: true }
                },

                {
                    name: 'position',
                    type: 'text',
                    required: true,
                },
                {
                    name: 'company',
                    type: 'text',
                    required: true,
                },
                {
                    name: 'achievements', // Changed to achievements (array of objects) for multiple achievements
                    type: 'array',
                    fields: [
                        {
                            name: 'achievement',
                            type: 'textarea',
                        },
                    ],
                },
                {
                    name: 'technologies',
                    type: 'array',
                    fields: [
                        {
                            name: 'technology',
                            type: 'text',
                        },
                    ],
                },
                {
                    name: 'sort_order',
                    type: 'number',
                    defaultValue: 0,
                },
            ],
        },
        {
            slug: 'projects',
            access: {
                create: () => true,
                read: () => true,
                update: () => true,
                delete: () => true,
            },
            admin: {
                useAsTitle: 'title',
            },
            fields: [
                {
                    name: 'title',
                    type: 'text',
                    required: true,
                },
                {
                    name: 'description',
                    type: 'textarea',
                    required: true,
                },
                {
                    name: 'duration',
                    type: 'text',
                },
                {
                    name: 'technologies',
                    type: 'array',
                    fields: [
                        {
                            name: 'technology',
                            type: 'text',
                        },
                    ],
                },
                {
                    name: 'github_url',
                    type: 'text',
                    label: 'GitHub URL',
                },
                {
                    name: 'demo_url',
                    type: 'text',
                    label: 'Demo URL',
                },
                {
                    name: 'image_url',
                    type: 'text',
                    label: 'Image URL',
                },
                {
                    name: 'sort_order',
                    type: 'number',
                    defaultValue: 0,
                },
            ],
        },
        {
            slug: 'skills',
            access: {
                create: () => true,
                read: () => true,
                update: () => true,
                delete: () => true,
            },
            admin: {
                useAsTitle: 'category',
            },
            fields: [
                {
                    name: 'category',
                    type: 'text',
                    required: true,
                },
                {
                    name: 'skills', // This field contains an array of skill objects
                    type: 'array',
                    fields: [
                        {
                            name: 'skill',
                            type: 'text',
                        },
                    ],
                },
                {
                    name: 'sort_order',
                    type: 'number',
                    defaultValue: 0,
                },
            ],
        },
        {
            slug: 'contact-info',
            access: {
                create: () => true,
                read: () => true,
                update: () => true,
                delete: () => true,
            },
            admin: {
                useAsTitle: 'email',
            },
            fields: [
                {
                    name: 'email',
                    type: 'email',
                    required: true,
                },
                {
                    name: 'phone',
                    type: 'text',
                },
                {
                    name: 'location',
                    type: 'text',
                },
                {
                    name: 'github_url',
                    type: 'text',
                    label: 'GitHub URL',
                },
                {
                    name: 'linkedin_url',
                    type: 'text',
                    label: 'LinkedIn URL',
                },
            ],
        },
    ],
    db: postgresAdapter({
        pool: {
            connectionString: `postgresql://postgres.ecjlvseneqrvbxdhlqxc:$Snowball123@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true`,
        },
    }),
    secret: process.env.PAYLOAD_SECRET || 'your-secret-here',
    typescript: {
        outputFile: './payload-types.ts',
    },
});
