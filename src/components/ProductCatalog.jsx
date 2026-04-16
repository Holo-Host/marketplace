import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  trackProductView,
  trackProductAction,
  trackSearch,
  trackFilterApplied,
  trackSortChanged,
  trackViewModeChanged,
  trackExternalLinkClick,
} from "../utils/analytics.js";

// ─── Constants ──────────────────────────────────────────────────────────────
const ACCENT = "#2fa8dc";

const CATEGORIES = {
  hosting: "Hosting",
  social: "Social",
  developer_tools: "Dev Tools",
  currency: "Currency",
  networking: "Networking",
  ai: "AI",
  infrastructure: "Infrastructure",
};

const PROVIDERS = {
  holo:       { name: "Holo",       color: ACCENT },
  holochain:  { name: "Holochain",  color: "#6edb7f" },
  unyt:       { name: "Unyt",       color: "#a78bfa" },
  coasys:     { name: "Coasys",     color: "#fb923c" },
  mycelium:   { name: "Mycelium",   color: "#34d399" },
};

const PRICING_LABELS = {
  free:     "Free",
  freemium: "Freemium",
  earn:     "Get Paid",
  paid:     "Paid",
  contact:  "Contact",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
function bytesToGB(bytes) { return bytes / (1024 ** 3); }

function fuzzyMatch(text, query) {
  if (!query.trim()) return true;
  const t = text.toLowerCase();
  return query.toLowerCase().split(/\s+/).every(w => t.includes(w));
}

function getPricingSort(p) {
  if (p.pricing.type === "earn") return -1;
  if (p.pricing.type === "free" || p.pricing.type === "freemium") return 0;
  return p.pricing.amount ?? 999;
}

// ─── Mycelium API ────────────────────────────────────────────────────────────
async function getMyceliumProducts() {
  try {
    const res = await fetch("https://api.mycelium.io/v1/listings");
    if (!res.ok) throw new Error("Mycelium API error");
    const data = await res.json();
    return parseMyceliumListings(data?.listings ?? []);
  } catch {
    return [];
  }
}

function parseMyceliumListings(listings) {
  return listings.map((listing) => {
    const r = listing.total_resources ?? {};
    const cru = r.cru ?? 0;
    const mru = r.mru ?? 0;
    const sru = r.sru ?? 0;
    const hru = r.hru ?? 0;
    const location = listing.country ?? "Unknown";
    const monthlyUsd = listing.pricing?.monthly_usd ?? null;
    const monthlyLabel = monthlyUsd ? `$${monthlyUsd.toFixed(2)}/mo` : "Contact";
    const description = `${cru} vCPU · ${formatBytes(mru)} RAM · ${formatBytes(sru)} SSD${hru > 0 ? ` · ${formatBytes(hru)} HDD` : ""}`;
    return {
      id: `mycelium-${listing.listing_id}`,
      name: "Private Cloud Server",
      provider: "mycelium",
      source: "mycelium",
      description,
      longDescription: null,
      tags: ["vps", "hosting", "compute", "private cloud", location.toLowerCase()],
      category: "infrastructure",
      status: listing.status?.toLowerCase() === "active" ? "available" : "coming_soon",
      pricing: { type: "paid", amount: monthlyUsd, label: monthlyLabel },
      action: { type: "unyt_app", label: "Purchase" },
      specs: { cpu: `${cru} vCPU`, ram: formatBytes(mru), storage: formatBytes(sru), location },
      featured: false,
      rawListing: listing,
    };
  });
}

// ─── Icon helpers ─────────────────────────────────────────────────────────────
const iconMap = {
  "holo-edge-hosting": (s) => (
    <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      <defs><linearGradient id="gh1" x1="0" y1="0" x2="48" y2="48">
        <stop stopColor={ACCENT} /><stop offset="1" stopColor="#68cff0" />
      </linearGradient></defs>
      <rect x="8" y="12" width="32" height="8" rx="3" fill="url(#gh1)" opacity=".15" />
      <rect x="8" y="22" width="32" height="8" rx="3" fill="url(#gh1)" opacity=".28" />
      <rect x="8" y="32" width="32" height="8" rx="3" fill="url(#gh1)" opacity=".45" />
      <circle cx="34" cy="16" r="2" fill={ACCENT} style={{ animation: "mp-pulse 2s ease-in-out infinite" }} />
      <circle cx="34" cy="26" r="2" fill={ACCENT} style={{ animation: "mp-pulse 2s ease-in-out infinite .5s" }} />
      <circle cx="34" cy="36" r="2" fill={ACCENT} style={{ animation: "mp-pulse 2s ease-in-out infinite 1s" }} />
    </svg>
  ),
};

const categoryIcons = {
  infrastructure: (s, c) => (
    <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      <rect x="8" y="10" width="32" height="8" rx="3" fill={c || ACCENT} opacity=".2" />
      <rect x="8" y="20" width="32" height="8" rx="3" fill={c || ACCENT} opacity=".35" />
      <rect x="8" y="30" width="32" height="8" rx="3" fill={c || ACCENT} opacity=".5" />
    </svg>
  ),
  hosting: (s, c) => (
    <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="14" stroke={c || ACCENT} strokeWidth="1.5" opacity=".4" />
      <circle cx="24" cy="24" r="6" fill={c || ACCENT} opacity=".5" />
    </svg>
  ),
  developer_tools: (s, c) => (
    <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      <path d="M16 18l-8 6 8 6M32 18l8 6-8 6M22 34l4-20" stroke={c || ACCENT} strokeWidth="1.5" strokeLinecap="round" opacity=".7" />
    </svg>
  ),
  ai: (s, c) => (
    <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="6" fill={c || ACCENT} opacity=".5" />
      {[0,60,120,180,240,300].map((deg, i) => {
        const r = 14;
        const x = 24 + r * Math.cos((deg * Math.PI) / 180);
        const y = 24 + r * Math.sin((deg * Math.PI) / 180);
        return <circle key={i} cx={x} cy={y} r="3" fill={c || ACCENT} opacity={0.2 + i * 0.08} />;
      })}
    </svg>
  ),
  social: (s, c) => (
    <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      <circle cx="16" cy="24" r="5" stroke={c || ACCENT} strokeWidth="1.5" opacity=".5" />
      <circle cx="32" cy="16" r="5" stroke={c || ACCENT} strokeWidth="1.5" opacity=".7" />
      <circle cx="32" cy="32" r="5" stroke={c || ACCENT} strokeWidth="1.5" opacity=".5" />
      <line x1="21" y1="22" x2="27" y2="18" stroke={c || ACCENT} strokeWidth="1" opacity=".4" />
      <line x1="21" y1="26" x2="27" y2="30" stroke={c || ACCENT} strokeWidth="1" opacity=".4" />
    </svg>
  ),
  currency: (s, c) => (
    <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="14" stroke={c || ACCENT} strokeWidth="1.5" opacity=".3" />
      <path d="M24 14v20M19 17h7.5a3.5 3.5 0 110 7H19m0 0h8a3.5 3.5 0 110 7H19" stroke={c || ACCENT} strokeWidth="1.5" strokeLinecap="round" opacity=".7" />
    </svg>
  ),
  networking: (s, c) => (
    <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      {[[24,12],[12,32],[36,32]].map(([cx,cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="5" fill={c || ACCENT} opacity={0.3 + i * 0.15} />
      ))}
      <line x1="24" y1="17" x2="12" y2="27" stroke={c || ACCENT} strokeWidth="1" opacity=".3" />
      <line x1="24" y1="17" x2="36" y2="27" stroke={c || ACCENT} strokeWidth="1" opacity=".3" />
      <line x1="12" y1="32" x2="36" y2="32" stroke={c || ACCENT} strokeWidth="1" opacity=".3" />
    </svg>
  ),
};

function getProductIcon(product, size = 40) {
  const specific = iconMap[product.id];
  if (specific) return specific(size);
  const cat = categoryIcons[product.category];
  if (cat) return cat(size, PROVIDERS[product.provider]?.color);
  return <div style={{ width: size, height: size, background: "rgba(47,168,220,0.12)", borderRadius: 8 }} />;
}

// ─── Animations ───────────────────────────────────────────────────────────────
const AnimStyles = () => (
  <style>{`
    @keyframes mp-spin  { to { transform: rotate(360deg) } }
    @keyframes mp-pulse { 0%,100% { opacity: .3 } 50% { opacity: 1 } }
    @keyframes mp-float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-3px) } }
    .expand-enter { max-height: 0; opacity: 0; overflow: hidden; transition: max-height 0.3s ease, opacity 0.2s ease; }
    .expand-active { max-height: 1400px; opacity: 1; overflow: hidden; transition: max-height 0.4s ease, opacity 0.2s ease 0.08s; }
  `}</style>
);

// ─── Small shared components ──────────────────────────────────────────────────
const ChevronIcon = ({ expanded }) => (
  <svg className={`w-4 h-4 text-gray-500 transition-transform duration-200 flex-shrink-0 ${expanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

const PricingBadge = ({ pricing }) => {
  const colors = {
    free:     { bg: "rgba(52,211,153,0.12)", text: "#34d399", border: "rgba(52,211,153,0.2)" },
    freemium: { bg: "rgba(52,211,153,0.08)", text: "#6ee7b7", border: "rgba(52,211,153,0.15)" },
    earn:     { bg: `rgba(47,168,220,0.12)`, text: ACCENT, border: `rgba(47,168,220,0.2)` },
    paid:     { bg: "rgba(251,191,36,0.1)", text: "#fbbf24", border: "rgba(251,191,36,0.2)" },
    contact:  { bg: "rgba(156,163,175,0.12)", text: "#9ca3af", border: "rgba(156,163,175,0.2)" },
  };
  const c = colors[pricing.type] ?? colors.contact;
  return (
    <span style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}
      className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full tracking-wide uppercase">
      {pricing.label}
    </span>
  );
};

const StatusBadge = ({ status }) => {
  if (status === "available") return null;
  return (
    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider ${
      status === "beta" ? "bg-yellow-400/10 text-yellow-400 border border-yellow-400/20" : "bg-gray-700 text-gray-500 border border-gray-600"
    }`}>
      {status === "beta" ? "Beta" : "Soon"}
    </span>
  );
};

const ProviderDot = ({ providerId }) => {
  const p = PROVIDERS[providerId];
  if (!p) return null;
  return (
    <span className="flex items-center gap-1.5 text-gray-500 text-[11px]">
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: p.color, opacity: 0.7 }} />
      {p.name}
    </span>
  );
};

const MyceliumSpecLine = ({ product, iconSize = 14 }) => {
  const s = product.specs;
  if (!s) return null;
  return (
    <span className="text-gray-400 text-xs" style={{ fontFamily: "monospace" }}>
      {s.cpu} · {s.ram} · {s.storage}
      {s.location && <span className="text-gray-600 ml-1.5">@ {s.location}</span>}
    </span>
  );
};

// ─── Spec Tile ───────────────────────────────────────────────────────────────
const SpecTile = ({ label, value }) => (
  <div className="rounded-xl px-3 py-2.5 border min-w-0"
    style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.07)" }}>
    <div className="text-[9px] uppercase tracking-wider mb-0.5" style={{ color: "#757980" }}>{label}</div>
    <div className="text-xs text-gray-300 font-mono truncate cursor-text select-all" title={String(value)}>{value}</div>
  </div>
);

// ─── Expanded Detail ──────────────────────────────────────────────────────────
const ExpandedDetail = ({ product }) => {
  if (product.source === "mycelium") {
    return (
      <div className="px-3 sm:px-5 pb-5 pt-2 border-t" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
        <div className="pl-0 sm:pl-14 max-w-3xl">
          <h4 className="text-gray-200 font-semibold text-sm mb-2">What happens when you click Purchase?</h4>
          <p className="text-gray-400 text-sm leading-relaxed mb-3">
            If you already have the <span className="font-medium text-gray-300">Unyt Accounting</span> application installed,
            it will open and prompt you to fund this server's Mycelium{" "}
            <span className="font-medium text-gray-300">Trickle Payment Agreement</span> by depositing HOT tokens
            equal to the monthly rate shown above.
          </p>
          <p className="text-gray-400 text-sm leading-relaxed mb-4">
            Actual billing is prorated against your real usage. Any remaining funds can be recovered if you cancel.
          </p>
          <div className="rounded-xl border p-4" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.07)" }}>
            <div className="text-[9px] uppercase tracking-wider mb-2 font-semibold" style={{ color: "#757980" }}>Billing Summary</div>
            <ul className="text-sm text-gray-400 leading-relaxed space-y-1.5 list-disc pl-5" style={{ listStyleColor: "#4a4e54" }}>
              <li>Prorated daily based on uptime reported by the peer network.</li>
              <li>No charge for host downtime.</li>
              <li>Cancel any time — remaining funds returned pro rata.</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }
  const detailText = product.longDescription ?? null;
  if (!detailText) return null;
  return (
    <div className="px-3 sm:px-5 pb-4 border-t" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
      <div className="pl-0 sm:pl-14 pt-3">
        <p className="text-gray-400 text-sm leading-relaxed">{detailText}</p>
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

// ─── Product Card ─────────────────────────────────────────────────────────────
const ProductCard = ({ product, viewMode, isExpanded, onToggle }) => {
  const isMycelium = product.source === "mycelium";
  const cardBorder = isExpanded ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.07)";
  const cardBg = isExpanded ? "#1e2124" : "#1c1e21";

  const ActionBtn = () => (
    <button
      onClick={e => { e.stopPropagation(); trackProductAction(product); }}
      className="text-xs font-semibold px-3 py-1.5 rounded-xl transition-all"
      style={{ background: "rgba(47,168,220,0.1)", color: ACCENT, border: `1px solid rgba(47,168,220,0.2)` }}
      onMouseEnter={e => { e.currentTarget.style.background = "rgba(47,168,220,0.18)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "rgba(47,168,220,0.1)"; }}
    >
      {product.action.label}
    </button>
  );

  if (viewMode === "grid") {
    return (
      <div className="group relative flex flex-col rounded-2xl border transition-all duration-200"
        style={{ background: cardBg, borderColor: cardBorder }}>
        <div className="p-5 cursor-pointer" onClick={onToggle}>
          <div className="flex items-start gap-3 mb-3">
            <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden"
              style={{ background: "rgba(255,255,255,0.04)" }}>
              {getProductIcon(product, 40)}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-gray-100 font-semibold text-sm leading-tight truncate pr-2">{product.name}</h3>
              <ProviderDot providerId={product.provider} />
            </div>
            <ChevronIcon expanded={isExpanded} />
          </div>
          <div className="mb-2"><PricingBadge pricing={product.pricing} /></div>
          {isMycelium
            ? <div className="text-xs mb-4"><MyceliumSpecLine product={product} iconSize={13} /></div>
            : <p className="text-gray-500 text-xs leading-relaxed mb-4 line-clamp-3">{product.description}</p>}
          <div className="flex items-center justify-between mt-auto pt-3 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <span className="text-[10px] px-1.5 py-0.5 rounded-lg text-gray-600"
              style={{ background: "rgba(255,255,255,0.04)" }}>{CATEGORIES[product.category]}</span>
            <span className="text-xs font-semibold" style={{ color: ACCENT }}>{product.action.label} →</span>
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
    <div className="transition-colors duration-150"
      style={{ background: isExpanded ? "#1e2124" : "transparent" }}>
      <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4 px-3 sm:px-5 py-3 sm:py-4 border-b cursor-pointer"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
        onClick={onToggle}
        onMouseEnter={e => { if (!isExpanded) e.currentTarget.parentElement.style.background = "rgba(255,255,255,0.02)"; }}
        onMouseLeave={e => { if (!isExpanded) e.currentTarget.parentElement.style.background = "transparent"; }}
      >
        <div className="hidden sm:flex shrink-0 w-10 h-10 rounded-xl items-center justify-center overflow-hidden mt-0.5"
          style={{ background: "rgba(255,255,255,0.04)" }}>
          {getProductIcon(product, 40)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-1 flex-wrap">
            <h3 className="text-gray-100 font-semibold text-[15px] leading-tight">{product.name}</h3>
            <StatusBadge status={product.status} />
            {product.specs && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-lg font-mono text-gray-600"
                style={{ background: "rgba(255,255,255,0.04)" }}>{product.specs.location}</span>
            )}
          </div>
          {isMycelium ? (
            <div className="text-sm leading-relaxed mb-2"><MyceliumSpecLine product={product} iconSize={14} /></div>
          ) : (
            <>
              <p className="text-gray-500 text-sm leading-relaxed mb-2 line-clamp-2">{product.description}</p>
              <div className="flex items-center gap-3 text-xs text-gray-600 flex-wrap">
                <ProviderDot providerId={product.provider} />
                <span>·</span>
                <span>{CATEGORIES[product.category]}</span>
                {product.specs && <><span>·</span><span className="font-mono text-gray-600">{product.specs.cpu} · {product.specs.ram}</span></>}
              </div>
            </>
          )}
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-2 sm:flex-col sm:items-end sm:gap-2 shrink-0 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <PricingBadge pricing={product.pricing} />
            <ChevronIcon expanded={isExpanded} />
          </div>
          <ActionBtn />
        </div>
      </div>
      <div className={isExpanded ? "expand-active border-b" : "expand-enter"}
        style={isExpanded ? { borderColor: "rgba(255,255,255,0.06)" } : {}}>
        {isExpanded && <ExpandedDetail product={product} />}
      </div>
    </div>
  );
};

// ─── Icons ───────────────────────────────────────────────────────────────────
const SearchIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#757980" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);
const GridIcon = ({ active }) => (
  <svg className="w-4 h-4" fill={active ? "#e2e4e6" : "#4a4e54"} viewBox="0 0 16 16">
    <path d="M1 2.5A1.5 1.5 0 012.5 1h3A1.5 1.5 0 017 2.5v3A1.5 1.5 0 015.5 7h-3A1.5 1.5 0 011 5.5v-3zm8 0A1.5 1.5 0 0110.5 1h3A1.5 1.5 0 0115 2.5v3A1.5 1.5 0 0113.5 7h-3A1.5 1.5 0 019 5.5v-3zm-8 8A1.5 1.5 0 012.5 9h3A1.5 1.5 0 017 10.5v3A1.5 1.5 0 015.5 15h-3A1.5 1.5 0 011 13.5v-3zm8 0A1.5 1.5 0 0110.5 9h3a1.5 1.5 0 011.5 1.5v3a1.5 1.5 0 01-1.5 1.5h-3A1.5 1.5 0 019 13.5v-3z" />
  </svg>
);
const ListIcon = ({ active }) => (
  <svg className="w-4 h-4" fill={active ? "#e2e4e6" : "#4a4e54"} viewBox="0 0 16 16">
    <path fillRule="evenodd" d="M2.5 12a.5.5 0 01.5-.5h10a.5.5 0 010 1H3a.5.5 0 01-.5-.5zm0-4a.5.5 0 01.5-.5h10a.5.5 0 010 1H3a.5.5 0 01-.5-.5zm0-4a.5.5 0 01.5-.5h10a.5.5 0 010 1H3a.5.5 0 01-.5-.5z" />
  </svg>
);

// ─── Main Component ───────────────────────────────────────────────────────────
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
    providerData.forEach(p => { lookup[p.id] = { ...lookup[p.id], ...p }; });
    return lookup;
  }, [providerData]);

  const allProducts = useMemo(() => [...staticProducts, ...myceliumProducts], [staticProducts, myceliumProducts]);

  const availableCountries = useMemo(() =>
    [...new Set(myceliumProducts.map(p => p.rawListing?.country).filter(Boolean))].sort(),
    [myceliumProducts]
  );

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setMyceliumLoading(true);
      setMyceliumError(null);
      try {
        const products = await getMyceliumProducts();
        if (!cancelled) { setMyceliumProducts(products); setLastUpdated(new Date()); }
      } catch (err) {
        if (!cancelled) setMyceliumError(err.message || "Failed to load listings");
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
        e.preventDefault(); searchRef.current?.focus();
      }
      if (e.key === "Escape" && expandedId) setExpandedId(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [expandedId]);

  const toggleExpand = useCallback((id) => {
    setExpandedId(prev => {
      const newId = prev === id ? null : id;
      if (newId) { const product = allProducts.find(p => p.id === id); if (product) trackProductView(product); }
      return newId;
    });
  }, [allProducts]);

  const toggleFilter = (set, setFn, value) => {
    const next = new Set(set);
    next.has(value) ? next.delete(value) : next.add(value);
    setFn(next);
  };

  const activeFilterCount = selectedProviders.size + selectedCategories.size + selectedPricing.size
    + selectedCountries.size + (minCPU > 0 ? 1 : 0) + (minRAMGB > 0 ? 1 : 0) + (minStorageGB > 0 ? 1 : 0);

  const clearAll = () => {
    setSelectedProviders(new Set()); setSelectedCategories(new Set());
    setSelectedPricing(new Set()); setSelectedCountries(new Set());
    setMinCPU(0); setMinRAMGB(0); setMinStorageGB(0);
  };

  const filtered = useMemo(() => {
    let items = allProducts.filter(p => {
      if (!fuzzyMatch(`${p.name} ${p.description} ${PROVIDERS[p.provider]?.name || ''} ${p.tags.join(" ")}`, search)) return false;
      if (selectedProviders.size && !selectedProviders.has(p.provider)) return false;
      if (selectedCategories.size && !selectedCategories.has(p.category)) return false;
      if (selectedPricing.size) {
        const pt = p.pricing.type;
        const match = (selectedPricing.has("free") && (pt === "free" || pt === "freemium"))
          || (selectedPricing.has("earn") && pt === "earn")
          || (selectedPricing.has("paid") && (pt === "paid" || pt === "contact"));
        if (!match) return false;
      }
      if (selectedCountries.size) {
        if (p.source !== "mycelium" || !p.rawListing) return false;
        if (!selectedCountries.has(p.rawListing.country)) return false;
      }
      if (p.source === "mycelium" && p.rawListing) {
        const r = p.rawListing;
        if (minCPU > 0 && (r.total_resources?.cru || 0) < minCPU) return false;
        if (minRAMGB > 0 && bytesToGB(r.total_resources?.mru || 0) < minRAMGB) return false;
        if (minStorageGB > 0 && bytesToGB(r.total_resources?.sru || 0) < minStorageGB) return false;
      }
      return true;
    });
    switch (sortBy) {
      case "name":       items.sort((a, b) => a.name.localeCompare(b.name)); break;
      case "price_low":  items.sort((a, b) => getPricingSort(a) - getPricingSort(b)); break;
      case "price_high": items.sort((a, b) => getPricingSort(b) - getPricingSort(a)); break;
      case "provider":   items.sort((a, b) => (PROVIDERS[a.provider]?.name || '').localeCompare(PROVIDERS[b.provider]?.name || '')); break;
      default:           items.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0)); break;
    }
    return items;
  }, [allProducts, search, selectedProviders, selectedCategories, selectedPricing, selectedCountries, sortBy, minCPU, minRAMGB, minStorageGB]);

  // ─── Filter Sidebar ───────────────────────────────────────────────────────
  const FilterSection = ({ title, children }) => (
    <div className="mb-6">
      <div className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: "#4a4e54" }}>{title}</div>
      {children}
    </div>
  );

  const FilterChip = ({ label, active, onClick }) => (
    <button onClick={onClick}
      className="text-xs px-2.5 py-1 rounded-xl mb-1.5 mr-1.5 transition-all font-medium"
      style={{
        background: active ? `rgba(47,168,220,0.14)` : "rgba(255,255,255,0.04)",
        color: active ? ACCENT : "#6b7280",
        border: `1px solid ${active ? "rgba(47,168,220,0.3)" : "rgba(255,255,255,0.07)"}`,
      }}
    >
      {label}
    </button>
  );

  const SliderInput = ({ label, value, min, max, step, onChange, format }) => (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs text-gray-500">{label}</span>
        <span className="text-xs font-mono" style={{ color: value > min ? ACCENT : "#4a4e54" }}>
          {value > min ? format(value) : "Any"}
        </span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{ accentColor: ACCENT, background: `linear-gradient(to right, ${ACCENT} 0%, ${ACCENT} ${((value - min) / (max - min)) * 100}%, rgba(255,255,255,0.1) ${((value - min) / (max - min)) * 100}%, rgba(255,255,255,0.1) 100%)` }}
      />
    </div>
  );

  const FilterSidebar = () => (
    <div>
      {activeFilterCount > 0 && (
        <button onClick={clearAll} className="text-xs mb-4 transition-colors font-semibold"
          style={{ color: ACCENT }}>
          Clear all ({activeFilterCount})
        </button>
      )}

      <FilterSection title="Pricing">
        <FilterChip label="Free / Freemium" active={selectedPricing.has("free")}
          onClick={() => { toggleFilter(selectedPricing, setSelectedPricing, "free"); trackFilterApplied("pricing", "free", activeFilterCount); }} />
        <FilterChip label="Get Paid" active={selectedPricing.has("earn")}
          onClick={() => { toggleFilter(selectedPricing, setSelectedPricing, "earn"); trackFilterApplied("pricing", "earn", activeFilterCount); }} />
        <FilterChip label="Paid" active={selectedPricing.has("paid")}
          onClick={() => { toggleFilter(selectedPricing, setSelectedPricing, "paid"); trackFilterApplied("pricing", "paid", activeFilterCount); }} />
      </FilterSection>

      <FilterSection title="Provider">
        {Object.entries(PROVIDERS).map(([id, p]) => (
          <FilterChip key={id} label={p.name} active={selectedProviders.has(id)}
            onClick={() => { toggleFilter(selectedProviders, setSelectedProviders, id); trackFilterApplied("provider", id, activeFilterCount); }} />
        ))}
        {expandedProviderId && providerData.length > 0 && (() => {
          const prov = providerData.find(p => p.id === expandedProviderId);
          if (!prov) return null;
          return (
            <div className="mt-2 p-3 rounded-xl text-xs text-gray-500 border"
              style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.07)" }}>
              {prov.description && <p className="mb-2 leading-relaxed">{prov.description}</p>}
              {prov.website && (
                <a href={prov.website} target="_blank" rel="noopener noreferrer"
                  className="font-semibold transition-colors"
                  style={{ color: ACCENT }}
                  onClick={() => trackExternalLinkClick(prov.website, "provider_website")}>
                  Visit site →
                </a>
              )}
            </div>
          );
        })()}
      </FilterSection>

      <FilterSection title="Category">
        {Object.entries(CATEGORIES).map(([id, label]) => (
          <FilterChip key={id} label={label} active={selectedCategories.has(id)}
            onClick={() => { toggleFilter(selectedCategories, setSelectedCategories, id); trackFilterApplied("category", id, activeFilterCount); }} />
        ))}
      </FilterSection>

      {myceliumProducts.length > 0 && (
        <FilterSection title="Mycelium Nodes">
          <SliderInput label="Min vCPU" value={minCPU} min={0} max={32} step={1}
            onChange={setMinCPU} format={v => `${v}+`} />
          <SliderInput label="Min RAM" value={minRAMGB} min={0} max={128} step={4}
            onChange={setMinRAMGB} format={v => `${v}+ GB`} />
          <SliderInput label="Min SSD" value={minStorageGB} min={0} max={2048} step={64}
            onChange={setMinStorageGB} format={v => `${v}+ GB`} />
          {availableCountries.length > 0 && (
            <div className="mt-3">
              <div className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "#4a4e54" }}>Location</div>
              <div className="flex flex-wrap">
                {availableCountries.map(c => (
                  <FilterChip key={c} label={c} active={selectedCountries.has(c)}
                    onClick={() => toggleFilter(selectedCountries, setSelectedCountries, c)} />
                ))}
              </div>
            </div>
          )}
        </FilterSection>
      )}
    </div>
  );

  const base = typeof window !== "undefined"
    ? (document.querySelector("base")?.href?.replace(window.location.origin, "") ?? "/")
    : "/";

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: "#131416", color: "#e2e4e6", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <AnimStyles />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b backdrop-blur-md"
        style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(19,20,22,0.9)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={`${base}holo-mark.svg`} alt="Holo" className="w-7 h-7 grayscale opacity-60" />
            <span className="font-semibold text-lg tracking-tight text-gray-100">Marketplace</span>
          </div>
          <nav className="flex items-center gap-5 text-sm">
            <a href={base} className="transition-colors" style={{ color: "#757980" }}
              onMouseEnter={e => e.currentTarget.style.color = "#e2e4e6"}
              onMouseLeave={e => e.currentTarget.style.color = "#757980"}>
              Choose Decent
            </a>
            <a href={`${base}products`} className="font-semibold text-gray-100">Products</a>
            <a href="#" className="hidden sm:inline transition-colors" style={{ color: "#757980" }}
              onMouseEnter={e => e.currentTarget.style.color = "#e2e4e6"}
              onMouseLeave={e => e.currentTarget.style.color = "#757980"}>
              Docs
            </a>
          </nav>
        </div>
      </header>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 sm:pt-8 pb-16 sm:pb-20">

        {/* Toolbar */}
        <div className="mb-5 sm:mb-7">
          <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1 text-gray-100">Products</h1>
              <p className="text-sm" style={{ color: "#757980" }}>
                {allProducts.length} listing{allProducts.length !== 1 ? "s" : ""} across the ecosystem
                {myceliumProducts.length > 0 && (
                  <span className="ml-2" style={{ color: "#34d399" }}>
                    · {myceliumProducts.length} Mycelium node{myceliumProducts.length !== 1 ? "s" : ""}
                    {lastUpdated && <span style={{ color: "#4a4e54" }}> · updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex gap-2 sm:gap-3 flex-wrap items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-[180px]">
              <div className="absolute left-3 top-1/2 -translate-y-1/2"><SearchIcon /></div>
              <input
                ref={searchRef}
                type="text"
                placeholder="Search products…"
                value={search}
                onChange={e => {
                  setSearch(e.target.value);
                  clearTimeout(searchTimerRef.current);
                  searchTimerRef.current = setTimeout(() => {
                    if (e.target.value.trim().length > 1) trackSearch(e.target.value.trim(), filtered.length);
                  }, 800);
                }}
                className="w-full h-10 pl-9 pr-3 rounded-xl text-sm focus:outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.09)",
                  color: "#e2e4e6",
                }}
                onFocus={e => { e.currentTarget.style.borderColor = `rgba(47,168,220,0.35)`; }}
                onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)"; }}
              />
            </div>

            {/* Mobile filters toggle */}
            <button
              onClick={() => setShowMobileFilters(v => !v)}
              className="sm:hidden h-10 px-3 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-all"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "#9ca3af" }}
            >
              Filters{activeFilterCount > 0 && <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: "rgba(47,168,220,0.2)", color: ACCENT }}>{activeFilterCount}</span>}
            </button>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={e => { setSortBy(e.target.value); trackSortChanged(e.target.value); }}
              className="h-10 px-3 pr-8 rounded-xl text-sm focus:outline-none appearance-none cursor-pointer transition-all"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.09)",
                color: "#9ca3af",
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%234a4e54' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 01.753 1.659l-4.796 5.48a1 1 0 01-1.506 0z'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 10px center",
              }}
            >
              <option value="featured">Featured</option>
              <option value="name">Name A–Z</option>
              <option value="price_low">Price: Low → High</option>
              <option value="price_high">Price: High → Low</option>
              <option value="provider">Provider</option>
            </select>

            {/* Grid / list toggle */}
            <div className="hidden sm:flex items-center rounded-xl overflow-hidden border"
              style={{ borderColor: "rgba(255,255,255,0.09)" }}>
              <button onClick={() => { setViewMode("grid"); trackViewModeChanged("grid"); }}
                className="p-2.5 transition-colors"
                style={{ background: viewMode === "grid" ? "rgba(255,255,255,0.08)" : "transparent" }}>
                <GridIcon active={viewMode === "grid"} />
              </button>
              <button onClick={() => { setViewMode("list"); trackViewModeChanged("list"); }}
                className="p-2.5 transition-colors"
                style={{ background: viewMode === "list" ? "rgba(255,255,255,0.08)" : "transparent" }}>
                <ListIcon active={viewMode === "list"} />
              </button>
            </div>
          </div>

          {/* Mobile filters panel */}
          {showMobileFilters && (
            <div className="sm:hidden mt-4 p-4 rounded-2xl border"
              style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.07)" }}>
              <FilterSidebar />
            </div>
          )}
        </div>

        {/* Main layout */}
        <div className="flex gap-6 sm:gap-10">
          {/* Sidebar — desktop */}
          <aside className="hidden sm:block w-44 shrink-0">
            <div className="sticky top-20 h-[calc(100vh-6rem)] overflow-y-auto pr-1">
              <FilterSidebar />
            </div>
          </aside>

          {/* Product list */}
          <div className="flex-1 min-w-0">
            {myceliumLoading && myceliumProducts.length === 0 && (
              <div className="flex items-center gap-2 text-sm mb-4" style={{ color: "#757980" }}>
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#34d399" }} />
                Loading Mycelium listings…
              </div>
            )}

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: "rgba(255,255,255,0.04)" }}>
                  <SearchIcon />
                </div>
                <p className="text-sm mb-1" style={{ color: "#757980" }}>No products match your filters</p>
                <button onClick={clearAll} className="text-xs mt-2 font-semibold transition-colors" style={{ color: ACCENT }}>
                  Clear all filters
                </button>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {filtered.map(product => (
                  <ProductCard key={product.id} product={product} viewMode="grid"
                    isExpanded={expandedId === product.id} onToggle={() => toggleExpand(product.id)} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border overflow-hidden"
                style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                {filtered.map(product => (
                  <ProductCard key={product.id} product={product} viewMode="list"
                    isExpanded={expandedId === product.id} onToggle={() => toggleExpand(product.id)} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
