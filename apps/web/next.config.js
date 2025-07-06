// @ts-check
 
/**
 * @type {import('next').NextConfig}
 */

const nextConfig = {
  async rewrites() {
    // Use process.env.BACKEND_URL or fallback to '' (relative, same origin)
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';
    return [
      {
        source: '/api/:path*',
        // If BACKEND_URL is set, proxy to it, otherwise use relative path (same origin)
        destination: backendUrl ? `${backendUrl}/api/:path*` : '/api/:path*',
      },
    ];
  },
}
 
export default nextConfig