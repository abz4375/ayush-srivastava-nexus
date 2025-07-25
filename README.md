# Ayush Srivastava - Personal Portfolio 🚀

This repository hosts the personal portfolio website of Ayush Srivastava, showcasing his projects, experience, skills, and contact information.

## Technologies Used 💻

- Next.js
- React
- TypeScript
- Tailwind CSS
- Payload CMS (for content management)
- Supabase (for database and authentication)

## Features ✨

- **Hero Section**: Introduction to Ayush Srivastava.
- **About Section**: Detailed information about Ayush.
- **Skills Section**: Overview of technical skills.
- **Experience Section**: Professional experience and roles.
- **Projects Section**: Showcase of personal and professional projects.
- **Contact Section**: Form for inquiries and contact details.
- **Responsive Design**: Optimized for various devices.
- **CMS Integration**: Easily manage content via Payload CMS.

## Getting Started 🚀

To run this project locally, follow these steps:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/abz4375/ayush-srivastava-nexus.git
   cd ayush-srivastava-nexus
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or yarn install
   # or pnpm install
   # or bun install
   ```

3. **Set up environment variables:**
   Create a `.env.local` file in the root directory and add the following:

   ```
   NEXT_PUBLIC_SERVER_URL=http://localhost:3000
   PAYLOAD_SECRET=YOUR_PAYLOAD_SECRET_HERE
   NEXT_REVALIDATION_TAGS=YOUR_REVALIDATION_TAGS_HERE
   SUPABASE_URL=YOUR_SUPABASE_URL_HERE
   SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY_HERE
   ```
   Replace the placeholder values with your actual secrets and keys.

4. **Run the development server:**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

## Payload CMS 📝

This project uses Payload CMS for content management. To access the admin panel:

1. Ensure the development server is running (`npm run dev`).
2. Navigate to [http://localhost:3000/admin](http://localhost:3000/admin).
3. Create an admin user if you haven't already.

## Project Structure 📂

```
.
├── app/                  # Next.js application pages and API routes
├── components/           # Reusable React components
├── hooks/                # Custom React hooks
├── integrations/         # Integrations with external services (e.g., Supabase)
├── lib/                  # Utility functions
├── public/               # Static assets
├── src/                  # Payload CMS configuration and migrations
├── supabase/             # Supabase specific files
├── payload.config.ts     # Payload CMS configuration
├── next.config.ts        # Next.js configuration
├── tailwind.config.js    # Tailwind CSS configuration
└── tsconfig.json         # TypeScript configuration
```

## Contact 📧

For any inquiries, please reach out via the contact form on the website or connect with Ayush Srivastava through the provided social links.

---

© 2025 Ayush Srivastava. All Rights Reserved.
