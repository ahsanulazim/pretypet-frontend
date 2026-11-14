import api from "@/axios/axiosInstance";
import ShopNav from "@/components/product/ShopNav";
import ProductDetails from "@/components/single-product/ProductDetails";
import { notFound } from "next/navigation";

export const generateMetadata = async ({ params }) => {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pretypet.com";
  try {
    const { product, category } = await params;

    const res = await api.get("/products/getProductBySlug", {
      params: { slug: product },
    });

    const productData = res?.data;
    if (!productData?.product) {
      return { title: "Product Not Found | PretyPet" };
    }

    const { product: item } = productData;
    const title = `${item.title} | PretyPet`;
    const rawDesc =
      typeof item.description === "string" && !item.description.startsWith("{")
        ? item.description.replace(/<[^>]*>?/gm, "").slice(0, 160)
        : `Buy ${item.title} at the best price online at PretyPet. High quality pet care, quick delivery.`;

    const imageUrl =
      item.thumbnail?.url ||
      item.thumbnail ||
      (Array.isArray(item.images) && item.images[0]?.url) ||
      `${siteUrl}/assets/pretypet-logo-short.svg`;

    const canonicalUrl = `${siteUrl}/products/${encodeURIComponent(category)}/${encodeURIComponent(product)}`;

    return {
      title,
      description: rawDesc,
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title,
        description: rawDesc,
        url: canonicalUrl,
        type: "article",
        images: [
          {
            url: imageUrl,
            width: 800,
            height: 800,
            alt: item.title,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description: rawDesc,
        images: [imageUrl],
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return { title: "Product Details | PretyPet" };
  }
};

const page = async ({ params }) => {
  const { product, category } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pretypet.com";

  let productData = null;
  try {
    const res = await api.get("/products/getProductBySlug", {
      params: { slug: product },
    });
    productData = res?.data;
  } catch (error) {
    console.error("Error fetching product:", error);
    notFound();
  }

  if (!productData?.product) {
    notFound();
  }

  const currentProduct = productData.product;
  const currentCategory = productData.category;

  const categoryName =
    currentCategory?.name ||
    (typeof currentProduct.category === "string"
      ? currentProduct.category
      : category) ||
    "Shop";

  const categorySlug =
    currentCategory?.slug ||
    (typeof currentProduct.category === "string"
      ? currentProduct.category
      : category) ||
    "";

  // Fetch related products from the same category
  let relatedProducts = [];
  try {
    const catQuery =
      currentCategory?.slug || currentProduct.category || category;
    if (catQuery) {
      const relatedRes = await api.get("/products/getProductsByCategory", {
        params: { category: catQuery, limit: 8 },
      });
      const currentId = currentProduct._id?.toString() || currentProduct._id;
      const list = relatedRes?.data?.products || [];
      relatedProducts = list
        .filter((p) => (p._id?.toString() || p._id) !== currentId)
        .slice(0, 4);
    }
  } catch (error) {
    console.error("Error fetching related products:", error);
  }

  // Schema.org Product Structured Data
  const rawDesc =
    typeof currentProduct.description === "string" &&
    !currentProduct.description.startsWith("{")
      ? currentProduct.description.replace(/<[^>]*>?/gm, "").slice(0, 300)
      : `Buy ${currentProduct.title} online at PretyPet.`;

  const mainImage =
    currentProduct.thumbnail?.url ||
    currentProduct.thumbnail ||
    (Array.isArray(currentProduct.images) && currentProduct.images[0]?.url) ||
    `${siteUrl}/assets/pretypet-logo-short.svg`;

  const priceValue =
    currentProduct.price !== undefined && currentProduct.price !== null
      ? currentProduct.price
      : currentProduct.basePrice ?? 0;

  const inStock =
    currentProduct.stock > 0 ||
    currentProduct.baseStock > 0 ||
    currentProduct.hasVariations;

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: currentProduct.title,
    image: [mainImage],
    description: rawDesc,
    sku: currentProduct.sku || currentProduct._id,
    brand: {
      "@type": "Brand",
      name: currentProduct.brand || "PretyPet",
    },
    offers: {
      "@type": "Offer",
      url: `${siteUrl}/products/${encodeURIComponent(categorySlug || category)}/${encodeURIComponent(product)}`,
      priceCurrency: "USD",
      price: String(priceValue),
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: String(currentProduct.rating || "4.8"),
      reviewCount: String(currentProduct.reviewsCount || "28"),
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${siteUrl}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: categoryName,
        item: `${siteUrl}/products/${encodeURIComponent(categorySlug || category)}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: currentProduct.title,
        item: `${siteUrl}/products/${encodeURIComponent(categorySlug || category)}/${encodeURIComponent(product)}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <section className="max-w-360 mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <ShopNav
          category={categoryName}
          slug={categorySlug}
          product={currentProduct}
        />
      </section>

      <ProductDetails
        product={currentProduct}
        categoryInfo={{ name: categoryName, slug: categorySlug }}
        relatedProducts={relatedProducts}
      />
    </>
  );
};

export default page;
