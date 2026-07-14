/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/scope-lock",
        destination: "/calculator?step=buildplan",
        permanent: true,
      },
    ];
  },
};
