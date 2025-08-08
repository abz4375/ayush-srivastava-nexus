import { buildConfig } from 'payload';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
// Removed webpackBundler import as it's causing module resolution issues

// Supabase URL and key are not directly used in this config, but kept for context if needed elsewhere.
// const supabaseUrl = "https://ecjlvseneqrvbxdhlqxc.supabase.co";
// const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// import CustomLogin from './components/payload/Login';

export default buildConfig({
    admin: {
        user: 'users',
        // Removed bundler configuration as it's causing module resolution issues
        // components: {
        //     views: {
        //         Login: {
        //           Component: CustomLogin,
        //         }
        //     },
        // },
        importMap: {
            baseDir: process.cwd(),
        },
    },
    editor: lexicalEditor({}),
    collections: [
        {
            slug: 'users',
            auth: true,
            versions: { maxPerDoc: 2 }, // Limit versions to current and previous
            admin: {
                useAsTitle: 'name', // Correct placement for useAsTitle
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
                    label: 'Name', // Added label
                    admin: {
                        // useAsTitle: true, // Moved to collection admin config
                    },
                },
                {
                    name: 'email',
                    type: 'email',
                    label: 'Email', // Added label
                    required: true,
                    unique: true,
                    admin: {
                        // readOnly: true, // Removed readOnly to allow email editing
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
            versions: { maxPerDoc: 2 }, // Limit versions to current and previous
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
                // Removed explicit 'id' field as PayloadCMS handles it automatically
                {
                    name: 'name',
                    type: 'text',
                    label: 'Name', // Added label
                    required: true,
                },
                {
                    name: 'title',
                    type: 'text',
                    label: 'Title', // Added label
                    required: true,
                },
                {
                    name: 'subtitle',
                    type: 'textarea',
                    label: 'Subtitle', // Added label
                },
                {
                    name: 'description',
                    type: 'textarea',
                    label: 'Description', // Added label
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
            versions: { maxPerDoc: 2 }, // Limit versions to current and previous
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
                    name: 'position',
                    type: 'text',
                    label: 'Position', // Added label
                    required: true,
                },
                {
                    name: 'company',
                    type: 'text',
                    label: 'Company', // Added label
                    required: true,
                },
                {
                    name: 'duration', // Added duration field
                    type: 'text',
                    label: 'Duration',
                },
                {
                    name: 'achievements', // Changed to achievements (array of objects) for multiple achievements
                    type: 'array',
                    label: 'Achievements', // Added label
                    fields: [
                        {
                            name: 'achievement',
                            type: 'textarea',
                            label: 'Achievement', // Added label
                        },
                    ],
                },
                {
                    name: 'technologies',
                    type: 'array',
                    label: 'Technologies', // Added label
                    fields: [
                        {
                            name: 'technology',
                            type: 'text',
                            label: 'Technology', // Added label
                        },
                    ],
                },
                {
                    name: 'sort_order',
                    type: 'number',
                    label: 'Sort Order', // Added label
                    defaultValue: 0,
                },
            ],
        },
        {
            slug: 'projects',
            versions: { maxPerDoc: 2 }, // Limit versions to current and previous
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
                    label: 'Title', // Added label
                    required: true,
                },
                {
                    name: 'description',
                    type: 'textarea',
                    label: 'Description', // Added label
                    required: true,
                },
                {
                    name: 'duration',
                    type: 'text',
                    label: 'Duration', // Added label
                },
                {
                    name: 'technologies',
                    type: 'array',
                    label: 'Technologies', // Added label
                    fields: [
                        {
                            name: 'technology',
                            type: 'text',
                            label: 'Technology', // Added label
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
                    label: 'Sort Order', // Added label
                    defaultValue: 0,
                },
            ],
        },
        {
            slug: 'skills',
            versions: { maxPerDoc: 2 }, // Limit versions to current and previous
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
                    label: 'Category', // Added label
                    required: true,
                },
                {
                    name: 'skills', // This field contains an array of skill objects
                    type: 'array',
                    label: 'Skills List', // Added label for the array field
                    admin: {
                        description: 'Add individual skills to this category.', // Added description
                    },
                    fields: [
                        {
                            name: 'skill',
                            type: 'text',
                            label: 'Skill Name', // Added label for the nested skill field
                        },
                    ],
                },
                {
                    name: 'sort_order',
                    type: 'number',
                    label: 'Sort Order', // Added label
                    defaultValue: 0,
                },
            ],
        },
        {
            slug: 'contact-info',
            versions: { maxPerDoc: 2 }, // Limit versions to current and previous
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
                    label: 'Email', // Added label
                    required: true,
                },
                {
                    name: 'phone',
                    type: 'text',
                    label: 'Phone', // Added label
                },
                {
                    name: 'location',
                    type: 'text',
                    label: 'Location', // Added label
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
        {
            slug: 'uploads', // New collection for media uploads
            upload: true,
            access: {
                create: () => true,
                read: () => true,
                update: () => true,
                delete: () => true,
            },
            fields: [
                {
                    name: 'alt',
                    type: 'text',
                    label: 'Alt Text',
                    required: true,
                },
            ],
        },
        {
            slug: 'chat-messages',
            versions: { maxPerDoc: 2 },
            access: {
                create: () => true,
                read: () => true,
                update: () => true,
                delete: () => true,
            },
            admin: {
                useAsTitle: 'message',
            },
            fields: [
                {
                    name: 'user',
                    type: 'relationship',
                    relationTo: 'users',
                    required: true,
                    label: 'User ID',
                },
                {
                    name: 'message',
                    type: 'textarea',
                    required: true,
                    label: 'Message',
                },
                {
                    name: 'sender',
                    type: 'select',
                    options: [
                        { label: 'User', value: 'user' },
                        { label: 'Bot', value: 'bot' },
                    ],
                    required: true,
                    label: 'Sender',
                },
                {
                    name: 'timestamp',
                    type: 'date',
                    required: true,
                    defaultValue: () => new Date(),
                    label: 'Timestamp',
                },
            ],
        },
    ],
    globals: [ // New globals configuration
        {
            slug: 'site-settings',
            label: 'Site Settings',
            fields: [
                {
                    name: 'siteTitle',
                    type: 'text',
                    label: 'Site Title',
                    required: true,
                },
                {
                    name: 'contactEmail',
                    type: 'email',
                    label: 'Contact Email',
                },
                {
                    name: 'socialLinks',
                    type: 'array',
                    label: 'Social Media Links',
                    fields: [
                        {
                            name: 'platform',
                            type: 'text',
                            label: 'Platform (e.g., Twitter, Instagram)',
                            required: true,
                        },
                        {
                            name: 'url',
                            type: 'text',
                            label: 'URL',
                            required: true,
                        },
                    ],
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
