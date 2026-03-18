/**
 * PostHog Analytics Helpers
 *
 * Use these functions inside your React components (like ProductCatalog.jsx)
 * to capture custom events for product interactions.
 *
 * PostHog autocapture already tracks pageviews and generic clicks,
 * but these give you named, structured events for your key interactions.
 */

function getPostHog() {
  if (typeof window !== 'undefined' && window.posthog) {
    return window.posthog;
  }
  return null;
}

/** Track when a user expands a product card to see details */
export function trackProductView(product) {
  const ph = getPostHog();
  if (!ph) return;
  ph.capture('product_viewed', {
    product_id: product.id,
    product_name: product.name,
    provider: product.provider,
    category: product.category,
    pricing_type: product.pricing?.type,
    status: product.status,
  });
}

/** Track when a user clicks a product's action button (Download, Configure, etc.) */
export function trackProductAction(product) {
  const ph = getPostHog();
  if (!ph) return;
  ph.capture('product_action_clicked', {
    product_id: product.id,
    product_name: product.name,
    provider: product.provider,
    action_type: product.action?.type,
    action_label: product.action?.label,
    action_url: product.action?.url,
    pricing_type: product.pricing?.type,
  });
}

/** Track search queries (debounce this — fire after the user stops typing) */
export function trackSearch(query, resultCount) {
  const ph = getPostHog();
  if (!ph) return;
  ph.capture('product_searched', {
    search_query: query,
    result_count: resultCount,
  });
}

/** Track when a filter is applied */
export function trackFilterApplied(filterType, filterValue, activeFilters) {
  const ph = getPostHog();
  if (!ph) return;
  ph.capture('filter_applied', {
    filter_type: filterType,       // 'provider', 'category', 'pricing'
    filter_value: filterValue,
    active_filter_count: activeFilters,
  });
}

/** Track sort changes */
export function trackSortChanged(sortValue) {
  const ph = getPostHog();
  if (!ph) return;
  ph.capture('sort_changed', {
    sort_by: sortValue,
  });
}

/** Track view mode toggle (list vs grid) */
export function trackViewModeChanged(mode) {
  const ph = getPostHog();
  if (!ph) return;
  ph.capture('view_mode_changed', {
    view_mode: mode,
  });
}

/** Track external link clicks (provider websites, product URLs) */
export function trackExternalLinkClick(url, context) {
  const ph = getPostHog();
  if (!ph) return;
  ph.capture('external_link_clicked', {
    url: url,
    context: context,  // 'provider_website', 'product_action', 'provider_contact'
  });
}
