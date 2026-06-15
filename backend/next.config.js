/** @type {import('next').NextConfig} */
const nextConfig = {
  runtime: 'nodejs',
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

module.exports = nextConfig;
