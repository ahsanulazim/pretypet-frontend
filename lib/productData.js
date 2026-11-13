// Server-side product data for the storefront product page.
//
// These use `fetch` (not axios) so Next.js can cache the responses and serve
// the product page from its static cache instead of calling the API on every
// request. Cached data is refreshed in the background after PRODUCT_REVALIDATE
// seconds.
import { cache } from "react";

export const PRODUCT_REVALIDATE = 60;

const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL;

async function getJson(path, params, tags) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${baseUrl}${path}?${query}`, {
    next: { revalidate: PRODUCT_REVALIDATE, tags },
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    // Throwing (rather than returning null) keeps the last good cached page
    // in place if the API has a temporary failure during a background refresh.
    throw new Error(`${path} failed with status ${res.status}`);
  }
  return res.json();
}

// Returns { product, category } or null when the product does not exist.
export const getProductBySlug = cache(async (slug) => {
  const data = await getJson("/products/getProductBySlug", { slug }, [
    "products",
    `product:${slug}`,
  ]);
  return data?.product ? data : null;
});

// Returns the products of a category, or [] if it cannot be loaded.
export const getCategoryProducts = cache(async (category, limit = 8) => {
  try {
    const data = await getJson(
      "/products/getProductsByCategory",
      { category, limit },
      ["products", `category:${category}`],
    );
    return data?.products || [];
  } catch (error) {
    console.error("Error fetching related products:", error);
    return [];
  }
});
