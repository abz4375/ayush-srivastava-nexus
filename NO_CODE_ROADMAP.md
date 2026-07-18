# NO_CODE_ROADMAP.md

Plan to take this portfolio from "mostly CMS-driven" to **fully no-code**: every piece of text, metadata, and configuration a non-developer would want to change lives in Payload's `/admin`, and touching code is only ever needed for new sections or visual redesigns — never for routine updates (new project, new job, updated resume link, changed site name, etc.).

Builds directly on `REVAMP.md`. Read that first if you haven't — this doc assumes the Server Component conversion, extended `projects` schema, and access-control fixes described there are already in place (they are, as of this session).

---

## 0. Where the app still isn't no-code today

A quick audit of what's hardcoded in components right now, since this is the actual gap list this roadmap closes:

| Hardcoded value | File | Why it matters |
|---|---|---|
| Full SEO/OpenGraph block — title, description, canonical URL, OG image, JSON-LD person schema | `app/(frontend)/layout.tsx` | Every SOP-required SEO field is currently JSX, with leftover `// Replace with your actual domain` comments — the exact opposite of no-code |
| Site name "sudo ayush" + terminal icon | `components/Navigation.tsx` | Rebranding the site means editing a component, not a CMS field |
| Fallback email/location text ("IIIT Jabalpur, India", the gmail address) | `components/Hero.tsx`, `components/Contact.tsx` | These only show if the CMS field is empty, but the *pattern* of falling back to hardcoded values means the "no-code" promise breaks the moment a field is left blank |
| Skill category → icon mapping (`iconMap`) | `components/Skills.tsx` | Adding a new skill category with a different icon requires a code change |
| Favicon, resume link literal fallback | `app/(frontend)/layout.tsx`, `Contact.tsx` | Same "hardcoded fallback" pattern |

None of this is broken — it all works today. The point of this roadmap is to move the *source of truth* for each of these into Payload, so the person running the site never opens an editor for a routine content change.

---

## 1. SEO — the single highest-leverage addition

### 1.1 Install `@payloadcms/plugin-seo`

```bash
pnpm add @payloadcms/plugin-seo
```

Wire it in `payload.config.ts`:

```ts
import { seoPlugin } from '@payloadcms/plugin-seo'

export default buildConfig({
  // ...
  plugins: [
    seoPlugin({
      collections: ['projects'], // per-project OG image/description for social shares
      globals: ['site-settings'], // site-wide title/description/OG defaults
      uploadsCollection: 'uploads',
      generateTitle: ({ doc }) => doc?.title ? `${doc.title} | Ayush Srivastava` : 'Ayush Srivastava',
      generateDescription: ({ doc }) => doc?.businessImpact || doc?.description,
      generateURL: ({ doc }) => `https://sudoayush.netlify.app/#projects`,
    }),
  ],
})
```

This adds a `meta: { title, description, image }` group to `projects` and to the `site-settings` global — editable in `/admin`, with Payload's built-in "auto-generate" button and a live Google-style search-result preview.

### 1.2 Extend `site-settings` global for everything currently hardcoded in `layout.tsx`

```ts
{
  slug: 'site-settings',
  fields: [
    { name: 'siteTitle', type: 'text', required: true },
    { name: 'siteUrl', type: 'text', required: true }, // replaces every hardcoded sudoayush.netlify.app
    { name: 'siteDescription', type: 'textarea' },
    { name: 'ogImage', type: 'upload', relationTo: 'uploads' },
    { name: 'twitterHandle', type: 'text' },
    { name: 'favicon', type: 'upload', relationTo: 'uploads' },
    // Person/JSON-LD schema fields
    { name: 'personName', type: 'text' },
    { name: 'personJobTitle', type: 'text' },
    { name: 'personAlmaMater', type: 'text' },
    { name: 'personWorksFor', type: 'text' },
  ],
}
```

### 1.3 Rewrite `app/(frontend)/layout.tsx` to consume the global instead of JSX literals

```tsx
export async function generateMetadata(): Promise<Metadata> {
  const { siteSettings } = await getPortfolioData();
  return {
    title: { default: siteSettings.siteTitle, template: `%s | ${siteSettings.siteTitle}` },
    description: siteSettings.siteDescription,
    openGraph: {
      title: siteSettings.siteTitle,
      description: siteSettings.siteDescription,
      url: siteSettings.siteUrl,
      images: siteSettings.ogImage ? [{ url: siteSettings.ogImage.url }] : [],
    },
    // ...
  };
}
```

Next.js's `generateMetadata` export replaces the static `export const metadata` object, letting it be `async` and CMS-backed. JSON-LD (`<script type="application/ld+json">`) reads from the same `siteSettings` fields.

**Result:** rebrand the entire site — name, URL, description, social image, favicon, "who am I" schema — from one global in `/admin`, zero code touched.

---

## 2. Draft Preview + Live Preview on Projects

Directly serves the case-study fields already added to `projects` (`problem`/`solution`/`architecture`/`keyDecisions`/`challenges`/`businessImpact`) — right now editing one of those fields and wanting to see how it reads on the live card means saving, then tabbing to the site, then scrolling to Projects. This closes that loop.

### 2.1 Enable drafts on `projects`

```ts
{
  slug: 'projects',
  versions: {
    drafts: true, // was: { maxPerDoc: 2 } — add drafts: true alongside
    maxPerDoc: 2,
  },
  // ...
}
```

### 2.2 Add `admin.preview` so editors get a direct "Preview" button

```ts
admin: {
  preview: (doc) => `/?preview=true&project=${doc.id}#projects`,
},
```

### 2.3 (Stretch) Live Preview — see the actual card update as you type

Requires:
- `admin.livePreview.url` pointing at the frontend
- A small client-side listener (`useLivePreview` from `@payloadcms/live-preview-react`) in `Projects.tsx` that subscribes to postMessage updates from the admin iframe

This is more setup than Draft Preview and is genuinely optional — Draft Preview alone (2.1–2.2) already gets 90% of the editing-experience benefit for much less work. Only build Live Preview if the user finds themselves round-tripping save→check constantly.

---

## 3. Site branding as CMS fields

Closes the `Navigation.tsx` hardcode.

```ts
// add to site-settings global
{ name: 'brandName', type: 'text', defaultValue: 'sudo ayush' },
{ name: 'brandIcon', type: 'select', options: ['terminal', 'code', 'hash'], defaultValue: 'terminal' },
```

`Navigation.tsx` becomes a Server Component wrapper (or receives `brandName`/`brandIcon` as props from `page.tsx`, same pattern already used for `Hero`/`Projects`/etc.), with a small icon-name → component lookup instead of a single hardcoded import. Renaming the site or swapping the logo glyph becomes a CMS edit.

---

## 4. Skills category icons, made data-driven

Closes the `iconMap` hardcode in `Skills.tsx`.

```ts
// skills collection — add an icon field
{
  name: 'icon',
  type: 'select',
  options: ['code', 'database', 'globe', 'wrench', 'trophy', 'users', 'brain', 'cloud'],
  defaultValue: 'code',
},
```

`Skills.tsx`'s `iconMap` keys off `category.icon` (the new CMS field) instead of the free-text `category.category` string — today, renaming a category label silently breaks its icon lookup (falls back to the default `Code` icon) since the map keys are exact-string category names. This also *fixes a latent bug*, not just adds a feature.

---

## 5. Remove the hardcoded-fallback pattern

Every place a component does `dbContactInfo?.email || "abz4375.ayushsrivastava@gmail.com"` is a place where "no CMS field set" silently falls back to baked-in personal data rather than surfacing that the field needs filling in. Two options, pick one:

- **Minimal-risk:** keep the fallbacks (they're a reasonable safety net against a totally empty CMS on first deploy) but make every field in `hero-content` and `contact-info` `required: true` in `payload.config.ts`, so Payload's own validation forces the field to be filled in `/admin` — the fallback becomes truly unreachable in practice.
- **Fuller no-code:** delete the hardcoded fallback strings entirely and instead seed the database with real values via `src/seed/seed.ts` on first setup, so "no CMS content" is never a state the live site can be in.

Recommend the first option — it's a one-line change per field and doesn't touch component logic.

---

## 6. Nice-to-have, lower priority

These aren't required for "no-code" but round out the CMS's power once the above lands:

- **Form Builder plugin** (`@payloadcms/plugin-form-builder`) — if the Contact section ever grows a real "send a message" form (not just `mailto:` links), this lets the form fields themselves be edited in `/admin` without touching `Contact.tsx`.
- **Redirects plugin** (`@payloadcms/plugin-redirects`) — only relevant once project URLs/slugs are user-editable and might change after publishing.
- **Import/Export plugin** — bulk-editing many projects/skills via CSV instead of one-by-one in the UI; useful if the content volume grows significantly.

Skip the Search plugin (overkill for ~4–8 projects, per earlier discussion) and Multi-Tenant (single-owner site, not applicable).

---

## Roadmap — sequencing

Ordered by leverage-per-hour, each step independently shippable:

| # | Task | Effort | Unlocks |
|---|---|---|---|
| 1 | Install & wire `@payloadcms/plugin-seo` on `projects` + `site-settings` (Section 1.1) | Small | Per-project SEO editable in `/admin`, closes the biggest SOP gap |
| 2 | Extend `site-settings` with the branding/OG/JSON-LD fields (Section 1.2) | Small | All the fields the next step needs |
| 3 | Rewrite `layout.tsx`'s metadata block to read from `site-settings` via `generateMetadata` (Section 1.3) | Medium | Full SEO/OG/JSON-LD becomes no-code |
| 4 | Enable `versions.drafts: true` + `admin.preview` on `projects` (Section 2.1–2.2) | Small | Draft-then-publish workflow for case studies |
| 5 | Add `required: true` to hero-content/contact-info fields (Section 5) | Small | Removes the silent-fallback footgun |
| 6 | Add `icon` select field to `skills`, update `Skills.tsx` lookup (Section 4) | Small | Fixes the category-rename bug + makes icons CMS-driven |
| 7 | Move brand name/icon into `site-settings`, update `Navigation.tsx` (Section 3) | Medium | Rebranding becomes a CMS edit |
| 8 | (Optional) Live Preview wiring (Section 2.3) | Large | Real-time WYSIWYG editing — only if step 4 isn't enough |

Steps 1–3 are the highest-value single push (they directly close the SOP's SEO requirement and the most visible "hardcoded" gap). Steps 4–7 are all small, independent, and can land in any order after that. Step 8 is speculative — build it only if actually needed, not preemptively.

Every step above follows the same shape already established in this codebase: extend `payload.config.ts`, regenerate `payload-types.ts`, thread the new field through `getPortfolioData()`, pass it as a prop into the relevant Server/Client component pair. No new architectural pattern is introduced — this is applying the existing CMS-first pattern (already proven for Hero/Experience/Projects/Skills/Contact) to the handful of places it hasn't reached yet.
