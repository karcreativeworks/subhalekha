/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@workspace/ui"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "media.subhalekha.live", pathname: "/**" },
      {
        protocol: "https",
        hostname: "aidev.blr1.cdn.digitaloceanspaces.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "aidev.blr1.digitaloceanspaces.com",
        pathname: "/**",
      },
    ],
  },
}

export default nextConfig
