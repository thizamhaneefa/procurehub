/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // load pdfjs-dist natively in Node instead of bundling it (PDF text extraction)
    serverComponentsExternalPackages: ["pdfjs-dist"],
  },
};
export default nextConfig;
