<wizard-report>
# PostHog post-wizard report

The wizard has completed a full PostHog analytics integration for the Holo Marketplace. Here's a summary of every change made:

**`src/components/posthog.astro`** — Migrated from a hardcoded API token to environment variables. The script now uses Astro's `define:vars` directive to inject `PUBLIC_POSTHOG_PROJECT_TOKEN` and `PUBLIC_POSTHOG_HOST` from `.env` at build time, so no secrets are embedded in source code.

**`.env`** — Created with `PUBLIC_POSTHOG_PROJECT_TOKEN` and `PUBLIC_POSTHOG_HOST`. The file is covered by `.gitignore`.

**`src/pages/index.astro`** — Added an inline script that tracks three landing page events: primary CTA button clicks (`marketplace_cta_clicked`), the "Read the Manifesto" secondary CTA (`manifesto_cta_clicked`), and "Explore →" clicks on product category cards (`product_category_explored`).

**`src/pages/choose-decent.astro`** — Same three events tracked on the Choose Decent page, with a `page: 'choose-decent'` property to distinguish the source.

The existing `src/utils/analytics.js` and `src/components/ProductCatalog.jsx` already had solid event coverage for the product catalog and were left unchanged.

## Events

| Event | Description | File |
|---|---|---|
| `marketplace_cta_clicked` | User clicks the primary "Browse/Enter the Marketplace" CTA | `src/pages/index.astro`, `src/pages/choose-decent.astro` |
| `manifesto_cta_clicked` | User clicks the "Read the Manifesto" secondary CTA | `src/pages/index.astro`, `src/pages/choose-decent.astro` |
| `product_category_explored` | User clicks an "Explore →" link on a product category card | `src/pages/index.astro`, `src/pages/choose-decent.astro` |
| `product_viewed` | User expands a product card to see details | `src/components/ProductCatalog.jsx` (via `src/utils/analytics.js`) |
| `product_action_clicked` | User clicks a product's action button (Download, Provision, etc.) | `src/components/ProductCatalog.jsx` (via `src/utils/analytics.js`) |
| `product_searched` | User searches the product catalog (debounced, fires after 800ms) | `src/components/ProductCatalog.jsx` (via `src/utils/analytics.js`) |
| `filter_applied` | User applies a provider, category, or pricing filter | `src/components/ProductCatalog.jsx` (via `src/utils/analytics.js`) |
| `sort_changed` | User changes the sort order in the catalog | `src/components/ProductCatalog.jsx` (via `src/utils/analytics.js`) |
| `view_mode_changed` | User toggles between grid and list view | `src/components/ProductCatalog.jsx` (via `src/utils/analytics.js`) |
| `external_link_clicked` | User clicks a provider website or contact link | `src/components/ProductCatalog.jsx` (via `src/utils/analytics.js`) |

## Next steps

We've built a pinned dashboard and five insights to keep an eye on user behavior:

**Dashboard**
- [Analytics basics](https://us.posthog.com/project/348098/dashboard/1375706)

**Insights**
- [Landing Page CTA Conversion Funnel](https://us.posthog.com/project/348098/insights/MT89NmXO) — pageview → marketplace CTA click funnel
- [Landing Page Engagement Trends](https://us.posthog.com/project/348098/insights/sTlY97EA) — daily trend of all three landing page events
- [Product Catalog Discovery Funnel](https://us.posthog.com/project/348098/insights/DNB0Mycr) — search → product view → action click conversion
- [Product Catalog Engagement Trends](https://us.posthog.com/project/348098/insights/QmH9Guis) — daily trend of catalog interactions
- [External Link Clicks by Context](https://us.posthog.com/project/348098/insights/z7IGpaFg) — bar chart of external clicks broken down by context (provider_website, product_action, provider_contact)

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-astro-static/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
