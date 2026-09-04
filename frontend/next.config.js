/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
    // Only apply rewrites if backendUrl is relative or points to localhost
    if (backendUrl.startsWith("/") || backendUrl.includes("localhost")) {
      const target = backendUrl.startsWith("/")
        ? "http://localhost:4000/api"
        : backendUrl.replace(/\/+$/, "");
      return [
        {
          source: "/api/:path*",
          destination: `${target}/:path*`,
        },
      ];
    }
    return [];
  },
};

module.exports = nextConfig;
