# Portfolio

My personal portfolio site — Next.js on the frontend, backed by Payload CMS so the content (experience, projects, skills) is editable through an admin panel instead of being hardcoded into components.

## Why

Most portfolio sites are static — updating them means editing and redeploying code. This one runs on Payload CMS with Supabase as the underlying Postgres database, so sections like Experience and Projects are content models I can update from an admin UI without touching the frontend.

## Features

- Content-managed sections (Hero, Skills, Experience, Projects, Contact) via Payload CMS collections
- Supabase/Postgres as the CMS database
- An integrated chatbot that can answer questions about my background
- Responsive layout, built with Tailwind CSS

## Tech Stack

Next.js, TypeScript, Tailwind CSS, Payload CMS, Supabase

## Local Setup

```bash
git clone https://github.com/abz4375/ayush-srivastava-nexus.git
cd ayush-srivastava-nexus
npm install
```

Copy `.env.example` to `.env.local` and fill in your own Payload secret and Supabase credentials:

```
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
PAYLOAD_SECRET=your_payload_secret
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

```bash
npm run dev
```

Open `http://localhost:3000`. The Payload admin panel is at `http://localhost:3000/admin` — you'll be prompted to create an admin user on first run.

## Project Structure

```
app/          # Next.js pages and API routes
components/   # React components
hooks/        # Custom hooks
lib/          # Utilities
payload.config.ts  # Payload CMS collections and config
supabase/     # Supabase-specific config
```

## Future Improvements

- Finish moving the remaining hardcoded sections onto Payload collections
- Deploy publicly and link it from the profile README
