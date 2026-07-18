import { buildConfig } from 'payload';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { seoPlugin } from '@payloadcms/plugin-seo';
// Removed webpackBundler import as it's causing module resolution issues

// Supabase URL and key are not directly used in this config, but kept for context if needed elsewhere.
// const supabaseUrl = "https://ecjlvseneqrvbxdhlqxc.supabase.co";
// const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// import CustomLogin from './components/payload/Login';

export default buildConfig({
    admin: {
        user: 'users',
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
                create: ({ req }) => Boolean(req.user),
                read: ({ req }) => Boolean(req.user),
                update: ({ req }) => Boolean(req.user),
                delete: ({ req }) => Boolean(req.user),
            },
            fields: [
                {
                    name: 'name',
                    type: 'text',
                    label: 'Name',
                },
                {
                    name: 'email',
                    type: 'email',
                    label: 'Email',
                    required: true,
                    unique: true,
                },
            ],
        },
        {
            slug: 'hero-content',
            versions: { maxPerDoc: 2 }, // Limit versions to current and previous
            access: {
                read: () => true,
                create: ({ req }) => Boolean(req.user),
                update: ({ req }) => Boolean(req.user),
                delete: ({ req }) => Boolean(req.user),
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
                read: () => true,
                create: ({ req }) => Boolean(req.user),
                update: ({ req }) => Boolean(req.user),
                delete: ({ req }) => Boolean(req.user),
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
            versions: {
                maxPerDoc: 2,
                drafts: true,
            },
            access: {
                read: () => true,
                create: ({ req }) => Boolean(req.user),
                update: ({ req }) => Boolean(req.user),
                delete: ({ req }) => Boolean(req.user),
            },
            admin: {
                useAsTitle: 'title',
                preview: (doc) => `/?preview=true&project=${doc.id}#projects`,
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
                    label: 'Description (one-line summary for cards)',
                    required: true,
                },
                {
                    name: 'problem',
                    type: 'textarea',
                    label: 'Problem — what was broken or missing',
                },
                {
                    name: 'solution',
                    type: 'textarea',
                    label: 'Solution — what you built',
                },
                {
                    name: 'architecture',
                    type: 'textarea',
                    label: 'Architecture — how it fits together',
                },
                {
                    name: 'keyDecisions',
                    type: 'array',
                    label: 'Key Technical Decisions',
                    fields: [
                        { name: 'decision', type: 'textarea', label: 'Decision' },
                    ],
                },
                {
                    name: 'challenges',
                    type: 'array',
                    label: 'Challenges',
                    fields: [
                        { name: 'challenge', type: 'textarea', label: 'Challenge' },
                    ],
                },
                {
                    name: 'businessImpact',
                    type: 'textarea',
                    label: 'Business Impact — measurable outcomes',
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
                read: () => true,
                create: ({ req }) => Boolean(req.user),
                update: ({ req }) => Boolean(req.user),
                delete: ({ req }) => Boolean(req.user),
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
                read: () => true,
                create: ({ req }) => Boolean(req.user),
                update: ({ req }) => Boolean(req.user),
                delete: ({ req }) => Boolean(req.user),
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
                read: () => true,
                create: ({ req }) => Boolean(req.user),
                update: ({ req }) => Boolean(req.user),
                delete: ({ req }) => Boolean(req.user),
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
                // Visitor chat history is written by the server (chatbot route, via
                // the Local API with overrideAccess: true) — never directly by clients.
                read: ({ req }) => Boolean(req.user),
                create: ({ req }) => Boolean(req.user),
                update: ({ req }) => Boolean(req.user),
                delete: ({ req }) => Boolean(req.user),
            },
            admin: {
                useAsTitle: 'message',
            },
            fields: [
                {
                    name: 'visitorSessionId',
                    type: 'text',
                    required: true,
                    label: 'Anonymous Session ID',
                },
                {
                    name: 'user',
                    type: 'relationship',
                    relationTo: 'users',
                    label: 'User (if authenticated)',
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
                    name: 'siteUrl',
                    type: 'text',
                    label: 'Site URL (e.g. https://sudoayush.netlify.app)',
                    defaultValue: 'https://sudoayush.netlify.app',
                },
                {
                    name: 'siteDescription',
                    type: 'textarea',
                    label: 'Site Description (used for SEO + OpenGraph fallback)',
                },
                {
                    name: 'ogImage',
                    type: 'upload',
                    relationTo: 'uploads',
                    label: 'Default OpenGraph / Social Share Image',
                },
                {
                    name: 'favicon',
                    type: 'upload',
                    relationTo: 'uploads',
                    label: 'Favicon',
                },
                {
                    name: 'twitterHandle',
                    type: 'text',
                    label: 'Twitter/X Handle (e.g. @abz4375)',
                },
                {
                    name: 'contactEmail',
                    type: 'email',
                    label: 'Contact Email',
                },
                {
                    name: 'brandName',
                    type: 'text',
                    label: 'Brand Name (shown in nav bar)',
                    defaultValue: 'sudo ayush',
                },
                {
                    name: 'brandIcon',
                    type: 'select',
                    label: 'Brand Icon',
                    options: [
                        { label: 'Terminal', value: 'terminal' },
                        { label: 'Code', value: 'code' },
                        { label: 'Hash', value: 'hash' },
                    ],
                    defaultValue: 'terminal',
                },
                {
                    name: 'personName',
                    type: 'text',
                    label: 'Full Name (JSON-LD Person schema)',
                },
                {
                    name: 'personJobTitle',
                    type: 'text',
                    label: 'Job Title (JSON-LD Person schema)',
                },
                {
                    name: 'personAlmaMater',
                    type: 'text',
                    label: 'Alma Mater (JSON-LD Person schema)',
                },
                {
                    name: 'personWorksFor',
                    type: 'text',
                    label: 'Current Employer (JSON-LD Person schema)',
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
    plugins: [
        seoPlugin({
            collections: ['projects'],
            globals: ['site-settings'],
            uploadsCollection: 'uploads',
            generateTitle: ({ doc }: any) => (doc?.title ? `${doc.title} | Ayush Srivastava` : 'Ayush Srivastava'),
            generateDescription: ({ doc }: any) => doc?.businessImpact || doc?.description || doc?.siteDescription,
        }),
    ],
    db: postgresAdapter({
        pool: {
            connectionString: process.env.DATABASE_URL,
        },
        push: process.env.NODE_ENV !== 'production',
    }),
    secret: process.env.PAYLOAD_SECRET || 'your-secret-here',
    typescript: {
        outputFile: './payload-types.ts',
    },
});
