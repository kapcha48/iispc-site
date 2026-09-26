import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV !== "production";
const isLocalPreview = process.env.SITES_LOCAL_PREVIEW === "1";
const cmsUrl = process.env.IISPC_CMS_URL ? new URL(process.env.IISPC_CMS_URL) : null;
const isLocalCms = cmsUrl?.hostname === "127.0.0.1" || cmsUrl?.hostname === "localhost";

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob:${cmsUrl ? ` ${cmsUrl.origin}` : ""}`,
  "font-src 'self' data:",
  `connect-src 'self'${isDevelopment ? " ws: wss:" : ""}`,
  "media-src 'self'",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  ...(isDevelopment || isLocalPreview ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000",
  },
];

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowLocalIP: Boolean(isLocalCms),
    remotePatterns: [
      {
        protocol: "https",
        hostname: "iispc.org",
        pathname: "/wp-content/uploads/**",
      },
      ...(cmsUrl ? [{ protocol: cmsUrl.protocol.replace(":", "") as "http" | "https", hostname: cmsUrl.hostname, port: cmsUrl.port, pathname: "/api/media/file/**" }] : []),
    ],
  },
  async headers() {
    return [
      {
        source: "/iispc-symbol-web-2048.webp",
        headers: [{ key: "Content-Type", value: "image/webp" }],
      },
      {
        source: "/",
        headers: securityHeaders,
      },
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
