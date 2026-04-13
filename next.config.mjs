// Keep the production build strict so type errors fail the deployment locally
// and in CI instead of being deferred to runtime.
/** @type {import('next').NextConfig} */
const nextConfig = {
  cacheComponents: true,
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    // Restrict remote optimization to the hosts the app actually uses.
    // This keeps the image pipeline predictable and avoids opening it to
    // arbitrary third-party origins.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/v0/b/**',
      },
      {
        protocol: 'https',
        hostname: 'podcast.duolingo.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '**',
        pathname: '/**',
      },
    ],
    // A single quality level keeps generated image variants stable.
    qualities: [75],
  },
}

export default nextConfig
