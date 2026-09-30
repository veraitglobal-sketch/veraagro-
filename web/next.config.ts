import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

/** Baseline hardening: does not set CSP (would need nonces; inline JSON-LD in root layout). */
const securityHeaders: { key: string; value: string }[] = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(self), interest-cohort=(), browsing-topics=()",
  },
];

if (isProd) {
  securityHeaders.push({
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  });
}

const nextConfig: NextConfig = {
  /** Marketing URLs: no trailing slash — sitemap locs and canonicals match this form. */
  trailingSlash: false,
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  output: "standalone",
  async redirects() {
    return [
      {
        source: "/admin/njiva-blockchain",
        destination: "/admin/field-blockchain",
        permanent: true,
      },
      {
        source: "/buyer/orders",
        destination: "/buyer-portal/orders",
        permanent: true,
      },
      {
        source: "/buyer/dashboard",
        destination: "/buyer-portal/dashboard",
        permanent: true,
      },
      {
        source: "/buyer/profile",
        destination: "/buyer-portal/profile",
        permanent: true,
      },
      {
        source: "/buyer/vera-standard",
        destination: "/buyer-portal/vera-standard",
        permanent: true,
      },
      /** Legacy bookmarks / emails: canonical shell is `/buyer-portal/*` (shop stays `/buyer/shop`). */
      {
        source: "/buyer",
        destination: "/buyer-portal/dashboard",
        permanent: true,
      },
      {
        source: "/buyer/history",
        destination: "/buyer-portal/history",
        permanent: true,
      },
      {
        source: "/buyer/deliveries",
        destination: "/buyer-portal/deliveries",
        permanent: true,
      },
      {
        source: "/buyer/invoices",
        destination: "/buyer-portal/invoices",
        permanent: true,
      },
      {
        source: "/buyer/analytics",
        destination: "/buyer-portal/analytics",
        permanent: true,
      },
      {
        source: "/buyer/trade-panel",
        destination: "/buyer-portal/trade-panel",
        permanent: true,
      },
      {
        source: "/buyer/inventory",
        destination: "/buyer-portal/inventory",
        permanent: true,
      },
      {
        source: "/buyer/suppliers",
        destination: "/buyer-portal/suppliers",
        permanent: true,
      },
      {
        source: "/buyer/notifications",
        destination: "/buyer-portal/dashboard",
        permanent: true,
      },
      {
        source: "/producer/dashboard",
        destination: "/grower",
        permanent: true,
      },
      /** Canonical grower fields: estate CRUD + parcels live under /grower/fields (not /producer/estates). */
      {
        source: "/producer/estates/new",
        destination: "/grower/fields",
        permanent: true,
      },
      {
        source: "/producer/estates/:id",
        destination: "/grower/fields?estate=:id",
        permanent: true,
      },
      {
        source: "/producer/estates",
        destination: "/grower/fields",
        permanent: true,
      },
      /** Common typo / legacy bookmark */
      {
        source: "/produce/field-entry",
        destination: "/producer/field-entry",
        permanent: true,
      },
      /** Canonical public URL: Investor deck (replaces Pitch deck). */
      {
        source: "/:locale/pitch-deck",
        destination: "/:locale/investor-deck/slides",
        permanent: true,
      },
      /** Grower app guide — locale-free `/grower/*` is rewritten by middleware. */
      {
        source: "/:locale/growers/mobile-app-guide",
        destination: "/:locale/grower/mobile-app-guide",
        permanent: false,
      },
      /** Legacy marketing slugs → canonical for-* pages */
      {
        source: "/:locale/growers",
        destination: "/:locale/for-growers",
        permanent: true,
      },
      {
        source: "/:locale/suppliers",
        destination: "/:locale/for-suppliers",
        permanent: true,
      },
      {
        source: "/:locale/biovera-fresh",
        destination: "/:locale/fresh-concept",
        permanent: true,
      },
      {
        source: "/:locale/logistics",
        destination: "/:locale/for-logistics",
        permanent: true,
      },
      {
        source: "/logistics-partner",
        destination: "/en/for-logistics",
        permanent: true,
      },
      /** SR-friendly marketing slug → canonical logistics page */
      {
        source: "/sr/logistika",
        destination: "/sr/for-logistics",
        permanent: true,
      },
      /** SR-friendly marketing slug → canonical growers page */
      {
        source: "/sr/proizvodjaci",
        destination: "/sr/for-growers",
        permanent: true,
      },
      /** SR-friendly marketing slug → canonical for-buyers page */
      {
        source: "/sr/za-kupce",
        destination: "/sr/for-buyers",
        permanent: true,
      },
      /** SR-friendly marketing slug → canonical suppliers page */
      {
        source: "/sr/dobavljaci",
        destination: "/sr/for-suppliers",
        permanent: true,
      },
      /** SR-friendly marketing slug → canonical about page */
      {
        source: "/sr/o-nama",
        destination: "/sr/about",
        permanent: true,
      },
      /** DE-friendly marketing slug → canonical for-buyers page */
      {
        source: "/de/fuer-einkaeufer",
        destination: "/de/for-buyers",
        permanent: true,
      },
      /** DE-friendly marketing slug → canonical growers page */
      {
        source: "/de/erzeuger",
        destination: "/de/for-growers",
        permanent: true,
      },
      /** DE-friendly marketing slug → canonical suppliers page */
      {
        source: "/de/lieferanten",
        destination: "/de/for-suppliers",
        permanent: true,
      },
      /** DE-friendly marketing slug → canonical logistics partner page */
      {
        source: "/de/logistik",
        destination: "/de/for-logistics",
        permanent: true,
      },
      /** DE-friendly marketing slug → canonical about page */
      {
        source: "/de/ueber-uns",
        destination: "/de/about",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/.well-known/apple-app-site-association",
        headers: [{ key: "Content-Type", value: "application/json" }],
      },
      {
        source: "/.well-known/assetlinks.json",
        headers: [{ key: "Content-Type", value: "application/json" }],
      },
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
