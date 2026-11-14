import api from "@/axios/axiosInstance";

export const revalidate = 3600; // revalidate sitemap every hour

export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pretypet.com";

  // 1. Core static pages
  const staticRoutes = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/offers`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/return-and-refund-policy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];

  // 2. Dynamic Categories
  let categoryRoutes = [];
  try {
    const catRes = await api.get("/categories/getAllCategories");
    const categories = Array.isArray(catRes?.data?.categories)
      ? catRes.data.categories
      : Array.isArray(catRes?.data)
      ? catRes.data
      : [];

    categoryRoutes = categories
      .filter((cat) => cat?.slug)
      .map((cat) => ({
        url: `${baseUrl}/products/${encodeURIComponent(cat.slug)}`,
        lastModified: cat.updatedAt ? new Date(cat.updatedAt) : new Date(),
        changeFrequency: "daily",
        priority: 0.8,
      }));
  } catch (error) {
    console.error("Sitemap category fetch notice:", error?.message);
  }

  // 3. Dynamic Products
  let productRoutes = [];
  try {
    const prodRes = await api.get("/products/getAllProducts", {
      params: { limit: 1000 },
    });
    const products = Array.isArray(prodRes?.data?.products)
      ? prodRes.data.products
      : [];

    productRoutes = products
      .filter((p) => p?.slug || p?._id)
      .map((p) => {
        const catSlug = p.categorySlug || p.category || "all";
        const pSlug = p.slug || p._id;
        return {
          url: `${baseUrl}/products/${encodeURIComponent(catSlug)}/${encodeURIComponent(pSlug)}`,
          lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
          changeFrequency: "weekly",
          priority: 0.7,
        };
      });
  } catch (error) {
    console.error("Sitemap product fetch notice:", error?.message);
  }

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
