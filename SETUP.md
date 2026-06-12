# Allied Health Sites — Setup Guide

Astro + Sanity + Cloudflare Pages template for allied health practices.  
Each client gets their own Sanity project, GitHub repo, and CF Pages project.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Astro 6 (SSG via prerender) |
| CMS | Sanity (GROQ queries at build time) |
| Styling | Tailwind CSS v4 + Typography plugin |
| Hosting | Cloudflare Pages |
| CI/CD | GitHub Actions |
| Publish → Deploy | Sanity webhook → CF Worker → GitHub `workflow_dispatch` |

---

## Prerequisites

- `bun` installed locally
- `gh` CLI authenticated with your GitHub account (`gh auth login`)
- `wrangler` available via `bunx wrangler`
- A Cloudflare account (HumanLoop or client's own)

---

## New Client Setup

### 1. Create a Sanity project

Go to [sanity.io/manage](https://sanity.io/manage) → New Project.  
Note the **Project ID**.

Create a token: Settings → API → Tokens → Add API Token → Editor role.  
Note the **token**.

### 2. Create a GitHub repo from this template

On GitHub: use this repo as a template → create `webmuppet/{client-slug}`.  
Clone it locally.

### 3. Create a CF Pages project

In the CF dashboard → Workers & Pages → Create → Pages → Direct Upload.  
Name it something like `{client-slug}-site`.  
(You can also let the setup script's first deploy create it automatically.)

### 4. Create a CF API token

[dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens) → Create Token → Custom token.  
Permissions: **Cloudflare Pages: Edit** + **Workers Scripts: Edit**, Account scope.  
Note the **token**.

### 5. Create a GitHub token

[github.com/settings/tokens](https://github.com/settings/tokens) → New classic token.  
Scopes: `repo`, `workflow`.  
Note the **token**.

### 6. Run the setup script

```bash
SANITY_TOKEN=sk...         \
GH_TOKEN=ghp...            \
CF_API_TOKEN=cfut...       \
node scripts/setup.mjs     \
  --client-slug    acme-chiro          \
  --sanity-project lo60cika            \
  --sanity-dataset production          \
  --cf-account     69ba917b...         \
  --cf-pages-name  acme-chiro-site     \
  --github-repo    webmuppet/acme-chiro
```

The script:
- Adds all required GitHub Actions secrets
- Deploys the Sanity→GitHub relay Worker to CF
- Wires the Worker secrets
- Creates and configures the Sanity webhook

### 7. Set up Sanity Studio

Add `.env` locally:
```
PUBLIC_SANITY_PROJECT_ID=your_project_id
PUBLIC_SANITY_DATASET=production
SANITY_TOKEN=your_token
```

Deploy the studio:
```bash
SANITY_PROJECT_ID=your_project_id bunx sanity deploy --yes --url {client-slug}
```

### 8. Customise branding

Edit `src/styles/global.css` — change the CSS variables under `@theme`:
```css
--color-brand:        #7ba7a0;   /* primary accent */
--color-brand-dark:   #4d7c75;   /* hover states */
--color-brand-deeper: #2e5450;   /* headings, hero bg */
```

Change fonts by updating the Google Fonts import in `src/layouts/Layout.astro`.

### 9. Add client content

Log in to `{project-id}.sanity.studio` and add:
- **Site Settings** — practice name, phone, address, booking URL
- **Team Members** — one per practitioner, with headshot image paths
- **Blog Posts** — initial content

Images go in `public/images/` — reference them in Sanity as `/images/filename.jpg`.

### 10. First deploy

```bash
git add -A && git commit -m "Initial client setup" && git push origin main
```

GitHub Actions builds and deploys automatically. Subsequent deploys happen whenever content is published in Sanity.

---

## Day-to-day workflow

| Action | Result |
|---|---|
| Publish content in Sanity Studio | Webhook → Worker → GitHub Actions → CF Pages (~60s) |
| Push code to `main` | GitHub Actions → CF Pages automatically |
| Deploy Sanity Studio schema changes | `SANITY_PROJECT_ID=... bunx sanity deploy` |

---

## Content types

| Type | Fields |
|---|---|
| `teamMember` | displayName, slug, title, headshot, bio, outsideOffice, order |
| `post` | title, slug, date, excerpt, body (Markdown) |
| `siteSettings` | practiceName, phone, phoneHref, email, address, suburb, postcode, facebook, googleMaps, bookingUrl, tagline |

---

## Adding pages

Static pages (Services, About, Contact, etc.) go in `src/pages/`.  
Follow the same pattern: `export const prerender = true` at the top.

For content-driven pages, query Sanity using `sanityClient.fetch()` from `src/lib/sanity.ts`.

---

## Secrets reference

| Secret | Where used | What it is |
|---|---|---|
| `CLOUDFLARE_API_TOKEN` | GitHub Actions | CF API token with Pages:Edit |
| `CLOUDFLARE_ACCOUNT_ID` | GitHub Actions | CF account ID |
| `CF_PAGES_PROJECT_NAME` | GitHub Actions | CF Pages project name |
| `PUBLIC_SANITY_PROJECT_ID` | GitHub Actions, local `.env` | Sanity project ID |
| `PUBLIC_SANITY_DATASET` | GitHub Actions, local `.env` | Usually `production` |
| `SANITY_TOKEN` | GitHub Actions (studio deploy) | Sanity API token with deploy rights |
| `GH_TOKEN` | CF Worker (relay) | GitHub token with `workflow` scope |
| `GH_REPO` | CF Worker (relay) | e.g. `webmuppet/client-repo` |
