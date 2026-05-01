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
        source: "/producer/dashboard",
        destination: "/grower",
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
