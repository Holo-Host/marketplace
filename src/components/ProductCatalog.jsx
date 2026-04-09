import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  trackProductView,
  trackProductAction,
  trackSearch,
  trackFilterApplied,
  trackSortChanged,
  trackViewModeChanged,
  trackExternalLinkClick,
} from '../utils/analytics';

// --- PROVIDER DISPLAY CONFIG ---
const PROVIDERS = {
  holo: { id: "holo", name: "Holo", color: "#027ff7" },
  holochain: { id: "holochain", name: "Holochain Foundation", color: "#4820e3" },
  unyt: { id: "unyt", name: "Unyt", color: "#084fa2" },
  coasys: { id: "coasys", name: "Coasys / AD4M", color: "#e0860a" },
  mycelium: { id: "mycelium", name: "Mycelium", color: "#0da5a0" },
};

const CATEGORIES = {
  hosting: "Hosting",
  social: "Social",
  developer_tools: "Developer Tools",
  currency: "Currency & Payments",
  networking: "Networking",
  ai: "AI",
  infrastructure: "Infrastructure",
};

// --- MYCELIUM API INTEGRATION ---

const MYCELIUM_RPC = 'https://ledger.projectmycelium.com/rpc';

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function bytesToGB(bytes) {
  if (!bytes || bytes === 0) return 0;
  return bytes / (1024 * 1024 * 1024);
}

function formatCurrency(amount) {
  if (!amount || amount === 0) return '$0.00';
  return '$' + (amount / 1e7).toFixed(4);
}

function formatCurrencyRaw(amount) {
  if (!amount || amount === 0) return 0;
  return parseFloat((amount / 1e7).toFixed(4));
}

async function rpc(method, params = {}) {
  const response = await fetch(MYCELIUM_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', method, params, id: 1 }),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  if (data.error) throw new Error(data.error.message || 'RPC error');
  return data.result;
}

async function getMyceliumProducts() {
  const count = await rpc('marketplace.getListingCount', {});
  const total = typeof count === 'number' ? count : 100;
  const listings = await rpc('marketplace.listListings', { limit: total, offset: 0 });

  if (!Array.isArray(listings)) return [];

  return listings.map(listing => {
    const cru = listing.total_resources?.cru || 0;
    const mru = listing.total_resources?.mru || 0;
    const sru = listing.total_resources?.sru || 0;
    const hru = listing.total_resources?.hru || 0;
    const location = listing.country || 'Unknown';
    const hourlyRaw = formatCurrencyRaw(listing.pricing?.on_demand_hourly);
    const hourlyLabel = formatCurrency(listing.pricing?.on_demand_hourly);

    return {
      id: `mycelium-${listing.listing_id}`,
      name: `Mycelium Node ${listing.listing_id}`,
      provider: "mycelium",
      source: "mycelium",
      description: `${cru} vCPU · ${formatBytes(mru)} RAM · ${formatBytes(sru)} SSD${hru > 0 ? ` · ${formatBytes(hru)} HDD` : ''}. Hosted in ${location}.`,
      longDescription: null,
      tags: ["vps", "hosting", "compute", location.toLowerCase()],
      category: "infrastructure",
      status: listing.status?.toLowerCase() === 'active' ? 'available' : 'coming_soon',
      pricing: {
        type: "paid",
        amount: hourlyRaw,
        label: hourlyRaw === 0 ? '$0.00/hr' : `${hourlyLabel}/hr`,
      },
      action: { type: "unyt_app", label: "Provision" },
      specs: {
        cpu: `${cru} vCPU`,
        ram: formatBytes(mru),
        storage: formatBytes(sru),
        location,
      },
      featured: false,
      rawListing: listing,
    };
  });
}

// --- ANIMATED PRODUCT ICONS ---
const AnimStyles = () => (
  <style>{`
    @keyframes mp-spin { to { transform: rotate(360deg) } }
    @keyframes mp-pulse { 0%,100% { opacity: .4 } 50% { opacity: 1 } }
    @keyframes mp-float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-3px) } }
    @keyframes mp-dash { to { stroke-dashoffset: -20 } }
    @keyframes mp-wave { 0% { transform: scaleY(0.3) } 50% { transform: scaleY(1) } 100% { transform: scaleY(0.3) } }
    .expand-enter { max-height: 0; opacity: 0; overflow: hidden; transition: max-height 0.3s ease, opacity 0.2s ease; }
    .expand-active { max-height: 1200px; opacity: 1; overflow: hidden; transition: max-height 0.4s ease, opacity 0.2s ease 0.1s; }
  `}</style>
);

const iconMap = {
  "holo-edge-hosting": (s) => (
    <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      <defs><linearGradient id="gh1" x1="0" y1="0" x2="48" y2="48"><stop stopColor="#027ff7" /><stop offset="1" stopColor="#03baff" /></linearGradient></defs>
      <rect x="8" y="12" width="32" height="8" rx="2" fill="url(#gh1)" opacity=".18" />
      <rect x="8" y="22" width="32" height="8" rx="2" fill="url(#gh1)" opacity=".3" />
      <rect x="8" y="32" width="32" height="8" rx="2" fill="url(#gh1)" opacity=".5" />
      <circle cx="34" cy="16" r="2" fill="#027ff7" style={{ animation: "mp-pulse 2s ease-in-out infinite" }} />
      <circle cx="34" cy="26" r="2" fill="#027ff7" style={{ animation: "mp-pulse 2s ease-in-out infinite .5s" }} />
      <circle cx="34" cy="36" r="2" fill="#027ff7" style={{ animation: "mp-pulse 2s ease-in-out infinite 1s" }} />
    </svg>
  ),
};

const categoryIcons = {
  infrastructure: (s, color) => (
    <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      <rect x="8" y="10" width="32" height="8" rx="2" stroke={color} strokeWidth="1.5" opacity=".35" />
      <rect x="8" y="20" width="32" height="8" rx="2" stroke={color} strokeWidth="1.5" opacity=".5" />
      <rect x="8" y="30" width="32" height="8" rx="2" stroke={color} strokeWidth="1.5" opacity=".7" />
      <circle cx="34" cy="14" r="1.5" fill={color} style={{ animation: "mp-pulse 2s ease-in-out infinite" }} />
      <circle cx="34" cy="24" r="1.5" fill={color} style={{ animation: "mp-pulse 2s ease-in-out infinite .7s" }} />
      <circle cx="34" cy="34" r="1.5" fill={color} style={{ animation: "mp-pulse 2s ease-in-out infinite 1.4s" }} />
    </svg>
  ),
  hosting: (s, color) => (
    <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      <ellipse cx="24" cy="16" rx="14" ry="5" stroke={color} strokeWidth="1.5" opacity=".5" />
      <path d="M10 16v16c0 2.76 6.27 5 14 5s14-2.24 14-5V16" stroke={color} strokeWidth="1.5" opacity=".5" />
      <path d="M10 24c0 2.76 6.27 5 14 5s14-2.24 14-5" stroke={color} strokeWidth="1.5" opacity=".35" />
    </svg>
  ),
  ai: (s, color) => (
    <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="10" stroke={color} strokeWidth="1.5" opacity=".4" />
      <circle cx="24" cy="24" r="4" fill={color} style={{ animation: "mp-pulse 2s ease-in-out infinite" }} />
      <line x1="24" y1="8" x2="24" y2="14" stroke={color} strokeWidth="1.5" opacity=".3" />
      <line x1="24" y1="34" x2="24" y2="40" stroke={color} strokeWidth="1.5" opacity=".3" />
      <line x1="8" y1="24" x2="14" y2="24" stroke={color} strokeWidth="1.5" opacity=".3" />
      <line x1="34" y1="24" x2="40" y2="24" stroke={color} strokeWidth="1.5" opacity=".3" />
    </svg>
  ),
};

function getProductIcon(product, size = 40) {
  if (iconMap[product.id]) return iconMap[product.id](size);
  const provColor = PROVIDERS[product.provider]?.color || "#999";
  const fallback = categoryIcons[product.category];
  if (fallback) return fallback(size, provColor);
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="8" stroke={provColor} strokeWidth="1.5" opacity=".3" />
      <circle cx="24" cy="24" r="3" fill={provColor} style={{ animation: "mp-pulse 2s ease-in-out infinite" }} />
    </svg>
  );
}

// --- UTILITIES ---
function fuzzyMatch(text, query) {
  if (!query) return true;
  const lower = text.toLowerCase();
  return query.toLowerCase().split(/\s+/).every(t => lower.includes(t));
}

function getPricingSort(p) {
  if (p.pricing.type === "free") return 0;
  if (p.pricing.type === "earn") return 0.5;
  if (p.pricing.type === "freemium") return 1;
  if (p.pricing.type === "contact") return 999;
  return p.pricing.amount || 50;
}

// --- SUB-COMPONENTS ---
const PricingBadge = ({ pricing }) => {
  const styles = {
    free: "bg-emerald-50 text-emerald-700 border-emerald-200",
    earn: "bg-green-50 text-green-700 border-green-200",
    freemium: "bg-blue-50 text-blue-700 border-blue-200",
    paid: "bg-amber-50 text-amber-700 border-amber-200",
    contact: "bg-gray-50 text-gray-500 border-gray-200",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[pricing.type]}`}>
      {pricing.label}
      {pricing.note && <span className="ml-1 opacity-60">({pricing.note})</span>}
    </span>
  );
};

const StatusBadge = ({ status }) => {
  if (status === "available") return null;
  const s = { beta: "bg-violet-50 text-violet-700 border-violet-200", coming_soon: "bg-gray-50 text-gray-500 border-gray-200" };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${s[status]}`}>{status === "beta" ? "Beta" : "Coming Soon"}</span>;
};

const ProviderDot = ({ providerId }) => {
  const prov = PROVIDERS[providerId];
  if (!prov) return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: prov.color }} />{prov.name}
    </span>
  );
};

const CheckIcon = () => (
  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const ChevronIcon = ({ expanded }) => (
  <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

// --- SPEC TILE ---
const SpecTile = ({ label, value, mono = true }) => (
  <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100 min-w-0">
    <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-0.5">{label}</div>
    <div
      className={`text-xs text-gray-900 ${mono ? 'font-mono' : ''} truncate cursor-text select-all`}
      title={String(value)}
    >
      {value}
    </div>
  </div>
);

// --- EXPANDED DETAIL PANEL ---
const ExpandedDetail = ({ product }) => {
  const r = product.rawListing;

  if (product.source === 'mycelium' && r) {
    const cru = r.total_resources?.cru || 0;
    const mru = r.total_resources?.mru || 0;
    const sru = r.total_resources?.sru || 0;
    const hru = r.total_resources?.hru || 0;
    const ipv4 = r.total_resources?.ipv4u || 0;

    const onDemandHourly = r.pricing?.on_demand_hourly;
    const onDemandDaily = r.pricing?.on_demand_daily;
    const dedicatedMonthly = r.pricing?.dedicated_monthly;

    const availableSlices = r.available_slices ?? '—';
    const totalSlices = r.total_slices ?? '—';
    const gridVersion = r.grid_version || '—';
    const nodeId = r.node_id || r.twin_id || '—';
    const listingId = r.listing_id || '—';
    const country = r.country || '—';
    const statusLabel = r.status || '—';

    return (
      <div className="px-3 sm:px-5 pb-5 pt-1">
        <div className="pl-0 sm:pl-14 pr-0 sm:pr-2">

          <div className="mb-4">
            <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-2">Resources</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <SpecTile label="vCPU" value={`${cru} core${cru !== 1 ? 's' : ''}`} />
              <SpecTile label="RAM" value={formatBytes(mru)} />
              <SpecTile label="SSD Storage" value={sru > 0 ? formatBytes(sru) : '—'} />
              <SpecTile label="HDD Storage" value={hru > 0 ? formatBytes(hru) : '—'} />
              {ipv4 > 0 && <SpecTile label="IPv4 Addresses" value={String(ipv4)} />}
            </div>
          </div>

          <div className="mb-4">
            <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-2">Pricing</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <SpecTile label="On-Demand / Hour" value={formatCurrency(onDemandHourly)} />
              <SpecTile label="On-Demand / Day" value={onDemandDaily != null ? formatCurrency(onDemandDaily) : '—'} />
              <SpecTile label="Dedicated / Month" value={dedicatedMonthly != null ? formatCurrency(dedicatedMonthly) : '—'} />
            </div>
          </div>

          <div className="mb-4">
            <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-2">Availability</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <SpecTile label="Available Slices" value={`${availableSlices} / ${totalSlices}`} />
              <SpecTile label="Status" value={statusLabel} mono={false} />
              <SpecTile label="Country" value={country} mono={false} />
              <SpecTile label="Grid Version" value={gridVersion} />
            </div>
          </div>

          <div className="mb-2">
            <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-2">Node Info</div>
            <div className="grid grid-cols-2 gap-2">
              <SpecTile label="Listing ID" value={String(listingId)} />
              <SpecTile label="Node ID" value={String(nodeId)} />
            </div>
          </div>

          {(() => {
            const knownKeys = new Set([
              'listing_id', 'node_id', 'twin_id', 'country', 'status',
              'total_resources', 'pricing', 'available_slices', 'total_slices', 'grid_version',
            ]);
            const extras = Object.entries(r).filter(([k]) => !knownKeys.has(k));
            if (extras.length === 0) return null;
            return (
              <div className="mt-3">
                <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-2">Additional Info</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {extras.map(([key, val]) => (
                    <SpecTile
                      key={key}
                      label={key.replace(/_/g, ' ')}
                      value={typeof val === 'object' ? JSON.stringify(val) : String(val ?? '—')}
                      mono={false}
                    />
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    );
  }

  const detailText = product.longDescription || null;
  if (!detailText) return null;
  return (
    <div className="px-3 sm:px-5 pb-4">
      <div className="pl-0 sm:pl-14 pr-0 sm:pr-2">
        <p className="text-gray-600 text-sm leading-relaxed">{detailText}</p>
        {product.specs && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
            {[
              ["CPU", product.specs.cpu],
              ["RAM", product.specs.ram],
              ["Storage", product.specs.storage],
              product.specs.bandwidth ? ["Bandwidth", product.specs.bandwidth] : null,
            ].filter(Boolean).map(([label, value]) => (
              <SpecTile key={label} label={label} value={value} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// --- PRODUCT CARD ---
const ProductCard = ({ product, viewMode, isExpanded, onToggle }) => {
  if (viewMode === "grid") {
    return (
      <div className={`group relative flex flex-col rounded-xl border transition-all duration-200 ${isExpanded ? "border-gray-300 bg-gray-50/80" : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50"}`}>
        <div className="p-5 cursor-pointer" onClick={onToggle}>
          <div className="flex items-start gap-3 mb-3">
            <div className="shrink-0 w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden">
              {getProductIcon(product, 40)}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-gray-900 font-semibold text-sm leading-tight truncate pr-2">{product.name}</h3>
              <ProviderDot providerId={product.provider} />
            </div>
            <ChevronIcon expanded={isExpanded} />
          </div>
          <div className="mb-2"><PricingBadge pricing={product.pricing} /></div>
          <p className="text-gray-500 text-xs leading-relaxed mb-4 flex-1 line-clamp-3">{product.description}</p>
          <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{CATEGORIES[product.category]}</span>
            <span className="text-xs font-medium text-blue-600">{product.action.label} &rarr;</span>
          </div>
        </div>
        <div className={isExpanded ? "expand-active" : "expand-enter"}>
          {isExpanded && <ExpandedDetail product={product} />}
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className={`transition-colors duration-150 ${isExpanded ? "bg-gray-50/80" : "hover:bg-gray-50/50"}`}>
      <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4 px-3 sm:px-5 py-3 sm:py-4 border-b border-gray-100 cursor-pointer" onClick={onToggle}>
        <div className="hidden sm:flex shrink-0 w-10 h-10 rounded-lg bg-gray-50 items-center justify-center overflow-hidden mt-0.5">
          {getProductIcon(product, 40)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-1 flex-wrap">
            <h3 className="text-gray-900 font-semibold text-[15px] leading-tight">{product.name}</h3>
            <StatusBadge status={product.status} />
            {product.specs && <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-mono">{product.specs.location}</span>}
          </div>
          <p className="text-gray-500 text-sm leading-relaxed mb-2 line-clamp-2">{product.description}</p>
          <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
            <ProviderDot providerId={product.provider} />
            <span>&middot;</span>
            <span>{CATEGORIES[product.category]}</span>
            {product.specs && <><span>&middot;</span><span className="font-mono">{product.specs.cpu} &middot; {product.specs.ram}</span></>}
          </div>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-2 sm:flex-col sm:items-end sm:gap-2 shrink-0 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <PricingBadge pricing={product.pricing} />
            <ChevronIcon expanded={isExpanded} />
          </div>
          <button className="text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-all border border-gray-200" onClick={e => { e.stopPropagation(); trackProductAction(product); }}>
            {product.action.label}
          </button>
        </div>
      </div>
      <div className={isExpanded ? "expand-active border-b border-gray-100" : "expand-enter"}>
        {isExpanded && <ExpandedDetail product={product} />}
      </div>
    </div>
  );
};

const SearchIcon = () => (
  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);
const GridIcon = ({ active }) => (
  <svg className={`w-4 h-4 ${active ? "text-gray-900" : "text-gray-400"}`} fill="currentColor" viewBox="0 0 16 16">
    <path d="M1 2.5A1.5 1.5 0 012.5 1h3A1.5 1.5 0 017 2.5v3A1.5 1.5 0 015.5 7h-3A1.5 1.5 0 011 5.5v-3zm8 0A1.5 1.5 0 0110.5 1h3A1.5 1.5 0 0115 2.5v3A1.5 1.5 0 0113.5 7h-3A1.5 1.5 0 019 5.5v-3zm-8 8A1.5 1.5 0 012.5 9h3A1.5 1.5 0 017 10.5v3A1.5 1.5 0 015.5 15h-3A1.5 1.5 0 011 13.5v-3zm8 0A1.5 1.5 0 0110.5 9h3a1.5 1.5 0 011.5 1.5v3a1.5 1.5 0 01-1.5 1.5h-3A1.5 1.5 0 019 13.5v-3z" />
  </svg>
);
const ListIcon = ({ active }) => (
  <svg className={`w-4 h-4 ${active ? "text-gray-900" : "text-gray-400"}`} fill="currentColor" viewBox="0 0 16 16">
    <path fillRule="evenodd" d="M2.5 12a.5.5 0 01.5-.5h10a.5.5 0 010 1H3a.5.5 0 01-.5-.5zm0-4a.5.5 0 01.5-.5h10a.5.5 0 010 1H3a.5.5 0 01-.5-.5zm0-4a.5.5 0 01.5-.5h10a.5.5 0 010 1H3a.5.5 0 01-.5-.5z" />
  </svg>
);

// --- MAIN COMPONENT ---
export default function ProductCatalog({ products: staticProducts = [], providers: providerData = [] }) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("featured");
  const [viewMode, setViewMode] = useState("list");
  const [selectedProviders, setSelectedProviders] = useState(new Set());
  const [selectedCategories, setSelectedCategories] = useState(new Set());
  const [selectedPricing, setSelectedPricing] = useState(new Set());
  const [selectedCountries, setSelectedCountries] = useState(new Set());
  const [minCPU, setMinCPU] = useState(0);
  const [minRAMGB, setMinRAMGB] = useState(0);
  const [minStorageGB, setMinStorageGB] = useState(0);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [myceliumProducts, setMyceliumProducts] = useState([]);
  const [myceliumLoading, setMyceliumLoading] = useState(false);
  const [myceliumError, setMyceliumError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [expandedProviderId, setExpandedProviderId] = useState(null);
  const searchRef = useRef(null);
  const searchTimerRef = useRef(null);

  const providerLookup = useMemo(() => {
    const lookup = { ...PROVIDERS };
    providerData.forEach(p => {
      lookup[p.id] = { ...lookup[p.id], ...p };
    });
    return lookup;
  }, [providerData]);

  const allProducts = useMemo(() => [...staticProducts, ...myceliumProducts], [staticProducts, myceliumProducts]);

  const availableCountries = useMemo(() => {
    return [...new Set(myceliumProducts.map(p => p.rawListing?.country).filter(Boolean))].sort();
  }, [myceliumProducts]);

  const lastUpdatedLabel = useMemo(() => {
    if (!lastUpdated) return null;
    return lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, [lastUpdated]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setMyceliumLoading(true);
      setMyceliumError(null);
      try {
        const products = await getMyceliumProducts();
        if (!cancelled) {
          setMyceliumProducts(products);
          setLastUpdated(new Date());
        }
      } catch (err) {
        if (!cancelled) setMyceliumError(err.message || 'Failed to load listings');
      } finally {
        if (!cancelled) setMyceliumLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 60_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "/" && !e.ctrlKey && !e.metaKey && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "Escape" && expandedId) setExpandedId(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [expandedId]);

  const toggleExpand = useCallback((id) => {
    setExpandedId(prev => {
      const newId = prev === id ? null : id;
      if (newId) {
        const product = allProducts.find(p => p.id === id);
        if (product) trackProductView(product);
      }
      return newId;
    });
  }, [allProducts]);

  const toggleFilter = (set, setFn, value) => {
    const next = new Set(set);
    next.has(value) ? next.delete(value) : next.add(value);
    setFn(next);
  };

  const myceliumFilterCount = selectedCountries.size + (minCPU > 0 ? 1 : 0) + (minRAMGB > 0 ? 1 : 0) + (minStorageGB > 0 ? 1 : 0);
  const activeFilterCount = selectedProviders.size + selectedCategories.size + selectedPricing.size + myceliumFilterCount;

  const filtered = useMemo(() => {
    let items = allProducts.filter(p => {
      if (!fuzzyMatch(`${p.name} ${p.description} ${PROVIDERS[p.provider]?.name || ''} ${p.tags.join(" ")}`, search)) return false;
      if (selectedProviders.size && !selectedProviders.has(p.provider)) return false;
      if (selectedCategories.size && !selectedCategories.has(p.category)) return false;
      if (selectedPricing.size) {
        const pt = p.pricing.type;
        let match = false;
        if (selectedPricing.has("free") && (pt === "free" || pt === "freemium")) match = true;
        if (selectedPricing.has("earn") && pt === "earn") match = true;
        if (selectedPricing.has("paid") && (pt === "paid" || pt === "contact")) match = true;
        if (!match) return false;
      }
      if (p.source === 'mycelium' && p.rawListing) {
        const r = p.rawListing;
        if (selectedCountries.size && !selectedCountries.has(r.country)) return false;
        if (minCPU > 0 && (r.total_resources?.cru || 0) < minCPU) return false;
        if (minRAMGB > 0 && bytesToGB(r.total_resources?.mru || 0) < minRAMGB) return false;
        if (minStorageGB > 0 && bytesToGB(r.total_resources?.sru || 0) < minStorageGB) return false;
      }
      return true;
    });
    switch (sortBy) {
      case "name": items.sort((a, b) => a.name.localeCompare(b.name)); break;
      case "price_low": items.sort((a, b) => getPricingSort(a) - getPricingSort(b)); break;
      case "price_high": items.sort((a, b) => getPricingSort(b) - getPricingSort(a)); break;
      case "provider": items.sort((a, b) => (PROVIDERS[a.provider]?.name || '').localeCompare(PROVIDERS[b.provider]?.name || '')); break;
      default: items.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }
    return items;
  }, [allProducts, search, sortBy, selectedProviders, selectedCategories, selectedPricing, selectedCountries, minCPU, minRAMGB, minStorageGB]);

  const providerCounts = useMemo(() => { const c = {}; allProducts.forEach(p => { c[p.provider] = (c[p.provider] || 0) + 1; }); return c; }, [allProducts]);
  const categoryCounts = useMemo(() => { const c = {}; allProducts.forEach(p => { c[p.category] = (c[p.category] || 0) + 1; }); return c; }, [allProducts]);
  const pricingCounts = useMemo(() => {
    const c = { free: 0, earn: 0, paid: 0 };
    allProducts.forEach(p => {
      if (p.pricing.type === "free" || p.pricing.type === "freemium") c.free++;
      if (p.pricing.type === "earn") c.earn++;
      if (p.pricing.type === "paid" || p.pricing.type === "contact") c.paid++;
    });
    return c;
  }, [allProducts]);

  const countryCounts = useMemo(() => {
    const c = {};
    myceliumProducts.forEach(p => {
      const country = p.rawListing?.country;
      if (country) c[country] = (c[country] || 0) + 1;
    });
    return c;
  }, [myceliumProducts]);

  const clearAll = () => {
    setSelectedProviders(new Set());
    setSelectedCategories(new Set());
    setSelectedPricing(new Set());
    setSelectedCountries(new Set());
    setMinCPU(0);
    setMinRAMGB(0);
    setMinStorageGB(0);
    setSearch("");
  };

  const handleSearchChange = useCallback((e) => {
    const query = e.target.value;
    setSearch(query);
    clearTimeout(searchTimerRef.current);
    if (query.length >= 2) {
      searchTimerRef.current = setTimeout(() => {
        trackSearch(query, filtered.length);
      }, 800);
    }
  }, [filtered.length]);

  const PRICING_FILTERS = [
    { key: "free", label: "Free / Freemium" },
    { key: "earn", label: "Get Paid", description: "Earn HoloFuel by hosting" },
    { key: "paid", label: "Paid" },
  ];

  const CPU_OPTIONS = [
    { value: 0, label: "Any" },
    { value: 2, label: "2+ cores" },
    { value: 4, label: "4+ cores" },
    { value: 8, label: "8+ cores" },
    { value: 16, label: "16+ cores" },
    { value: 32, label: "32+ cores" },
  ];

  const RAM_OPTIONS = [
    { value: 0, label: "Any" },
    { value: 2, label: "2+ GB" },
    { value: 4, label: "4+ GB" },
    { value: 8, label: "8+ GB" },
    { value: 16, label: "16+ GB" },
    { value: 32, label: "32+ GB" },
    { value: 64, label: "64+ GB" },
  ];

  const STORAGE_OPTIONS = [
    { value: 0, label: "Any" },
    { value: 50, label: "50+ GB" },
    { value: 100, label: "100+ GB" },
    { value: 250, label: "250+ GB" },
    { value: 500, label: "500+ GB" },
    { value: 1000, label: "1+ TB" },
  ];

  const selectClass = "w-full mt-1 px-2 py-1.5 rounded-md bg-white border border-gray-200 text-xs text-gray-700 focus:outline-none focus:border-gray-300 appearance-none cursor-pointer";

  const FilterSidebar = () => (
    <div>
      {/* Pricing */}
      <div className="mb-6">
        <h4 className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold mb-3">Pricing</h4>
        {PRICING_FILTERS.map(pf => (
          <label key={pf.key} onClick={() => { toggleFilter(selectedPricing, setSelectedPricing, pf.key); trackFilterApplied('pricing', pf.key, activeFilterCount); }} className="flex items-center gap-2.5 py-1.5 cursor-pointer group">
            <span className={`w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0 ${selectedPricing.has(pf.key) ? (pf.key === "earn" ? "bg-green-600 border-green-600" : "bg-blue-600 border-blue-600") : "border-gray-300 group-hover:border-gray-400"}`}>
              {selectedPricing.has(pf.key) && <CheckIcon />}
            </span>
            <span className="flex flex-col">
              <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">{pf.label}</span>
              {pf.description && <span className="text-[10px] text-gray-400 leading-tight">{pf.description}</span>}
            </span>
            <span className="text-xs text-gray-400 ml-auto">{pricingCounts[pf.key]}</span>
          </label>
        ))}
      </div>

      {/* Provider */}
      <div className="mb-6">
        <h4 className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold mb-3">Provider</h4>
        {Object.values(providerLookup).sort((a, b) => (a.sortOrder || 99) - (b.sortOrder || 99)).map(prov => (
          providerCounts[prov.id] ? (
            <div key={prov.id}>
              <div className="flex items-center gap-2.5 py-1.5">
                <label onClick={(e) => { e.stopPropagation(); toggleFilter(selectedProviders, setSelectedProviders, prov.id); trackFilterApplied('provider', prov.id, activeFilterCount); }} className="cursor-pointer shrink-0">
                  <span className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${selectedProviders.has(prov.id) ? "border-blue-600" : "border-gray-300 hover:border-gray-400"}`} style={selectedProviders.has(prov.id) ? { backgroundColor: prov.color, borderColor: prov.color } : {}}>
                    {selectedProviders.has(prov.id) && <CheckIcon />}
                  </span>
                </label>
                <button onClick={() => setExpandedProviderId(prev => prev === prov.id ? null : prov.id)} className="flex items-center gap-1 flex-1 min-w-0 text-left group">
                  <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors truncate flex-1">{prov.name}</span>
                  <svg className={`w-3 h-3 text-gray-400 transition-transform duration-200 shrink-0 ${expandedProviderId === prov.id ? "rotate-180 text-gray-500" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <span className="text-xs text-gray-400 shrink-0">{providerCounts[prov.id]}</span>
              </div>
              {expandedProviderId === prov.id && prov.description && (
                <div className="ml-6 mb-2 p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                  <p className="text-xs text-gray-500 leading-relaxed mb-2">{prov.description}</p>
                  <div className="flex gap-2 flex-wrap">
                    {prov.website && (
                      <a href={prov.website} target="_blank" rel="noopener noreferrer"
                        onClick={() => trackExternalLinkClick(prov.website, 'provider_website')}
                        className="text-[11px] text-blue-600 hover:text-blue-500 transition-colors">
                        Website &rarr;
                      </a>
                    )}
                    {prov.contact && (
                      <a href={prov.contact} target="_blank" rel="noopener noreferrer"
                        onClick={() => trackExternalLinkClick(prov.contact, 'provider_contact')}
                        className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors">
                        Contact &rarr;
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : null
        ))}
      </div>

      {/* Category */}
      <div className="mb-6">
        <h4 className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold mb-3">Category</h4>
        {Object.entries(CATEGORIES).map(([key, label]) => (
          categoryCounts[key] ? (
            <label key={key} onClick={() => { toggleFilter(selectedCategories, setSelectedCategories, key); trackFilterApplied('category', key, activeFilterCount); }} className="flex items-center gap-2.5 py-1.5 cursor-pointer group">
              <span className={`w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0 ${selectedCategories.has(key) ? "bg-blue-600 border-blue-600" : "border-gray-300 group-hover:border-gray-400"}`}>
                {selectedCategories.has(key) && <CheckIcon />}
              </span>
              <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors flex-1">{label}</span>
              <span className="text-xs text-gray-400">{categoryCounts[key]}</span>
            </label>
          ) : null
        ))}
      </div>

      {/* Mycelium Compute Filters */}
      {myceliumProducts.length > 0 && (
        <div className="mb-6">
          <h4 className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold mb-1">Compute</h4>
          <p className="text-[10px] text-gray-400 mb-3">Mycelium VPS only</p>

          {availableCountries.length > 0 && (
            <div className="mb-4">
              <div className="text-xs text-gray-500 mb-2">Location</div>
              {availableCountries.map(country => (
                <label key={country} onClick={() => { toggleFilter(selectedCountries, setSelectedCountries, country); trackFilterApplied('country', country, activeFilterCount); }} className="flex items-center gap-2.5 py-1 cursor-pointer group">
                  <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all shrink-0 ${selectedCountries.has(country) ? "bg-green-600 border-green-600" : "border-gray-300 group-hover:border-gray-400"}`}>
                    {selectedCountries.has(country) && <CheckIcon />}
                  </span>
                  <span className="text-xs text-gray-600 group-hover:text-gray-900 transition-colors flex-1">{country}</span>
                  <span className="text-[10px] text-gray-400">{countryCounts[country] || 0}</span>
                </label>
              ))}
            </div>
          )}

          <div className="mb-3">
            <div className="text-xs text-gray-500">Min CPU</div>
            <div className="relative">
              <select value={minCPU} onChange={e => { setMinCPU(Number(e.target.value)); trackFilterApplied('min_cpu', e.target.value, activeFilterCount); }} className={selectClass}>
                {CPU_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" fill="currentColor" viewBox="0 0 16 16"><path d="M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 01.753 1.659l-4.796 5.48a1 1 0 01-1.506 0z" /></svg>
            </div>
          </div>

          <div className="mb-3">
            <div className="text-xs text-gray-500">Min RAM</div>
            <div className="relative">
              <select value={minRAMGB} onChange={e => { setMinRAMGB(Number(e.target.value)); trackFilterApplied('min_ram', e.target.value, activeFilterCount); }} className={selectClass}>
                {RAM_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" fill="currentColor" viewBox="0 0 16 16"><path d="M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 01.753 1.659l-4.796 5.48a1 1 0 01-1.506 0z" /></svg>
            </div>
          </div>

          <div className="mb-2">
            <div className="text-xs text-gray-500">Min SSD Storage</div>
            <div className="relative">
              <select value={minStorageGB} onChange={e => { setMinStorageGB(Number(e.target.value)); trackFilterApplied('min_storage', e.target.value, activeFilterCount); }} className={selectClass}>
                {STORAGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" fill="currentColor" viewBox="0 0 16 16"><path d="M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 01.753 1.659l-4.796 5.48a1 1 0 01-1.506 0z" /></svg>
            </div>
          </div>
        </div>
      )}

      {activeFilterCount > 0 && (
        <button onClick={clearAll} className="text-xs text-gray-400 hover:text-gray-700 underline underline-offset-2 transition-colors">
          Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-gray-900" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
      <AnimStyles />
      <header className="border-b border-gray-100 bg-white/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={`${import.meta.env.BASE_URL}holo-mark.svg`} alt="Holo" className="w-7 h-7 grayscale opacity-50" />
            <span className="text-gray-900 font-semibold text-lg tracking-tight">Marketplace</span>
          </div>
          <nav className="flex items-center gap-6 text-sm">
            <a href={`${import.meta.env.BASE_URL}`} className="text-gray-400 hover:text-gray-700 transition-colors">Choose Decent</a>
            <a href={`${import.meta.env.BASE_URL}products`} className="text-gray-900 font-medium">Products</a>
            <a href="#" className="text-gray-400 hover:text-gray-700 transition-colors hidden sm:inline">Docs</a>
          </nav>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 sm:pt-8 pb-16 sm:pb-20">
        {/* Header row */}
        <div className="mb-5 sm:mb-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-1">Products</h1>
              <p className="text-sm text-gray-400">
                {allProducts.length} listing{allProducts.length !== 1 ? 's' : ''} across the ecosystem
                {myceliumProducts.length > 0 && (
                  <span className="ml-2 text-green-600/70">
                    · {myceliumProducts.length} Mycelium node{myceliumProducts.length !== 1 ? 's' : ''}
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-gray-400">
              {myceliumLoading && (
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                  Syncing…
                </span>
              )}
              {!myceliumLoading && myceliumError && (
                <span className="flex items-center gap-1.5 text-red-600" title={myceliumError}>
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  Mycelium unavailable
                </span>
              )}
              {!myceliumLoading && !myceliumError && lastUpdatedLabel && (
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  Updated {lastUpdatedLabel}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 sm:gap-3 mb-5 sm:mb-6 flex-wrap">
          <div className="relative flex-1 min-w-[160px] max-w-xs">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"><SearchIcon /></div>
            <input
              ref={searchRef}
              type="text"
              placeholder="Search… (/)"
              value={search}
              onChange={handleSearchChange}
              className="w-full h-10 pl-9 pr-3 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-300"
            />
          </div>
          <button onClick={() => setShowMobileFilters(v => !v)} className="sm:hidden flex items-center gap-1.5 h-10 px-3 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-600">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
            Filters{activeFilterCount > 0 && <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center">{activeFilterCount}</span>}
          </button>
          <select value={sortBy} onChange={e => { setSortBy(e.target.value); trackSortChanged(e.target.value); }}
            className="h-10 px-2 sm:px-3 pr-7 sm:pr-8 rounded-lg bg-gray-50 border border-gray-200 text-xs sm:text-sm text-gray-700 focus:outline-none focus:border-gray-300 appearance-none cursor-pointer"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%239ca3af' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 01.753 1.659l-4.796 5.48a1 1 0 01-1.506 0z'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center" }}>
            <option value="featured">Featured</option>
            <option value="name">Name A-Z</option>
            <option value="price_low">Price: Low → High</option>
            <option value="price_high">Price: High → Low</option>
            <option value="provider">Provider</option>
          </select>
          <div className="hidden sm:flex items-center border border-gray-200 rounded-lg overflow-hidden">
            <button onClick={() => { setViewMode("grid"); trackViewModeChanged("grid"); }} className={`p-2.5 transition-colors ${viewMode === "grid" ? "bg-gray-100" : "hover:bg-gray-50"}`}><GridIcon active={viewMode === "grid"} /></button>
            <button onClick={() => { setViewMode("list"); trackViewModeChanged("list"); }} className={`p-2.5 transition-colors ${viewMode === "list" ? "bg-gray-100" : "hover:bg-gray-50"}`}><ListIcon active={viewMode === "list"} /></button>
          </div>
        </div>

        {/* Mobile filters */}
        {showMobileFilters && (
          <div className="sm:hidden mb-5 p-4 rounded-xl border border-gray-200 bg-gray-50/60">
            <FilterSidebar />
          </div>
        )}

        <div className="flex gap-6 sm:gap-8">
          {/* Sidebar filters — desktop */}
          <aside className="hidden sm:block w-48 shrink-0">
            <div className="sticky top-20 h-[calc(100vh-6rem)] overflow-y-auto pr-2">
              <FilterSidebar />
            </div>
          </aside>

          {/* Product list / grid */}
          <div className="flex-1 min-w-0">
            {myceliumLoading && myceliumProducts.length === 0 && allProducts.length === staticProducts.length && (
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Loading Mycelium listings…
              </div>
            )}

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                  <SearchIcon />
                </div>
                <p className="text-gray-500 text-sm mb-1">No products match your filters</p>
                <button onClick={clearAll} className="text-xs text-blue-600 hover:text-blue-500 transition-colors mt-2 underline underline-offset-2">
                  Clear all filters
                </button>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {filtered.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    viewMode="grid"
                    isExpanded={expandedId === product.id}
                    onToggle={() => toggleExpand(product.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                {filtered.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    viewMode="list"
                    isExpanded={expandedId === product.id}
                    onToggle={() => toggleExpand(product.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
