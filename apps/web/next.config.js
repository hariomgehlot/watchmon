// @ts-check
 
/**
 * @type {import('next').NextConfig}
 */


const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*', // must match your backend prefix and port
      },
    ];
  },
}
 
export default nextConfig