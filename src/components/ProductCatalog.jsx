import { useState, useMemo, useRef, useEffect } from "react";

// --- DATA MODEL ---
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

// Pricing types: free, freemium, earn, paid, contact
// "earn" = Get Paid products (HoloFuel earning via hosting/nodes)
const PRODUCTS = [
  {
    id: "holo-edge-hosting",
    name: "Edge Hosting",
    provider: PROVIDERS.holo,
    description: "Run a HoloPort to host Holochain apps at the edge. Download the ISO, install on commodity hardware, and start earning HoloFuel for hosting peer-to-peer applications.",
    tags: ["hosting", "depin", "earn"],
    category: "hosting",
    status: "available",
    pricing: { type: "earn", label: "Free / Get Paid" },
    action: { label: "Download ISO", type: "download" },
    featured: true,
  },
  {
    id: "holo-linker-relay",
    name: "Host a Linker Relay",
    provider: PROVIDERS.holo,
    description: "Operate an H2HC Linker Relay node to connect Holochain peers across the network. Lightweight resource requirements, earn HoloFuel for contributing network infrastructure.",
    tags: ["networking", "depin", "earn"],
    category: "networking",
    status: "available",
    pricing: { type: "earn", label: "Free / Get Paid" },
    action: { label: "Get Started", type: "unyt_app" },
  },
  {
    id: "holo-host-happ",
    name: "Host Your hApp",
    provider: PROVIDERS.holo,
    description: "Deploy and host your Holochain application on Holo's distributed hosting network. Includes a free initial sales engineering session to get your app configured and running.",
    tags: ["hosting", "developer"],
    category: "hosting",
    status: "available",
    pricing: { type: "freemium", label: "Free / Pay Later" },
    action: { label: "Book Session", type: "contact_form" },
  },
  {
    id: "holo-mewsfeed",
    name: "Mewsfeed",
    provider: PROVIDERS.holo,
    description: "Explore fully peer-to-peer social media hosted on Holo with a browser-based light client. No servers, no surveillance, no ads \u2014 just people connecting directly.",
    tags: ["social", "p2p", "free"],
    category: "social",
    status: "available",
    pricing: { type: "free", label: "Free" },
    action: { label: "Join Now", type: "external_link" },
    featured: true,
  },
  {
    id: "holochain-wind-tunnel",
    name: "Wind Tunnel",
    provider: PROVIDERS.holochain,
    description: "Stress-test and benchmark Holochain applications at scale. Run load tests against your hApps, identify performance bottlenecks, and earn rewards for contributing test infrastructure.",
    tags: ["developer", "testing", "earn"],
    category: "developer_tools",
    status: "available",
    pricing: { type: "earn", label: "Free / Get Paid" },
    action: { label: "Get Started", type: "unyt_app" },
  },
  {
    id: "holochain-moss",
    name: "Moss Groupware",
    provider: PROVIDERS.holochain,
    description: "A modular groupware suite built natively on Holochain. Collaborative documents, task boards, chat, and more \u2014 all running peer-to-peer with no central server.",
    tags: ["collaboration", "p2p", "free"],
    category: "developer_tools",
    status: "available",
    pricing: { type: "free", label: "Free" },
    action: { label: "Download", type: "download" },
  },
  {
    id: "unyt-circulo",
    name: "Community Currency (Circulo)",
    provider: PROVIDERS.unyt,
    description: "Launch a mutual credit community currency for your local economy or organization. Configuration includes onboarding, governance templates, and integration with the Unyt network.",
    tags: ["currency", "community"],
    category: "currency",
    status: "available",
    pricing: { type: "paid", amount: 95, label: "$95 config fee" },
    action: { label: "Configure", type: "unyt_app" },
  },
  {
    id: "unyt-interflow",
    name: "Interflow Network",
    provider: PROVIDERS.unyt,
    description: "Connect your 'Decent' product to the Interflow marketplace network. If you're building decentralized tools, services, or infrastructure \u2014 this is how you get listed and discovered.",
    tags: ["networking", "marketplace"],
    category: "networking",
    status: "available",
    pricing: { type: "contact", label: "Contact Us" },
    action: { label: "Apply to Join", type: "contact_form" },
  },
  {
    id: "unyt-hot402",
    name: "Hot402 AgentPay",
    provider: PROVIDERS.unyt,
    description: "KYC-verified agent micropayments powered by HOT tokens. Enable your AI agents to transact autonomously with cryptographic identity verification and auditable payment trails.",
    tags: ["ai", "payments", "agents"],
    category: "currency",
    status: "available",
    pricing: { type: "paid", amount: 20, label: "$20 KYC fee", note: "Credited back in HOT" },
    action: { label: "Get Verified", type: "unyt_app" },
    featured: true,
  },
  {
    id: "unyt-depin-accounting",
    name: "Customized DePIN Accounting",
    provider: PROVIDERS.unyt,
    description: "Tailored accounting and reporting infrastructure for Decentralized Physical Infrastructure Networks. Track node contributions, calculate rewards, and generate compliance reports.",
    tags: ["depin", "accounting", "enterprise"],
    category: "infrastructure",
    status: "available",
    pricing: { type: "contact", label: "Custom Pricing" },
    action: { label: "Contact Sales", type: "contact_form" },
  },
  {
    id: "coasys-ad4m-nodes",
    name: "AD4M Nodes",
    provider: PROVIDERS.coasys,
    description: "Access AD4M's agent-centric distributed computing nodes. Run persistent agents, store perspectives, and connect to the semantic web of shared meaning across applications.",
    tags: ["infrastructure", "agents", "p2p"],
    category: "infrastructure",
    status: "beta",
    pricing: { type: "free", label: "Free (Beta)" },
    action: { label: "Get Access", type: "unyt_app" },
  },
  {
    id: "coasys-synergy-credits",
    name: "AI Synergy Query Credits",
    provider: PROVIDERS.coasys,
    description: "Purchase query credits for Coasys Synergy \u2014 AI-powered semantic search and reasoning across your AD4M perspectives and shared knowledge graphs.",
    tags: ["ai", "search", "knowledge"],
    category: "ai",
    status: "available",
    pricing: { type: "paid", label: "Credit Packs" },
    action: { label: "Buy Credits", type: "unyt_app" },
  },
  // Simulated Mycelium dynamic products
  {
    id: "mycelium-vps-fra-01",
    name: "Frankfurt Standard VPS",
    provider: PROVIDERS.mycelium,
    source: "mycelium",
    description: "4 vCPU \u00b7 8GB RAM \u00b7 160GB NVMe \u00b7 5TB bandwidth. Hosted in Frankfurt, DE with 99.95% SLA. Provisioned automatically via Mycelium network.",
    tags: ["vps", "europe", "hosting"],
    category: "infrastructure",
    status: "available",
    pricing: { type: "paid", amount: 24, label: "$24/mo" },
    action: { label: "Provision", type: "unyt_app" },
    specs: { cpu: "4 vCPU", ram: "8GB", storage: "160GB NVMe", location: "Frankfurt, DE", rating: 4.8 },
  },
  {
    id: "mycelium-vps-nyc-01",
    name: "NYC Performance VPS",
    provider: PROVIDERS.mycelium,
    source: "mycelium",
    description: "8 vCPU \u00b7 16GB RAM \u00b7 320GB NVMe \u00b7 10TB bandwidth. Hosted in New York, US with dedicated resources and priority support.",
    tags: ["vps", "us-east", "hosting", "performance"],
    category: "infrastructure",
    status: "available",
    pricing: { type: "paid", amount: 48, label: "$48/mo" },
    action: { label: "Provision", type: "unyt_app" },
    specs: { cpu: "8 vCPU", ram: "16GB", storage: "320GB NVMe", location: "New York, US", rating: 4.9 },
  },
  {
    id: "mycelium-vps-sgp-01",
    name: "Singapore Starter VPS",
    provider: PROVIDERS.mycelium,
    source: "mycelium",
    description: "2 vCPU \u00b7 4GB RAM \u00b7 80GB NVMe \u00b7 3TB bandwidth. Hosted in Singapore with low-latency connections across Asia-Pacific.",
    tags: ["vps", "asia", "hosting", "starter"],
    category: "infrastructure",
    status: "available",
    pricing: { type: "paid", amount: 12, label: "$12/mo" },
    action: { label: "Provision", type: "unyt_app" },
    specs: { cpu: "2 vCPU", ram: "4GB", storage: "80GB NVMe", location: "Singapore", rating: 4.6 },
  },
  {
    id: "mycelium-hero-ai",
    name: "Hero AI Agent",
    provider: PROVIDERS.mycelium,
    source: "mycelium",
    description: "Deploy a Hero AI agent on Mycelium infrastructure. Autonomous task execution, tool use, and reasoning \u2014 running on decentralized compute with verifiable outputs.",
    tags: ["ai", "agents", "compute"],
    category: "ai",
    status: "beta",
    pricing: { type: "paid", label: "Usage-based" },
    action: { label: "Deploy Agent", type: "unyt_app" },
    featured: true,
  },
];

// --- ANIMATED PRODUCT ICONS ---
// Inline CSS keyframes (injected once)
const AnimStyles = () => (
  <style>{`
    @keyframes mp-spin { to { transform: rotate(360deg) } }
    @keyframes mp-pulse { 0%,100% { opacity: .4 } 50% { opacity: 1 } }
    @keyframes mp-float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-3px) } }
    @keyframes mp-dash { to { stroke-dashoffset: -20 } }
    @keyframes mp-orbit { to { transform: rotate(360deg) } }
    @keyframes mp-glow { 0%,100% { filter: drop-shadow(0 0 2px var(--glow)) } 50% { filter: drop-shadow(0 0 6px var(--glow)) } }
    @keyframes mp-wave { 0% { transform: scaleY(0.3) } 50% { transform: scaleY(1) } 100% { transform: scaleY(0.3) } }
  `}</style>
);

const iconMap = {
  "holo-edge-hosting": (s) => (
    <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="gh1" x1="0" y1="0" x2="48" y2="48">
          <stop stopColor="#22d3ee" /><stop offset="1" stopColor="#0891b2" />
        </linearGradient>
      </defs>
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
      <circle cx="12" cy="12" r="3" fill="#22d3ee" opacity=".6" />
      <circle cx="36" cy="12" r="3" fill="#22d3ee" opacity=".6" />
      <circle cx="12" cy="36" r="3" fill="#22d3ee" opacity=".6" />
      <circle cx="36" cy="36" r="3" fill="#22d3ee" opacity=".6" />
      <line x1="24" y1="24" x2="12" y2="12" stroke="#22d3ee" strokeWidth="1" opacity=".4" strokeDasharray="3 3" style={{ animation: "mp-dash 1.5s linear infinite" }} />
      <line x1="24" y1="24" x2="36" y2="12" stroke="#22d3ee" strokeWidth="1" opacity=".4" strokeDasharray="3 3" style={{ animation: "mp-dash 1.5s linear infinite .3s" }} />
      <line x1="24" y1="24" x2="12" y2="36" stroke="#22d3ee" strokeWidth="1" opacity=".4" strokeDasharray="3 3" style={{ animation: "mp-dash 1.5s linear infinite .6s" }} />
      <line x1="24" y1="24" x2="36" y2="36" stroke="#22d3ee" strokeWidth="1" opacity=".4" strokeDasharray="3 3" style={{ animation: "mp-dash 1.5s linear infinite .9s" }} />
    </svg>
  ),
  "holo-host-happ": (s) => (
    <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      <rect x="10" y="8" width="28" height="32" rx="3" stroke="#22d3ee" strokeWidth="1.5" opacity=".5" />
      <rect x="14" y="14" width="14" height="3" rx="1" fill="#22d3ee" opacity=".4" />
      <rect x="14" y="20" width="20" height="3" rx="1" fill="#22d3ee" opacity=".3" />
      <rect x="14" y="26" width="16" height="3" rx="1" fill="#22d3ee" opacity=".2" />
      <path d="M30 34 L34 38 L42 28" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "mp-pulse 2s ease-in-out infinite" }} />
    </svg>
  ),
  "holo-mewsfeed": (s) => (
    <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      <circle cx="16" cy="20" r="6" stroke="#22d3ee" strokeWidth="1.5" opacity=".6" />
      <circle cx="32" cy="20" r="6" stroke="#22d3ee" strokeWidth="1.5" opacity=".6" />
      <circle cx="24" cy="34" r="6" stroke="#22d3ee" strokeWidth="1.5" opacity=".6" />
      <line x1="20" y1="23" x2="28" y2="23" stroke="#22d3ee" strokeWidth="1" opacity=".3" />
      <line x1="19" y1="25" x2="24" y2="30" stroke="#22d3ee" strokeWidth="1" opacity=".3" />
      <line x1="29" y1="25" x2="24" y2="30" stroke="#22d3ee" strokeWidth="1" opacity=".3" />
      <circle cx="16" cy="20" r="2" fill="#22d3ee" style={{ animation: "mp-pulse 3s ease-in-out infinite" }} />
      <circle cx="32" cy="20" r="2" fill="#22d3ee" style={{ animation: "mp-pulse 3s ease-in-out infinite 1s" }} />
      <circle cx="24" cy="34" r="2" fill="#22d3ee" style={{ animation: "mp-pulse 3s ease-in-out infinite 2s" }} />
    </svg>
  ),
  "holochain-wind-tunnel": (s) => (
    <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="gwt" x1="0" y1="24" x2="48" y2="24">
          <stop stopColor="#a78bfa" /><stop offset="1" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      {[0,1,2,3,4].map(i => (
        <rect key={i} x={8 + i * 7} y={14 + Math.abs(i-2)*4} width="5" height={20 - Math.abs(i-2)*8} rx="2" fill="url(#gwt)" opacity={0.3 + i * 0.15}
          style={{ transformOrigin: `${10.5 + i*7}px 24px`, animation: `mp-wave 1.2s ease-in-out infinite ${i * 0.15}s` }} />
      ))}
    </svg>
  ),
  "holochain-moss": (s) => (
    <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      <rect x="8" y="8" width="14" height="14" rx="3" stroke="#a78bfa" strokeWidth="1.5" opacity=".5" style={{ animation: "mp-float 3s ease-in-out infinite" }} />
      <rect x="26" y="8" width="14" height="14" rx="3" stroke="#a78bfa" strokeWidth="1.5" opacity=".5" style={{ animation: "mp-float 3s ease-in-out infinite .5s" }} />
      <rect x="8" y="26" width="14" height="14" rx="3" stroke="#a78bfa" strokeWidth="1.5" opacity=".5" style={{ animation: "mp-float 3s ease-in-out infinite 1s" }} />
      <rect x="26" y="26" width="14" height="14" rx="3" stroke="#a78bfa" strokeWidth="1.5" opacity=".5" style={{ animation: "mp-float 3s ease-in-out infinite 1.5s" }} />
      <circle cx="22" cy="15" r="1.5" fill="#a78bfa" opacity=".7" />
      <circle cx="15" cy="22" r="1.5" fill="#a78bfa" opacity=".7" />
      <circle cx="33" cy="22" r="1.5" fill="#a78bfa" opacity=".7" />
      <circle cx="22" cy="33" r="1.5" fill="#a78bfa" opacity=".7" />
    </svg>
  ),
  "unyt-circulo": (s) => (
    <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="14" stroke="#f472b6" strokeWidth="1.5" opacity=".3" />
      <circle cx="24" cy="24" r="10" stroke="#f472b6" strokeWidth="1.5" opacity=".5" />
      <g style={{ transformOrigin: "24px 24px", animation: "mp-spin 8s linear infinite" }}>
        <circle cx="24" cy="10" r="3" fill="#f472b6" opacity=".8" />
      </g>
      <g style={{ transformOrigin: "24px 24px", animation: "mp-spin 8s linear infinite reverse" }}>
        <circle cx="24" cy="38" r="2" fill="#f472b6" opacity=".5" />
      </g>
      <text x="24" y="28" textAnchor="middle" fill="#f472b6" fontSize="12" fontWeight="600" opacity=".8">$</text>
    </svg>
  ),
  "unyt-interflow": (s) => (
    <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      <path d="M8 24 Q16 10 24 24 Q32 38 40 24" stroke="#f472b6" strokeWidth="1.5" fill="none" opacity=".4" strokeDasharray="4 3" style={{ animation: "mp-dash 2s linear infinite" }} />
      <path d="M8 24 Q16 38 24 24 Q32 10 40 24" stroke="#f472b6" strokeWidth="1.5" fill="none" opacity=".4" strokeDasharray="4 3" style={{ animation: "mp-dash 2s linear infinite reverse" }} />
      <circle cx="8" cy="24" r="3" fill="#f472b6" opacity=".6" />
      <circle cx="24" cy="24" r="4" fill="#f472b6" style={{ animation: "mp-pulse 2s ease-in-out infinite" }} />
      <circle cx="40" cy="24" r="3" fill="#f472b6" opacity=".6" />
    </svg>
  ),
  "unyt-hot402": (s) => (
    <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="g402" x1="0" y1="0" x2="48" y2="48">
          <stop stopColor="#f472b6" /><stop offset="1" stopColor="#db2777" />
        </linearGradient>
      </defs>
      <rect x="10" y="14" width="28" height="20" rx="4" stroke="url(#g402)" strokeWidth="1.5" opacity=".5" />
      <circle cx="24" cy="24" r="6" stroke="#f472b6" strokeWidth="1.5" opacity=".6" />
      <path d="M22 22 L26 22 L24 26 Z" fill="#f472b6" opacity=".8" style={{ animation: "mp-pulse 1.5s ease-in-out infinite" }} />
      <rect x="14" y="18" width="4" height="2" rx="1" fill="#f472b6" opacity=".3" />
      <rect x="30" y="28" width="4" height="2" rx="1" fill="#f472b6" opacity=".3" />
    </svg>
  ),
  "unyt-depin-accounting": (s) => (
    <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      <rect x="10" y="10" width="28" height="28" rx="3" stroke="#f472b6" strokeWidth="1.5" opacity=".3" />
      <line x1="10" y1="18" x2="38" y2="18" stroke="#f472b6" strokeWidth="1" opacity=".3" />
      <line x1="22" y1="18" x2="22" y2="38" stroke="#f472b6" strokeWidth="1" opacity=".3" />
      {[0,1,2].map(i => (
        <rect key={i} x={24 + i * 0} y={22 + i * 6} width={12 - i * 3} height="3" rx="1" fill="#f472b6" opacity={0.6 - i * 0.15}
          style={{ animation: `mp-pulse 2s ease-in-out infinite ${i * 0.4}s` }} />
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
      <defs>
        <linearGradient id="gsy" x1="0" y1="0" x2="48" y2="48">
          <stop stopColor="#fb923c" /><stop offset="1" stopColor="#ea580c" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="14" stroke="url(#gsy)" strokeWidth="1.5" strokeDasharray="6 4" style={{ transformOrigin: "24px 24px", animation: "mp-spin 10s linear infinite" }} />
      <circle cx="18" cy="20" r="3" fill="#fb923c" opacity=".5" style={{ animation: "mp-float 2.5s ease-in-out infinite" }} />
      <circle cx="30" cy="20" r="3" fill="#fb923c" opacity=".5" style={{ animation: "mp-float 2.5s ease-in-out infinite .8s" }} />
      <circle cx="24" cy="30" r="3" fill="#fb923c" opacity=".5" style={{ animation: "mp-float 2.5s ease-in-out infinite 1.6s" }} />
      <line x1="18" y1="20" x2="30" y2="20" stroke="#fb923c" strokeWidth="1" opacity=".3" />
      <line x1="30" y1="20" x2="24" y2="30" stroke="#fb923c" strokeWidth="1" opacity=".3" />
      <line x1="24" y1="30" x2="18" y2="20" stroke="#fb923c" strokeWidth="1" opacity=".3" />
    </svg>
  ),
};

// Category-based fallback icons for products without specific icons (e.g. Mycelium)
const categoryIcons = {
  infrastructure: (s, color) => (
    <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      <rect x="8" y="28" width="10" height="12" rx="2" fill={color} opacity=".3" />
      <rect x="20" y="20" width="10" height="20" rx="2" fill={color} opacity=".45" />
      <rect x="32" y="14" width="10" height="26" rx="2" fill={color} opacity=".6" />
      <circle cx="13" cy="32" r="1.5" fill={color} style={{ animation: "mp-pulse 2s ease-in-out infinite" }} />
      <circle cx="25" cy="24" r="1.5" fill={color} style={{ animation: "mp-pulse 2s ease-in-out infinite .5s" }} />
      <circle cx="37" cy="18" r="1.5" fill={color} style={{ animation: "mp-pulse 2s ease-in-out infinite 1s" }} />
    </svg>
  ),
  ai: (s, color) => (
    <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="12" stroke={color} strokeWidth="1.5" opacity=".3" />
      <circle cx="24" cy="24" r="6" stroke={color} strokeWidth="1.5" opacity=".5" style={{ transformOrigin: "24px 24px", animation: "mp-spin 6s linear infinite" }} />
      <circle cx="24" cy="18" r="2" fill={color} opacity=".7" style={{ animation: "mp-pulse 1.5s ease-in-out infinite" }} />
      <circle cx="18" cy="28" r="2" fill={color} opacity=".5" style={{ animation: "mp-pulse 1.5s ease-in-out infinite .5s" }} />
      <circle cx="30" cy="28" r="2" fill={color} opacity=".6" style={{ animation: "mp-pulse 1.5s ease-in-out infinite 1s" }} />
    </svg>
  ),
};

function getProductIcon(product, size = 40) {
  if (iconMap[product.id]) return iconMap[product.id](size);
  const fallback = categoryIcons[product.category];
  if (fallback) return fallback(size, product.provider.color);
  // Generic node icon
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="8" stroke={product.provider.color} strokeWidth="1.5" opacity=".4" />
      <circle cx="24" cy="24" r="3" fill={product.provider.color} style={{ animation: "mp-pulse 2s ease-in-out infinite" }} />
    </svg>
  );
}

// --- UTILITIES ---
function fuzzyMatch(text, query) {
  if (!query) return true;
  const lower = text.toLowerCase();
  const terms = query.toLowerCase().split(/\s+/);
  return terms.every(t => lower.includes(t));
}

function getPricingSort(p) {
  if (p.pricing.type === "free") return 0;
  if (p.pricing.type === "earn") return 0.5;
  if (p.pricing.type === "freemium") return 1;
  if (p.pricing.type === "contact") return 999;
  return p.pricing.amount || 50;
}

// --- COMPONENTS ---
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
  const s = {
    beta: "bg-violet-500/15 text-violet-400 border-violet-500/20",
    coming_soon: "bg-gray-500/15 text-gray-400 border-gray-500/20",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${s[status]}`}>
      {status === "beta" ? "Beta" : "Coming Soon"}
    </span>
  );
};

const ProviderDot = ({ provider }) => (
  <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: provider.color }} />
    {provider.name}
  </span>
);

const ProductCard = ({ product, viewMode }) => {
  if (viewMode === "grid") {
    return (
      <div className="group relative flex flex-col rounded-xl border border-gray-800/80 bg-gray-900/50 p-5 transition-all duration-200 hover:border-gray-700 hover:bg-gray-900/80">
        <div className="flex items-start gap-3 mb-3">
          <div className="shrink-0 w-10 h-10 rounded-lg bg-gray-800/60 flex items-center justify-center overflow-hidden">
            {getProductIcon(product, 40)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-sm leading-tight truncate pr-2">{product.name}</h3>
            <ProviderDot provider={product.provider} />
          </div>
        </div>
        <div className="mb-2">
          <PricingBadge pricing={product.pricing} />
        </div>
        <p className="text-gray-400 text-xs leading-relaxed mb-4 line-clamp-3 flex-1">{product.description}</p>
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-800/60">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-500">{CATEGORIES[product.category]}</span>
            <StatusBadge status={product.status} />
          </div>
          <button className="text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors">
            {product.action.label} \u2192
          </button>
        </div>
      </div>
    );
  }

  // List view (default)
  return (
    <div className="group relative flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 px-5 py-4 border-b border-gray-800/60 transition-colors duration-150 hover:bg-gray-900/40 cursor-pointer">
      <div className="hidden sm:flex shrink-0 w-10 h-10 rounded-lg bg-gray-800/60 items-center justify-center overflow-hidden mt-0.5">
        {getProductIcon(product, 40)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2.5 mb-1 flex-wrap">
          <h3 className="text-white font-semibold text-[15px] leading-tight">{product.name}</h3>
          <StatusBadge status={product.status} />
          {product.specs && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-500 font-mono">
              {product.specs.location}
            </span>
          )}
        </div>
        <p className="text-gray-400 text-sm leading-relaxed mb-2 line-clamp-2">{product.description}</p>
        <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
          <ProviderDot provider={product.provider} />
          <span>\u00b7</span>
          <span>{CATEGORIES[product.category]}</span>
          {product.specs && (
            <>
              <span>\u00b7</span>
              <span className="font-mono text-gray-500">{product.specs.cpu} \u00b7 {product.specs.ram}</span>
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-2 shrink-0">
        <PricingBadge pricing={product.pricing} />
        <button className="text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white transition-all border border-gray-700/50">
          {product.action.label}
        </button>
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

// --- MAIN APP ---
export default function ProductCatalog() {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("featured");
  const [viewMode, setViewMode] = useState("list");
  const [selectedProviders, setSelectedProviders] = useState(new Set());
  const [selectedCategories, setSelectedCategories] = useState(new Set());
  const [selectedPricing, setSelectedPricing] = useState(new Set());
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const searchRef = useRef(null);

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "/" && !e.ctrlKey && !e.metaKey && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const toggleFilter = (set, setFn, value) => {
    const next = new Set(set);
    next.has(value) ? next.delete(value) : next.add(value);
    setFn(next);
  };

  const activeFilterCount = selectedProviders.size + selectedCategories.size + selectedPricing.size;

  const filtered = useMemo(() => {
    let items = PRODUCTS.filter(p => {
      if (!fuzzyMatch(`${p.name} ${p.description} ${p.provider.name} ${p.tags.join(" ")}`, search)) return false;
      if (selectedProviders.size && !selectedProviders.has(p.provider.id)) return false;
      if (selectedCategories.size && !selectedCategories.has(p.category)) return false;
      if (selectedPricing.size) {
        const types = selectedPricing;
        const pt = p.pricing.type;
        let match = false;
        if (types.has("free") && (pt === "free" || pt === "freemium")) match = true;
        if (types.has("earn") && pt === "earn") match = true;
        if (types.has("paid") && (pt === "paid" || pt === "contact")) match = true;
        if (!match) return false;
      }
      return true;
    });

    switch (sortBy) {
      case "name": items.sort((a, b) => a.name.localeCompare(b.name)); break;
      case "price_low": items.sort((a, b) => getPricingSort(a) - getPricingSort(b)); break;
      case "price_high": items.sort((a, b) => getPricingSort(b) - getPricingSort(a)); break;
      case "provider": items.sort((a, b) => a.provider.name.localeCompare(b.provider.name)); break;
      case "featured":
      default:
        items.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }
    return items;
  }, [search, sortBy, selectedProviders, selectedCategories, selectedPricing]);

  // Count products per filter for sidebar
  const providerCounts = useMemo(() => {
    const counts = {};
    PRODUCTS.forEach(p => { counts[p.provider.id] = (counts[p.provider.id] || 0) + 1; });
    return counts;
  }, []);

  const categoryCounts = useMemo(() => {
    const counts = {};
    PRODUCTS.forEach(p => { counts[p.category] = (counts[p.category] || 0) + 1; });
    return counts;
  }, []);

  const pricingCounts = useMemo(() => {
    const counts = { free: 0, earn: 0, paid: 0 };
    PRODUCTS.forEach(p => {
      if (p.pricing.type === "free" || p.pricing.type === "freemium") counts.free++;
      if (p.pricing.type === "earn") counts.earn++;
      if (p.pricing.type === "paid" || p.pricing.type === "contact") counts.paid++;
    });
    return counts;
  }, []);

  const clearAll = () => {
    setSelectedProviders(new Set());
    setSelectedCategories(new Set());
    setSelectedPricing(new Set());
    setSearch("");
  };

  const PRICING_FILTERS = [
    { key: "free", label: "Free / Freemium", description: null },
    { key: "earn", label: "Get Paid", description: "Earn HoloFuel by hosting" },
    { key: "paid", label: "Paid", description: null },
  ];

  const CheckIcon = () => (
    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );

  const FilterSidebar = ({ mobile = false }) => (
    <div>
      {/* Pricing */}
      <div className="mb-6">
        <h4 className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-3">Pricing</h4>
        {PRICING_FILTERS.map(pf => (
          <label key={pf.key} onClick={() => toggleFilter(selectedPricing, setSelectedPricing, pf.key)} className="flex items-center gap-2.5 py-1.5 cursor-pointer group">
            <span className={`w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0 ${
              selectedPricing.has(pf.key)
                ? pf.key === "earn" ? "bg-green-500 border-green-500" : "bg-cyan-500 border-cyan-500"
                : "border-gray-600 group-hover:border-gray-500"
            }`}>
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

      {/* Providers */}
      <div className="mb-6">
        <h4 className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-3">Provider</h4>
        {Object.values(PROVIDERS).map(prov => (
          <label key={prov.id} onClick={() => toggleFilter(selectedProviders, setSelectedProviders, prov.id)} className="flex items-center gap-2.5 py-1.5 cursor-pointer group">
            <span className={`w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0 ${
              selectedProviders.has(prov.id) ? "border-cyan-500" : "border-gray-600 group-hover:border-gray-500"
            }`} style={selectedProviders.has(prov.id) ? { backgroundColor: prov.color, borderColor: prov.color } : {}}>
              {selectedProviders.has(prov.id) && <CheckIcon />}
            </span>
            <span className="text-sm text-gray-300 group-hover:text-white transition-colors flex-1">{prov.name}</span>
            <span className="text-xs text-gray-600">{providerCounts[prov.id] || 0}</span>
          </label>
        ))}
      </div>

      {/* Categories */}
      <div className="mb-6">
        <h4 className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-3">Category</h4>
        {Object.entries(CATEGORIES).map(([key, label]) => (
          categoryCounts[key] ? (
            <label key={key} onClick={() => toggleFilter(selectedCategories, setSelectedCategories, key)} className="flex items-center gap-2.5 py-1.5 cursor-pointer group">
              <span className={`w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0 ${
                selectedCategories.has(key) ? "bg-cyan-500 border-cyan-500" : "border-gray-600 group-hover:border-gray-500"
              }`}>
                {selectedCategories.has(key) && <CheckIcon />}
              </span>
              <span className="text-sm text-gray-300 group-hover:text-white transition-colors flex-1">{label}</span>
              <span className="text-xs text-gray-600">{categoryCounts[key]}</span>
            </label>
          ) : null
        ))}
      </div>

      {activeFilterCount > 0 && (
        <button onClick={clearAll} className="text-xs text-gray-500 hover:text-gray-300 underline underline-offset-2 transition-colors">
          Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-100" style={{ fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif" }}>
      <AnimStyles />

      {/* Header */}
      <header className="border-b border-gray-800/60 bg-[#0a0a0f]/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">M</span>
            </div>
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
        {/* Title area */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-2">Products</h1>
          <p className="text-gray-400 text-sm">
            Decentralized hosting, tools, currencies, and infrastructure from the Holo ecosystem and partners.
          </p>
        </div>

        <div className="flex gap-8">
          {/* Sidebar - desktop */}
          <aside className="hidden lg:block w-56 shrink-0">
            <FilterSidebar />
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Search + Sort bar */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <SearchIcon />
                </div>
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search products..."
                  className="w-full h-10 pl-10 pr-10 rounded-lg bg-gray-900/80 border border-gray-800 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 focus:ring-1 focus:ring-gray-600 transition-all"
                />
                {!search && (
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                    <kbd className="text-[10px] text-gray-600 border border-gray-700 rounded px-1.5 py-0.5 font-mono">/</kbd>
                  </div>
                )}
                {search && (
                  <button onClick={() => setSearch("")} className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-300">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Mobile filter toggle */}
              <button
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="lg:hidden h-10 px-3 rounded-lg bg-gray-900/80 border border-gray-800 text-sm text-gray-400 hover:text-white flex items-center gap-2 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filters
                {activeFilterCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-cyan-500 text-white text-[10px] flex items-center justify-center">{activeFilterCount}</span>
                )}
              </button>

              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="h-10 px-3 pr-8 rounded-lg bg-gray-900/80 border border-gray-800 text-sm text-gray-300 focus:outline-none focus:border-gray-600 appearance-none cursor-pointer"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%236b7280' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 01.753 1.659l-4.796 5.48a1 1 0 01-1.506 0z'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center" }}
              >
                <option value="featured">Featured</option>
                <option value="name">Name A-Z</option>
                <option value="price_low">Price: Low \u2192 High</option>
                <option value="price_high">Price: High \u2192 Low</option>
                <option value="provider">Provider</option>
              </select>

              <div className="hidden sm:flex items-center border border-gray-800 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2.5 transition-colors ${viewMode === "grid" ? "bg-gray-800" : "hover:bg-gray-800/50"}`}
                >
                  <GridIcon active={viewMode === "grid"} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2.5 transition-colors ${viewMode === "list" ? "bg-gray-800" : "hover:bg-gray-800/50"}`}
                >
                  <ListIcon active={viewMode === "list"} />
                </button>
              </div>
            </div>

            {/* Mobile filters */}
            {showMobileFilters && (
              <div className="lg:hidden mb-4 p-4 rounded-lg bg-gray-900/80 border border-gray-800">
                <FilterSidebar mobile />
              </div>
            )}

            {/* Results count */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">{filtered.length} product{filtered.length !== 1 ? "s" : ""}</span>
              {activeFilterCount > 0 && (
                <button onClick={clearAll} className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                  Clear filters
                </button>
              )}
            </div>

            {/* Product list */}
            {viewMode === "list" ? (
              <div className="rounded-xl border border-gray-800/60 overflow-hidden bg-gray-900/20">
                {filtered.length > 0 ? (
                  filtered.map(p => <ProductCard key={p.id} product={p} viewMode="list" />)
                ) : (
                  <div className="py-16 text-center">
                    <p className="text-gray-500 text-sm">No products match your filters.</p>
                    <button onClick={clearAll} className="mt-2 text-xs text-cyan-400 hover:text-cyan-300">Clear all filters</button>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {filtered.length > 0 ? (
                  filtered.map(p => <ProductCard key={p.id} product={p} viewMode="grid" />)
                ) : (
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
