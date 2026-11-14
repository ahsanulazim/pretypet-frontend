import api from "@/axios/axiosInstance";
import CategoryProductView from "@/components/shop/CategoryProductView";

export async function generateMetadata({ params }) {
  const { category } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pretypet.com";

  try {
    const res = await api.get("/products/getProductsByCategory", {
      params: { category, limit: 1 },
    });
    const categoryData = res?.data?.category;

    const formattedName =
      categoryData?.name ||
      (category
        ? category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, " ")
        : "Category");

    const title = `${formattedName} - Pet Supplies & Accessories | PretyPet`;
    const description =
      categoryData?.description ||
      `Shop top-rated ${formattedName} products at PretyPet. High quality food, toys, and accessories for your beloved pets.`;

    return {
      title,
      description,
      alternates: {
        canonical: `${siteUrl}/products/${category}`,
      },
      openGraph: {
        title,
        description,
        url: `${siteUrl}/products/${category}`,
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
      },
    };
  } catch (error) {
    console.error("Error generating category metadata:", error?.message);
    return {
      title: "Pet Products | PretyPet",
      alternates: {
        canonical: `${siteUrl}/products/${category}`,
      },
    };
  }
}

export default async function CategoryPage({ params }) {
  const { category } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pretypet.com";

  const formattedName = category
    ? category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, " ")
    : "Category";

  // Breadcrumb structured data for search engine rich results
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
        name: "Products",
        item: `${siteUrl}/products`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: formattedName,
        item: `${siteUrl}/products/${category}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <CategoryProductView category={category} />
    </>
  );
}
