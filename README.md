# Holo Marketplace

A product catalog and discovery site for the Holo/Holochain ecosystem and partners. Browse decentralized hosting, developer tools, community currencies, AI infrastructure, and VPS hosting from Holo, Holochain Foundation, Unyt, Coasys, and Mycelium.

**Live site:** [marketplace.holohost.workers.dev](https://marketplace.holohost.workers.dev)

## Tech Stack

- **Astro 6** — Static-first framework with islands architecture
- **React 19** — Interactive product catalog as a client-side island
- **Tailwind CSS v4** — Utility-first styling via the Vite plugin
- **GitHub Pages** — Auto-deployed on push to `main`

## Project Structure

```
marketplace/
├── public/                     # Static assets (logos, favicon, OG image)
├── src/
│   ├── components/
│   │   └── ProductCatalog.jsx  # Main interactive catalog (React island)
│   ├── content/
│   │   ├── products/           # Product listings (YAML, one per product)
│   │   └── providers/          # Provider profiles (YAML, one per provider)
│   ├── layouts/
│   │   └── Base.astro          # HTML shell with SEO/OG meta tags
│   ├── pages/
│   │   └── index.astro         # Queries content collections, renders catalog
│   ├── styles/
│   │   └── global.css          # Tailwind import + theme config
│   └── content.config.ts       # Zod schemas for products & providers
├── astro.config.mjs
└── package.json
```

## Getting Started

```bash
npm install
npm run dev         # → http://localhost:4321
```

## Adding or Editing Products

Products are YAML files in `src/content/products/`. Create a new file or edit an existing one — the Zod schema in `content.config.ts` validates every field at build time.

Example product file (`src/content/products/holo-edge-hosting.yaml`):

```yaml
name: Edge Hosting
provider: holo
description: >-
  Run a HoloPort to host Holochain apps at the edge.
longDescription: >-
  Extended description shown when the product card is expanded.
tags:
  - hosting
  - depin
  - earn
category: hosting
status: available
pricing:
  type: earn
  label: "Free / Get Paid"
action:
  type: download
  label: Download ISO
  url: https://holo.host/download
featured: true
sortOrder: 1
```

**Field reference:**

| Field | Required | Values |
|-------|----------|--------|
| `name` | Yes | Display name |
| `provider` | Yes | `holo`, `holochain`, `unyt`, `coasys`, `mycelium` |
| `description` | Yes | Short (1-2 sentences) |
| `longDescription` | No | Extended text for expanded view |
| `tags` | Yes | Array of strings |
| `category` | Yes | `hosting`, `social`, `developer_tools`, `currency`, `networking`, `ai`, `infrastructure` |
| `status` | No | `available` (default), `beta`, `coming_soon` |
| `pricing.type` | Yes | `free`, `freemium`, `earn`, `paid`, `contact` |
| `pricing.label` | Yes | Display text (e.g. "Free / Get Paid") |
| `pricing.amount` | No | Number (USD) |
| `pricing.note` | No | Extra context (e.g. "Credited back in HOT") |
| `action.type` | Yes | `unyt_app`, `external_link`, `download`, `contact_form` |
| `action.label` | Yes | Button text |
| `action.url` | No | Direct URL for downloads/links |
| `featured` | No | `true` to pin to top of "Featured" sort |
| `sortOrder` | No | Number for ordering (lower = first) |

## Adding or Editing Providers

Provider profiles are YAML files in `src/content/providers/`. These power the expandable provider sections in the sidebar filter.

Example (`src/content/providers/holo.yaml`):

```yaml
name: Holo
color: "#22d3ee"
description: >-
  Holo provides distributed hosting infrastructure for Holochain
  applications, making peer-to-peer apps accessible through standard
  web browsers.
logo: holo-mark.svg
website: https://holo.host
contact: https://holo.host/contact
sortOrder: 1
```

Logo files are referenced by filename and must be placed in `public/`.

## Catalog Features

- **Search** — Fuzzy client-side search across name, description, provider, and tags. Press `/` to focus.
- **Filter** — By pricing (Free, Get Paid, Paid), provider, and category. Filters are OR within a group, AND across groups.
- **Sort** — Featured, Name, Price (low/high), Provider.
- **View modes** — List and grid, toggle in the toolbar.
- **Expandable cards** — Click any product to expand an inline detail panel with the long description.
- **Provider profiles** — Click a provider name in the sidebar to see their description, logo, website, and contact link.
- **Responsive** — Optimized for desktop, tablet, and mobile.

## Mycelium Integration (Pending)

Mycelium VPS products are currently simulated with placeholder data in the React component (`getMyceliumProducts()`). When the Mycelium API is available, replace this function with a real `fetch()` call. The adapter pattern is already in place — dynamic products are merged with static content collection products at runtime.

## Unyt Integration (Pending)

Products with `action.type: "unyt_app"` will trigger the Unyt desktop application via a custom protocol handler (`unyt://`). The protocol scheme, payload format, and fallback behavior are being defined by the Unyt integration engineer. Currently, action buttons are wired up but non-functional.

## Deployment

The site auto-deploys to GitHub Pages on push to `main` via `.github/workflows/deploy.yml`. The Astro build outputs static HTML to `dist/`, served under the `/marketplace` base path.

To build locally:

```bash
npm run build       # Output in dist/
npm run preview     # Preview the build at localhost:4321
```

## Commands

| Command | Action |
|---------|--------|
| `npm install` | Install dependencies |
| `npm run dev` | Dev server at `localhost:4321` |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build locally |
