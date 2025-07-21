import { buildConfig } from 'payload/config'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { viteBundler } from '@payloadcms/bundler-vite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

const supabaseUrl = "https://ecjlvseneqrvbxdhlqxc.supabase.co"
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

export default buildConfig({
  admin: {
    bundler: viteBundler(),
    user: 'users',
  },
  editor: lexicalEditor({}),
  collections: [
    {
      slug: 'users',
      auth: true,
      access: {
        delete: () => false,
        update: () => false,
      },
      fields: [
        {
          name: 'name',
          type: 'text',
        }
      ]
    },
    {
      slug: 'hero-content',
      admin: {
        useAsTitle: 'name',
      },
      access: {
        read: () => true,
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
        }
      ]
    },
    {
      slug: 'experiences',
      admin: {
        useAsTitle: 'position',
        defaultSort: 'sort_order',
      },
      access: {
        read: () => true,
      },
      fields: [
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
          name: 'duration',
          type: 'text',
          required: true,
        },
        {
          name: 'description',
          type: 'array',
          fields: [
            {
              name: 'achievement',
              type: 'textarea',
            }
          ]
        },
        {
          name: 'technologies',
          type: 'array',
          fields: [
            {
              name: 'technology',
              type: 'text',
            }
          ]
        },
        {
          name: 'sort_order',
          type: 'number',
          defaultValue: 0,
        }
      ]
    },
    {
      slug: 'projects',
      admin: {
        useAsTitle: 'title',
        defaultSort: 'sort_order',
      },
      access: {
        read: () => true,
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
            }
          ]
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
        }
      ]
    },
    {
      slug: 'skills',
      admin: {
        useAsTitle: 'category',
        defaultSort: 'sort_order',
      },
      access: {
        read: () => true,
      },
      fields: [
        {
          name: 'category',
          type: 'text',
          required: true,
        },
        {
          name: 'skills',
          type: 'array',
          fields: [
            {
              name: 'skill',
              type: 'text',
            }
          ]
        },
        {
          name: 'sort_order',
          type: 'number',
          defaultValue: 0,
        }
      ]
    },
    {
      slug: 'contact-info',
      admin: {
        useAsTitle: 'email',
      },
      access: {
        read: () => true,
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
        }
      ]
    }
  ],
  db: postgresAdapter({
    pool: {
      connectionString: `postgresql://postgres:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjamx2c2VuZXFydmJ4ZGhscXhjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA3OTM2NCwiZXhwIjoyMDY4NjU1MzY0fQ.cJIz6xTVWWuCiNOtPX-uNf4vv1Q0Hf-WLOj0QSRwUhY@aws-0-us-west-1.pooler.supabase.com:6543/postgres`
    }
  }),
  secret: process.env.PAYLOAD_SECRET || 'your-secret-here',
  typescript: {
    outputFile: './src/payload-types.ts'
  },
  admin: {
    autoLogin: {
      email: 'admin@example.com',
      password: 'password',
      prefillOnly: true,
    },
  },
})