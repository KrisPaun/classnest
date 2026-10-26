import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

// Политика за содржина. 'unsafe-inline' за скрипти е потребен за вградените скрипти на Next.js
// (строг режим со nonce бара middleware). Сепак се блокираат надворешни скрипти, рамки и форми.
// 'unsafe-eval' треба само за развојниот сервер.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  // HSTS само во продукција (на localhost го заглавува прелистувачот на https).
  ...(isProd ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }] : []),
];

const nextConfig: NextConfig = {
  // mysql2 е Node пакет со native делови: не се пакува во bundle, туку се вчитува од node_modules.
  serverExternalPackages: ["mysql2"],
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
