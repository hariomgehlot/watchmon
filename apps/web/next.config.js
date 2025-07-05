// next.config.js
import withTM from 'next-transpile-modules';

console.log('Loaded next.config.js');

const withTranspileModules = withTM([
  '@repo/ui',
  '@repo/lib', // add all shared TS packages
]);

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*',
      },
    ];
  },
};

export default withTranspileModules(nextConfig);