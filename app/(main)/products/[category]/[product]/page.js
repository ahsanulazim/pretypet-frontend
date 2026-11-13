import ShopNav from "@/components/product/ShopNav";
import ProductDetails from "@/components/single-product/ProductDetails";
import { getCategoryProducts, getProductBySlug } from "@/lib/productData";
import { notFound } from "next/navigation";

// Serve product pages from the static cache and refresh them in the
// background, instead of rendering (and calling the API) on every request.
// Keep this number in sync with PRODUCT_REVALIDATE in lib/productData.js.
export const revalidate = 60;

// No pages are built ahead of time; each product page is generated on its
// first visit and cached from then on.
export async function generateStaticParams() {
  return [];
}

export const generateMetadata = async ({ params }) => {
  try {
    const { product } = await params;

    const productData = await getProductBySlug(product);
    if (!productData) {
      return { title: "Product Not Found | PretyPet" };
    }

    const { product: item } = productData;
    const title = `${item.title} | PretyPet`;
    const rawDesc =
      typeof item.description === "string" && !item.description.startsWith("{")
        ? item.description.replace(/<[^>]*>?/gm, "").slice(0, 160)
        : `Buy ${item.title} at the best price online at PretyPet.`;

    const imageUrl =
      item.thumbnail?.url ||
      item.thumbnail ||
      (Array.isArray(item.images) && item.images[0]?.url) ||
      "/default-product.jpg";

    return {
      title,
      description: rawDesc,
      openGraph: {
        title,
        description: rawDesc,
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

  // Start both requests together. The category in the URL is almost always
  // the product's own category, so related products rarely need a second trip.
  const relatedFromUrlPromise = getCategoryProducts(category);
  const productData = await getProductBySlug(product);

  if (!productData) {
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

  const relatedCategory =
    currentCategory?.slug || currentProduct.category || category;
  const relatedList =
    relatedCategory === category
      ? await relatedFromUrlPromise
      : await getCategoryProducts(relatedCategory);

  const currentId = currentProduct._id?.toString() || currentProduct._id;
  const relatedProducts = relatedList
    .filter((p) => (p._id?.toString() || p._id) !== currentId)
    .slice(0, 4);

  return (
    <>
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
