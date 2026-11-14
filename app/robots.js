export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pretypet.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard",
          "/dashboard/*",
          "/account",
          "/account/*",
          "/cart",
          "/cart/*",
          "/search",
          "/search/*",
          "/api/*",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
