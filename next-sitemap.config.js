/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  generateRobotsTxt: true,
  generateIndexSitemap: false,
  exclude: ["/account/*", "/checkout", "/orders/*", "/login", "/signup"],
  robotsTxtOptions: {
    policies: [{ userAgent: "*", allow: "/", disallow: ["/account/", "/checkout/", "/orders/"] }],
    additionalSitemaps: [],
  },
};
