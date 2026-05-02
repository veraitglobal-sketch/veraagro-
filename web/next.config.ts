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
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
