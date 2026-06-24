/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  // pdfkit reads AFM font files from disk at runtime — keep it external so
  // Next.js doesn't bundle it and strip those files out of the deployment.
  serverExternalPackages: ["pdfkit"],
};
