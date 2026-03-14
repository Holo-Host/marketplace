import { useState, useMemo, useRef, useEffect, useCallback } from "react";

// --- PROVIDER DISPLAY CONFIG ---
const PROVIDERS = {
  holo: { id: "holo", name: "Holo", color: "#22d3ee" },
  holochain: { id: "holochain", name: "Holochain Foundation", color: "#a78bfa" },
  unyt: { id: "unyt", name: "Unyt", color: "#f472b6" },
  coasys: { id: "coasys", name: "Coasys / AD4M", color: "#fb923c" },
  mycelium: { id: "mycelium", name: "Mycelium", color: "#4ade80" },
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

// --- SIMULATED MYCELIUM DATA ---
function getMyceliumProducts() {
  return [
    {
      id: "mycelium-vps-fra-01", name: "Frankfurt Standard VPS", provider: "mycelium", source: "mycelium",
      description: "4 vCPU \u00b7 8GB RAM \u00b7 160GB NVMe \u00b7 5TB bandwidth. Hosted in Frankfurt, DE with 99.95% SLA.",
      longDescription: "A general-purpose VPS provisioned on the Mycelium decentralized hosting network. Located in Frankfurt, Germany with Tier III datacenter redundancy. Includes automated backups, DDoS protection, and 99.95% uptime SLA. Provisioned instantly via the Unyt application.",
      tags: ["vps", "europe", "hosting"], category: "infrastructure", status: "available",
      pricing: { type: "paid", amount: 24, label: "$24/mo" },
      action: { type: "unyt_app", label: "Provision" },
      specs: { cpu: "4 vCPU", ram: "8GB", storage: "160GB NVMe", bandwidth: "5TB", location: "Frankfurt, DE", rating: 4.8 },
      featured: false,
    },
    {
      id: "mycelium-vps-nyc-01", name: "NYC Performance VPS", provider: "mycelium", source: "mycelium",
      description: "8 vCPU \u00b7 16GB RAM \u00b7 320GB NVMe \u00b7 10TB bandwidth. Hosted in New York, US with dedicated resources.",
      tags: ["vps", "us-east", "hosting", "performance"], category: "infrastructure", status: "available",
      pricing: { type: "paid", amount: 48, label: "$48/mo" },
      action: { type: "unyt_app", label: "Provision" },
      specs: { cpu: "8 vCPU", ram: "16GB", storage: "320GB NVMe", bandwidth: "10TB", location: "New York, US", rating: 4.9 },
      featured: false,
    },
    {
      id: "mycelium-vps-sgp-01", name: "Singapore Starter VPS", provider: "mycelium", source: "mycelium",
      description: "2 vCPU \u00b7 4GB RAM \u00b7 80GB NVMe \u00b7 3TB bandwidth. Low-latency APAC connections.",
      tags: ["vps", "asia", "hosting", "starter"], category: "infrastructure", status: "available",
      pricing: { type: "paid", amount: 12, label: "$12/mo" },
      action: { type: "unyt_app", label: "Provision" },
      specs: { cpu: "2 vCPU", ram: "4GB", storage: "80GB NVMe", bandwidth: "3TB", location: "Singapore", rating: 4.6 },
      featured: false,
    },
    {
      id: "mycelium-hero-ai", name: "Hero AI Agent", provider: "mycelium", source: "mycelium",
      description: "Deploy a Hero AI agent on Mycelium infrastructure. Autonomous task execution on decentralized compute.",
      longDescription: "Hero AI Agents run on Mycelium\u2019s decentralized compute network with verifiable outputs. They can execute multi-step tasks, use tools, and reason over complex problems \u2014 all while producing a cryptographic proof of computation that can be independently verified.",
      tags: ["ai", "agents", "compute"], category: "ai", status: "beta",
      pricing: { type: "paid", label: "Usage-based" },
      action: { type: "unyt_app", label: "Deploy Agent" },
      featured: true,
    },
  ];
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
    .expand-active { max-height: 600px; opacity: 1; overflow: hidden; transition: max-height 0.3s ease, opacity 0.2s ease 0.1s; }
  `}</style>
);

const iconMap = {
  "holo-edge-hosting": (s) => (
    <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      <defs><linearGradient id="gh1" x1="0" y1="0" x2="48" y2="48"><stop stopColor="#22d3ee" /><stop offset="1" stopColor="#0891b2" /></linearGradient></defs>
      <rect x="8" y="12" width="32" height="8" rx="2" fill="url(#gh1)" opacity=".25" />
      <rect x="8" y="22" width="32" height="8" rx="2" fill="url(#gh1)" opacity=".45" />
      <rect x="8" y="32" width="32" height="8" rx="2" fill="url(#gh1)" opacity=".7" />
      <circle cx="34" cy="16" r="2" fill="#22d3ee" style={{ animation: "mp-pulse 2s ease-in-out infinite" }} />
      <circle cx="34" cy="26" r="2" fill="#22d3ee" style={{ animation: "mp-pulse 2s ease-in-out infinite .5s" }} />
      <circle cx="34" cy="36" r="2" fill="#22d3ee" style={{ animation: "mp-pulse 2s ease-in-out infinite 1s" }} />
    </svg>
  ),
  "holo-linker-relay": (s) => (
    <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="4" fill="#22d3ee" style={{ animation: "mp-pulse 2.5s ease-in-out infinite" }} />
      {[[12,12],[36,12],[12,36],[36,36]].map(([x,y], i) => (
        <g key={i}><circle cx={x} cy={y} r="3" fill="#22d3ee" opacity=".6" />
        <line x1="24" y1="24" x2={x} y2={y} stroke="#22d3ee" strokeWidth="1" opacity=".4" strokeDasharray="3 3" style={{ animation: `mp-dash 1.5s linear infinite ${i*0.3}s` }} /></g>
      ))}
    </svg>
  ),
  "holo-host-happ": (s) => (
    <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      <rect x="10" y="8" width="28" height="32" rx="3" stroke="#22d3ee" strokeWidth="1.5" opacity=".5" />
      <rect x="14" y="14" width="14" height="3" rx="1" fill="#22d3ee" opacity=".4" />
      <rect x="14" y="20" width="20" height="3" rx="1" fill="#22d3ee" opacity=".3" />
      <path d="M30 34 L34 38 L42 28" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "mp-pulse 2s ease-in-out infinite" }} />
    </svg>
  ),
  "holo-mewsfeed": (s) => (
    <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      <circle cx="16" cy="20" r="6" stroke="#22d3ee" strokeWidth="1.5" opacity=".6" />
      <circle cx="32" cy="20" r="6" stroke="#22d3ee" strokeWidth="1.5" opacity=".6" />
      <circle cx="24" cy="34" r="6" stroke="#22d3ee" strokeWidth="1.5" opacity=".6" />
      <circle cx="16" cy="20" r="2" fill="#22d3ee" style={{ animation: "mp-pulse 3s ease-in-out infinite" }} />
      <circle cx="32" cy="20" r="2" fill="#22d3ee" style={{ animation: "mp-pulse 3s ease-in-out infinite 1s" }} />
      <circle cx="24" cy="34" r="2" fill="#22d3ee" style={{ animation: "mp-pulse 3s ease-in-out infinite 2s" }} />
    </svg>
  ),
  "holochain-wind-tunnel": (s) => (
    <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      <defs><linearGradient id="gwt" x1="0" y1="24" x2="48" y2="24"><stop stopColor="#a78bfa" /><stop offset="1" stopColor="#7c3aed" /></linearGradient></defs>
      {[0,1,2,3,4].map(i => (
        <rect key={i} x={8+i*7} y={14+Math.abs(i-2)*4} width="5" height={20-Math.abs(i-2)*8} rx="2" fill="url(#gwt)" opacity={0.3+i*0.15}
          style={{ transformOrigin: `${10.5+i*7}px 24px`, animation: `mp-wave 1.2s ease-in-out infinite ${i*0.15}s` }} />
      ))}
    </svg>
  ),
  "holochain-moss": (s) => (
    <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      {[[8,8],[26,8],[8,26],[26,26]].map(([x,y], i) => (
        <rect key={i} x={x} y={y} width="14" height="14" rx="3" stroke="#a78bfa" strokeWidth="1.5" opacity=".5" style={{ animation: `mp-float 3s ease-in-out infinite ${i*0.5}s` }} />
      ))}
    </svg>
  ),
  "unyt-circulo": (s) => (
    <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="14" stroke="#f472b6" strokeWidth="1.5" opacity=".3" />
      <circle cx="24" cy="24" r="10" stroke="#f472b6" strokeWidth="1.5" opacity=".5" />
      <g style={{ transformOrigin: "24px 24px", animation: "mp-spin 8s linear infinite" }}><circle cx="24" cy="10" r="3" fill="#f472b6" opacity=".8" /></g>
      <text x="24" y="28" textAnchor="middle" fill="#f472b6" fontSize="12" fontWeight="600" opacity=".8">$</text>
    </svg>
  ),
  "unyt-interflow": (s) => (
    <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      <path d="M8 24 Q16 10 24 24 Q32 38 40 24" stroke="#f472b6" strokeWidth="1.5" fill="none" opacity=".4" strokeDasharray="4 3" style={{ animation: "mp-dash 2s linear infinite" }} />
      <path d="M8 24 Q16 38 24 24 Q32 10 40 24" stroke="#f472b6" strokeWidth="1.5" fill="none" opacity=".4" strokeDasharray="4 3" style={{ animation: "mp-dash 2s linear infinite reverse" }} />
      <circle cx="24" cy="24" r="4" fill="#f472b6" style={{ animation: "mp-pulse 2s ease-in-out infinite" }} />
    </svg>
  ),
  "unyt-hot402": (s) => (
    <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      <rect x="10" y="14" width="28" height="20" rx="4" stroke="#f472b6" strokeWidth="1.5" opacity=".5" />
      <circle cx="24" cy="24" r="6" stroke="#f472b6" strokeWidth="1.5" opacity=".6" />
      <path d="M22 22 L26 22 L24 26 Z" fill="#f472b6" opacity=".8" style={{ animation: "mp-pulse 1.5s ease-in-out infinite" }} />
    </svg>
  ),
  "unyt-depin-accounting": (s) => (
    <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      <rect x="10" y="10" width="28" height="28" rx="3" stroke="#f472b6" strokeWidth="1.5" opacity=".3" />
      <line x1="10" y1="18" x2="38" y2="18" stroke="#f472b6" strokeWidth="1" opacity=".3" />
      <line x1="22" y1="18" x2="22" y2="38" stroke="#f472b6" strokeWidth="1" opacity=".3" />
      {[0,1,2].map(i => (
        <rect key={i} x={24} y={22+i*6} width={12-i*3} height="3" rx="1" fill="#f472b6" opacity={0.6-i*0.15} style={{ animation: `mp-pulse 2s ease-in-out infinite ${i*0.4}s` }} />
      ))}
    </svg>
  ),
  "coasys-ad4m-nodes": (s) => (
    <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      <g style={{ transformOrigin: "24px 24px", animation: "mp-spin 12s linear infinite" }}>
        <circle cx="24" cy="10" r="3" fill="#fb923c" opacity=".7" />
        <circle cx="36" cy="30" r="3" fill="#fb923c" opacity=".5" />
        <circle cx="12" cy="30" r="3" fill="#fb923c" opacity=".6" />
        <line x1="24" y1="10" x2="36" y2="30" stroke="#fb923c" strokeWidth="1" opacity=".3" />
        <line x1="36" y1="30" x2="12" y2="30" stroke="#fb923c" strokeWidth="1" opacity=".3" />
        <line x1="12" y1="30" x2="24" y2="10" stroke="#fb923c" strokeWidth="1" opacity=".3" />
      </g>
      <circle cx="24" cy="24" r="4" fill="#fb923c" style={{ animation: "mp-pulse 2s ease-in-out infinite" }} />
    </svg>
  ),
  "coasys-synergy-credits": (s) => (
    <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="14" stroke="#fb923c" strokeWidth="1.5" strokeDasharray="6 4" style={{ transformOrigin: "24px 24px", animation: "mp-spin 10s linear infinite" }} />
      {[[18,20,0],[30,20,0.8],[24,30,1.6]].map(([cx,cy,d], i) => (
        <circle key={i} cx={cx} cy={cy} r="3" fill="#fb923c" opacity=".5" style={{ animation: `mp-float 2.5s ease-in-out infinite ${d}s` }} />
      ))}
    </svg>
  ),
};

const categoryIcons = {
  infrastructure: (s, color) => (
    <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      <rect x="8" y="28" width="10" height="12" rx="2" fill={color} opacity=".3" />
      <rect x="20" y="20" width="10" height="20" rx="2" fill={color} opacity=".45" />
      <rect x="32" y="14" width="10" height="26" rx="2" fill={color} opacity=".6" />
      <circle cx="37" cy="18" r="1.5" fill={color} style={{ animation: "mp-pulse 2s ease-in-out infinite" }} />
    </svg>
  ),
  ai: (s, color) => (
    <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="12" stroke={color} strokeWidth="1.5" opacity=".3" />
      <circle cx="24" cy="24" r="6" stroke={color} strokeWidth="1.5" opacity=".5" style={{ transformOrigin: "24px 24px", animation: "mp-spin 6s linear infinite" }} />
      <circle cx="24" cy="18" r="2" fill={color} opacity=".7" style={{ animation: "mp-pulse 1.5s ease-in-out infinite" }} />
    </svg>
  ),
};

function getProductIcon(product, size = 40) {
  if (iconMap[product.id]) return iconMap[product.id](size);
  const provColor = PROVIDERS[product.provider]?.color || "#6b7280";
  const fallback = categoryIcons[product.category];
  if (fallback) return fallback(size, provColor);
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="8" stroke={provColor} strokeWidth="1.5" opacity=".4" />
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
    free: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    earn: "bg-green-500/15 text-green-300 border-green-500/20",
    freemium: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
    paid: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    contact: "bg-slate-500/15 text-slate-400 border-slate-500/20",
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
  const s = { beta: "bg-violet-500/15 text-violet-400 border-violet-500/20", coming_soon: "bg-gray-500/15 text-gray-400 border-gray-500/20" };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${s[status]}`}>{status === "beta" ? "Beta" : "Coming Soon"}</span>;
};

const ProviderDot = ({ providerId }) => {
  const prov = PROVIDERS[providerId];
  if (!prov) return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
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
  <svg className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

// --- EXPANDED DETAIL PANEL ---
const ExpandedDetail = ({ product }) => {
  const detailText = product.longDescription || null;
  if (!detailText) return null;

  return (
    <div className="px-5 pb-4">
      <div className="pl-14 pr-2">
        <p className="text-gray-300 text-sm leading-relaxed">{detailText}</p>
        {product.specs && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
            {[
              ["CPU", product.specs.cpu],
              ["RAM", product.specs.ram],
              ["Storage", product.specs.storage],
              product.specs.bandwidth ? ["Bandwidth", product.specs.bandwidth] : null,
            ].filter(Boolean).map(([label, value]) => (
              <div key={label} className="bg-gray-900/50 rounded px-2.5 py-1.5">
                <div className="text-[10px] uppercase tracking-wider text-gray-500">{label}</div>
                <div className="text-xs text-white font-mono">{value}</div>
              </div>
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
      <div className={`group relative flex flex-col rounded-xl border transition-all duration-200 ${isExpanded ? "border-gray-700 bg-gray-900/80" : "border-gray-800/80 bg-gray-900/50 hover:border-gray-700 hover:bg-gray-900/80"}`}>
        <div className="p-5 cursor-pointer" onClick={onToggle}>
          <div className="flex items-start gap-3 mb-3">
            <div className="shrink-0 w-10 h-10 rounded-lg bg-gray-800/60 flex items-center justify-center overflow-hidden">
              {getProductIcon(product, 40)}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold text-sm leading-tight truncate pr-2">{product.name}</h3>
              <ProviderDot providerId={product.provider} />
            </div>
            <ChevronIcon expanded={isExpanded} />
          </div>
          <div className="mb-2"><PricingBadge pricing={product.pricing} /></div>
          <p className="text-gray-400 text-xs leading-relaxed mb-4 flex-1 line-clamp-3">{product.description}</p>
          <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-800/60">
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-500">{CATEGORIES[product.category]}</span>
            <span className="text-xs font-medium text-cyan-400">{product.action.label} &rarr;</span>
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
    <div className={`transition-colors duration-150 ${isExpanded ? "bg-gray-900/50" : "hover:bg-gray-900/40"}`}>
      <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 px-5 py-4 border-b border-gray-800/60 cursor-pointer" onClick={onToggle}>
        <div className="hidden sm:flex shrink-0 w-10 h-10 rounded-lg bg-gray-800/60 items-center justify-center overflow-hidden mt-0.5">
          {getProductIcon(product, 40)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-1 flex-wrap">
            <h3 className="text-white font-semibold text-[15px] leading-tight">{product.name}</h3>
            <StatusBadge status={product.status} />
            {product.specs && <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-500 font-mono">{product.specs.location}</span>}
          </div>
          <p className="text-gray-400 text-sm leading-relaxed mb-2 line-clamp-2">{product.description}</p>
          <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
            <ProviderDot providerId={product.provider} />
            <span>&middot;</span>
            <span>{CATEGORIES[product.category]}</span>
            {product.specs && <><span>&middot;</span><span className="font-mono">{product.specs.cpu} &middot; {product.specs.ram}</span></>}
          </div>
        </div>
        <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-2 shrink-0">
          <PricingBadge pricing={product.pricing} />
          <div className="flex items-center gap-2">
            <button className="text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white transition-all border border-gray-700/50" onClick={e => { e.stopPropagation(); }}>
              {product.action.label}
            </button>
            <ChevronIcon expanded={isExpanded} />
          </div>
        </div>
      </div>
      <div className={isExpanded ? "expand-active border-b border-gray-800/60" : "expand-enter"}>
        {isExpanded && <ExpandedDetail product={product} />}
      </div>
    </div>
  );
};

const SearchIcon = () => (
  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);
const GridIcon = ({ active }) => (
  <svg className={`w-4 h-4 ${active ? "text-white" : "text-gray-500"}`} fill="currentColor" viewBox="0 0 16 16">
    <path d="M1 2.5A1.5 1.5 0 012.5 1h3A1.5 1.5 0 017 2.5v3A1.5 1.5 0 015.5 7h-3A1.5 1.5 0 011 5.5v-3zm8 0A1.5 1.5 0 0110.5 1h3A1.5 1.5 0 0115 2.5v3A1.5 1.5 0 0113.5 7h-3A1.5 1.5 0 019 5.5v-3zm-8 8A1.5 1.5 0 012.5 9h3A1.5 1.5 0 017 10.5v3A1.5 1.5 0 015.5 15h-3A1.5 1.5 0 011 13.5v-3zm8 0A1.5 1.5 0 0110.5 9h3a1.5 1.5 0 011.5 1.5v3a1.5 1.5 0 01-1.5 1.5h-3A1.5 1.5 0 019 13.5v-3z" />
  </svg>
);
const ListIcon = ({ active }) => (
  <svg className={`w-4 h-4 ${active ? "text-white" : "text-gray-500"}`} fill="currentColor" viewBox="0 0 16 16">
    <path fillRule="evenodd" d="M2.5 12a.5.5 0 01.5-.5h10a.5.5 0 010 1H3a.5.5 0 01-.5-.5zm0-4a.5.5 0 01.5-.5h10a.5.5 0 010 1H3a.5.5 0 01-.5-.5zm0-4a.5.5 0 01.5-.5h10a.5.5 0 010 1H3a.5.5 0 01-.5-.5z" />
  </svg>
);

// --- MAIN COMPONENT ---
export default function ProductCatalog({ products: staticProducts = [] }) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("featured");
  const [viewMode, setViewMode] = useState("list");
  const [selectedProviders, setSelectedProviders] = useState(new Set());
  const [selectedCategories, setSelectedCategories] = useState(new Set());
  const [selectedPricing, setSelectedPricing] = useState(new Set());
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [myceliumProducts, setMyceliumProducts] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const searchRef = useRef(null);

  const allProducts = useMemo(() => [...staticProducts, ...myceliumProducts], [staticProducts, myceliumProducts]);

  useEffect(() => { setMyceliumProducts(getMyceliumProducts()); }, []);

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
    setExpandedId(prev => prev === id ? null : id);
  }, []);

  const toggleFilter = (set, setFn, value) => {
    const next = new Set(set);
    next.has(value) ? next.delete(value) : next.add(value);
    setFn(next);
  };

  const activeFilterCount = selectedProviders.size + selectedCategories.size + selectedPricing.size;

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
  }, [allProducts, search, sortBy, selectedProviders, selectedCategories, selectedPricing]);

  const providerCounts = useMemo(() => { const c = {}; allProducts.forEach(p => { c[p.provider] = (c[p.provider]||0)+1; }); return c; }, [allProducts]);
  const categoryCounts = useMemo(() => { const c = {}; allProducts.forEach(p => { c[p.category] = (c[p.category]||0)+1; }); return c; }, [allProducts]);
  const pricingCounts = useMemo(() => {
    const c = { free: 0, earn: 0, paid: 0 };
    allProducts.forEach(p => {
      if (p.pricing.type === "free" || p.pricing.type === "freemium") c.free++;
      if (p.pricing.type === "earn") c.earn++;
      if (p.pricing.type === "paid" || p.pricing.type === "contact") c.paid++;
    });
    return c;
  }, [allProducts]);

  const clearAll = () => { setSelectedProviders(new Set()); setSelectedCategories(new Set()); setSelectedPricing(new Set()); setSearch(""); };

  const PRICING_FILTERS = [
    { key: "free", label: "Free / Freemium" },
    { key: "earn", label: "Get Paid", description: "Earn HoloFuel by hosting" },
    { key: "paid", label: "Paid" },
  ];

  const FilterSidebar = () => (
    <div>
      <div className="mb-6">
        <h4 className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-3">Pricing</h4>
        {PRICING_FILTERS.map(pf => (
          <label key={pf.key} onClick={() => toggleFilter(selectedPricing, setSelectedPricing, pf.key)} className="flex items-center gap-2.5 py-1.5 cursor-pointer group">
            <span className={`w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0 ${selectedPricing.has(pf.key) ? (pf.key === "earn" ? "bg-green-500 border-green-500" : "bg-cyan-500 border-cyan-500") : "border-gray-600 group-hover:border-gray-500"}`}>
              {selectedPricing.has(pf.key) && <CheckIcon />}
            </span>
            <span className="flex flex-col">
              <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{pf.label}</span>
              {pf.description && <span className="text-[10px] text-gray-500 leading-tight">{pf.description}</span>}
            </span>
            <span className="text-xs text-gray-600 ml-auto">{pricingCounts[pf.key]}</span>
          </label>
        ))}
      </div>
      <div className="mb-6">
        <h4 className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-3">Provider</h4>
        {Object.values(PROVIDERS).map(prov => (
          <label key={prov.id} onClick={() => toggleFilter(selectedProviders, setSelectedProviders, prov.id)} className="flex items-center gap-2.5 py-1.5 cursor-pointer group">
            <span className={`w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0 ${selectedProviders.has(prov.id) ? "border-cyan-500" : "border-gray-600 group-hover:border-gray-500"}`} style={selectedProviders.has(prov.id) ? { backgroundColor: prov.color, borderColor: prov.color } : {}}>
              {selectedProviders.has(prov.id) && <CheckIcon />}
            </span>
            <span className="text-sm text-gray-300 group-hover:text-white transition-colors flex-1">{prov.name}</span>
            <span className="text-xs text-gray-600">{providerCounts[prov.id] || 0}</span>
          </label>
        ))}
      </div>
      <div className="mb-6">
        <h4 className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-3">Category</h4>
        {Object.entries(CATEGORIES).map(([key, label]) => (
          categoryCounts[key] ? (
            <label key={key} onClick={() => toggleFilter(selectedCategories, setSelectedCategories, key)} className="flex items-center gap-2.5 py-1.5 cursor-pointer group">
              <span className={`w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0 ${selectedCategories.has(key) ? "bg-cyan-500 border-cyan-500" : "border-gray-600 group-hover:border-gray-500"}`}>
                {selectedCategories.has(key) && <CheckIcon />}
              </span>
              <span className="text-sm text-gray-300 group-hover:text-white transition-colors flex-1">{label}</span>
              <span className="text-xs text-gray-600">{categoryCounts[key]}</span>
            </label>
          ) : null
        ))}
      </div>
      {activeFilterCount > 0 && <button onClick={clearAll} className="text-xs text-gray-500 hover:text-gray-300 underline underline-offset-2 transition-colors">Clear all filters</button>}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-100" style={{ fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif" }}>
      <AnimStyles />
      <header className="border-b border-gray-800/60 bg-[#0a0a0f]/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={`${import.meta.env.BASE_URL}holo-mark.svg`} alt="Holo" className="w-7 h-7" />
            <span className="text-white font-semibold text-lg tracking-tight">Marketplace</span>
          </div>
          <nav className="flex items-center gap-6 text-sm">
            <a href="#" className="text-white font-medium">Products</a>
            <a href="#" className="text-gray-400 hover:text-gray-200 transition-colors hidden sm:inline">Providers</a>
            <a href="#" className="text-gray-400 hover:text-gray-200 transition-colors hidden sm:inline">Docs</a>
          </nav>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-20">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-2">Products</h1>
          <p className="text-gray-400 text-sm">Decentralized hosting, tools, currencies, and infrastructure from the Holo ecosystem and partners.</p>
        </div>

        <div className="flex gap-8">
          <aside className="hidden lg:block w-56 shrink-0"><FilterSidebar /></aside>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none"><SearchIcon /></div>
                <input ref={searchRef} type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..."
                  className="w-full h-10 pl-10 pr-10 rounded-lg bg-gray-900/80 border border-gray-800 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 focus:ring-1 focus:ring-gray-600 transition-all" />
                {!search && <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none"><kbd className="text-[10px] text-gray-600 border border-gray-700 rounded px-1.5 py-0.5 font-mono">/</kbd></div>}
                {search && <button onClick={() => setSearch("")} className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-300"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>}
              </div>
              <button onClick={() => setShowMobileFilters(!showMobileFilters)} className="lg:hidden h-10 px-3 rounded-lg bg-gray-900/80 border border-gray-800 text-sm text-gray-400 hover:text-white flex items-center gap-2 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                Filters{activeFilterCount > 0 && <span className="w-4 h-4 rounded-full bg-cyan-500 text-white text-[10px] flex items-center justify-center">{activeFilterCount}</span>}
              </button>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                className="h-10 px-3 pr-8 rounded-lg bg-gray-900/80 border border-gray-800 text-sm text-gray-300 focus:outline-none focus:border-gray-600 appearance-none cursor-pointer"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%236b7280' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 01.753 1.659l-4.796 5.48a1 1 0 01-1.506 0z'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center" }}>
                <option value="featured">Featured</option>
                <option value="name">Name A-Z</option>
                <option value="price_low">Price: Low &rarr; High</option>
                <option value="price_high">Price: High &rarr; Low</option>
                <option value="provider">Provider</option>
              </select>
              <div className="hidden sm:flex items-center border border-gray-800 rounded-lg overflow-hidden">
                <button onClick={() => setViewMode("grid")} className={`p-2.5 transition-colors ${viewMode === "grid" ? "bg-gray-800" : "hover:bg-gray-800/50"}`}><GridIcon active={viewMode === "grid"} /></button>
                <button onClick={() => setViewMode("list")} className={`p-2.5 transition-colors ${viewMode === "list" ? "bg-gray-800" : "hover:bg-gray-800/50"}`}><ListIcon active={viewMode === "list"} /></button>
              </div>
            </div>

            {showMobileFilters && <div className="lg:hidden mb-4 p-4 rounded-lg bg-gray-900/80 border border-gray-800"><FilterSidebar /></div>}

            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">{filtered.length} product{filtered.length !== 1 ? "s" : ""}</span>
              {activeFilterCount > 0 && <button onClick={clearAll} className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">Clear filters</button>}
            </div>

            {viewMode === "list" ? (
              <div className="rounded-xl border border-gray-800/60 overflow-hidden bg-gray-900/20">
                {filtered.length > 0 ? filtered.map(p => (
                  <ProductCard key={p.id} product={p} viewMode="list" isExpanded={expandedId === p.id} onToggle={() => toggleExpand(p.id)} />
                )) : (
                  <div className="py-16 text-center">
                    <p className="text-gray-500 text-sm">No products match your filters.</p>
                    <button onClick={clearAll} className="mt-2 text-xs text-cyan-400 hover:text-cyan-300">Clear all filters</button>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {filtered.length > 0 ? filtered.map(p => (
                  <ProductCard key={p.id} product={p} viewMode="grid" isExpanded={expandedId === p.id} onToggle={() => toggleExpand(p.id)} />
                )) : (
                  <div className="col-span-full py-16 text-center">
                    <p className="text-gray-500 text-sm">No products match your filters.</p>
                    <button onClick={clearAll} className="mt-2 text-xs text-cyan-400 hover:text-cyan-300">Clear all filters</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
